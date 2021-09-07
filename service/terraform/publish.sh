#!/bin/bash

# Fail fast
set -u ; set -e

# This is the order of arguments
aws_ecr_repository_url=$1
tag=$2
public_repo=$3


# Check that aws is installed
which aws > /dev/null || { echo 'ERROR: aws-cli is not installed' ; exit 1; }

# Check that docker is installed and running
which docker > /dev/null && docker ps > /dev/null || { echo 'ERROR: docker is not running' ; exit 1; }

# retag and publish to private ecr for lambda 
docker pull "$public_repo:$tag"
docker tag "$public_repo:$tag" "$aws_ecr_repository_url:$tag"
docker tag "$public_repo:$tag" "$aws_ecr_repository_url:latest"

# Push image
docker push $aws_ecr_repository_url:$tag
docker push $aws_ecr_repository_url:latest
