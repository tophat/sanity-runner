data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

###
# Locals
###

locals {
    public_url = "ghcr.io/tophat/sanity-runner-service"
}

###
# ECR
###

resource "aws_ecr_repository" "this" {
  name = var.function_name
}

resource "null_resource" "push_image_to_ecr" {
  triggers = {
    container_version = var.container_version
    function_name = var.function_name
  }
  provisioner "local-exec" {
    command     = "${path.module}/publish.sh ${aws_ecr_repository.this.repository_url} ${var.container_version} ${local.public_url}"
    interpreter = ["bash", "-c"]
  }
}

###
# S3 Bucket
###

resource "aws_s3_bucket" "s3_bucket" {
  bucket_prefix = "sanity-runner-bucket-"
}


###
# IAM / Permissions
###

data "aws_iam_policy_document" "sanity_runner_policy_document" {
  version = "2012-10-17"
  statement {
    effect = "Allow"
    principals {
      type = "Service"
      identifiers = [
        "lambda.amazonaws.com"
      ]
    }
    actions = [
      "sts:AssumeRole"
    ]
  }
}

resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_iam_role" "sanity_runner_role" {
  assume_role_policy = data.aws_iam_policy_document.sanity_runner_policy_document.json
  name_prefix = "sanity-runner-role-"
  
  inline_policy {
    name = "sanity-runner-role-${resource.random_string.suffix.result}"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Action   = ["s3:GetObject", "s3:PutObject"]
          Effect   = "Allow"
          Resource = "${aws_s3_bucket.s3_bucket.arn}/*"
        },
        {
          Action   = ["secretsmanager:GetResourcePolicy", "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "secretsmanager:ListSecretVersionIds"]
          Effect   = "Allow"
          Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:sanity_runner/*"
        },
        {
          Action   = ["mobiletargeting:GetApps", "mobiletargeting:SendMessages"]
          Effect   = "Allow"
          Resource = "arn:aws:mobiletargeting:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:apps/*"
        }
      ]
    })
  }  
}

resource "aws_iam_role_policy_attachment" "vpc-policy" {
  count = (length(var.vpc_sg_ids) == 0 && length(var.vpc_subnet_ids) == 0  ) ? 0 : 1
  role       = aws_iam_role.sanity_runner_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

###
# Lambda
### 

resource "aws_lambda_function" "sanity_runner" {
  depends_on = [null_resource.push_image_to_ecr]

  function_name = var.function_name
  role          = aws_iam_role.sanity_runner_role.arn
  package_type  = "Image"
  image_uri     = "${aws_ecr_repository.this.repository_url}:${var.container_version}"

  memory_size   = var.memory_size
  timeout       = var.timeout

  vpc_config {
      security_group_ids = var.vpc_sg_ids
      subnet_ids = var.vpc_subnet_ids
  }

  environment {
      variables = {
          S3_BUCKET = aws_s3_bucket.s3_bucket.id
          SCREENSHOT_BUCKET = "${aws_s3_bucket.s3_bucket.id}/screenshots"
      }
  }
}

