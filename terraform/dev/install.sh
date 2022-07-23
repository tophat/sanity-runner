#!/bin/bash -e

os=$(uname | tr A-Z a-z)

case "$(uname -m)" in
    i686) arch=386;;
    aarch64) arch=arm;;
    *) arch=amd64;;
esac

TERRAFORM_VERSION="$(cat .terraform-version)"
TFLINT_VERSION="$(cat .tflint-version)"

mkdir -p bin

if ! command bin/terraform version --json | grep $TERRAFORM_VERSION; then
    curl -L -o terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_${os}_${arch}.zip"
    unzip terraform.zip -d .
    mv terraform bin/
    rm terraform.zip
fi
if ! command bin/tflint --version | grep $TFLINT_VERSION; then
    curl -L -o tflint.zip "https://github.com/terraform-linters/tflint/releases/download/v${TFLINT_VERSION}/tflint_${os}_${arch}.zip"
    unzip tflint.zip -d .
    mv tflint bin/
    rm tflint.zip

    ./bin/tflint --init
fi
