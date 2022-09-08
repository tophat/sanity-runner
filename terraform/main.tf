data "aws_region" "current" {}
data "aws_caller_identity" "current" {}


/**
 * We create a private ECR repository where we'll copy the public image.
 */
resource "aws_ecr_repository" "this" {
  name = var.function_name
}

/**
 * Generate the provisioner script which we'll use to download the
 * public image and re-upload to the private ECR repository.
 */
data "template_file" "build_push_docker" {
  template = file("${path.module}/publish.sh")
  vars = {
    tf_image_uri        = local.image_uri
    tf_source_image_uri = local.source_image_uri
  }
}

resource "local_file" "build_push_docker" {
  filename = "${path.module}/tmp/build-publish.sh"
  content  = data.template_file.build_push_docker.rendered
}

resource "null_resource" "push_image_to_ecr" {
  triggers = {
    source_image_uri = local.source_image_uri
    image_uri        = local.image_uri
    function_name    = var.function_name
  }

  provisioner "local-exec" {
    command     = "${path.module}/tmp/build-publish.sh"
    interpreter = ["bash", "-c"]
  }
}


/**
 * S3 bucket for storing screenshots and other reporter assets.
 */
resource "aws_s3_bucket" "s3_bucket" {
  bucket_prefix = "sanity-runner-bucket-"
  force_destroy = true
}


/**
 * IAM/Permissions for accessing secrets and launching the Lambda.
 */
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
  name_prefix        = "sanity-runner-role-"

  inline_policy {
    name = "sanity-runner-role-${resource.random_string.suffix.result}"
    policy = jsonencode({
      Version = "2012-10-17"
      Statement = [
        // For accessing the s3 bucket for screenshots + reports.
        {
          Action   = ["s3:GetObject", "s3:PutObject"]
          Effect   = "Allow"
          Resource = "${aws_s3_bucket.s3_bucket.arn}/*"
        },
        // To access sanity runner secrets.
        {
          Action   = ["secretsmanager:GetResourcePolicy", "secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret", "secretsmanager:ListSecretVersionIds"]
          Effect   = "Allow"
          Resource = "arn:aws:secretsmanager:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:secret:sanity_runner/*"
        },
        // For SMS support.
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
  count      = (length(var.vpc_sg_ids) == 0 && length(var.vpc_subnet_ids) == 0) ? 0 : 1
  role       = aws_iam_role.sanity_runner_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

/**
 * The Lambda where we'll run the Sanity Runner service.
 */
resource "aws_lambda_function" "sanity_runner" {
  depends_on = [null_resource.push_image_to_ecr]

  function_name = var.function_name
  role          = aws_iam_role.sanity_runner_role.arn
  package_type  = "Image"
  image_uri     = local.image_uri

  memory_size = var.memory_size
  timeout     = var.timeout

  vpc_config {
    security_group_ids = var.vpc_sg_ids
    subnet_ids         = var.vpc_subnet_ids
  }

  environment {
    variables = merge({
      S3_BUCKET         = aws_s3_bucket.s3_bucket.id
      SCREENSHOT_BUCKET = "${aws_s3_bucket.s3_bucket.id}/screenshots"
      // DD_SERVICE is used by Datadog if the Datadog image is used
      DD_SERVICE = var.function_name
    }, var.environment)
  }
}
