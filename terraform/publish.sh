#!/bin/bash

# Fail fast
set -u ; set -e

# Check that aws is installed
which aws > /dev/null || { echo 'ERROR: aws-cli is not installed' ; exit 1; }

# Check that docker is installed and running
which docker > /dev/null && docker ps > /dev/null || { echo 'ERROR: docker is not running' ; exit 1; }

# retag and publish to private ecr for lambda
docker inspect "${tf_source_image_uri}" || docker pull "${tf_source_image_uri}"
docker tag "${tf_source_image_uri}" "${tf_image_uri}"

# Push image
docker push ${tf_image_uri}
