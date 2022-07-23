locals {
  source_image_uri = var.image_uri != "" ? var.image_uri : "ghcr.io/tophat/sanity-runner-service:${var.container_version}"
  image_uri        = var.image_uri != "" ? "${aws_ecr_repository.this.repository_url}:${sha256(var.image_uri)}" : "${aws_ecr_repository.this.repository_url}:${var.container_version}"
}
