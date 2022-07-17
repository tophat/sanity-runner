SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

TERRAFORM_VERSION=1.0.2

OS = $(shell uname|tr A-Z a-z)
ifeq ($(shell uname -m),x86_64)
  ARCH ?= amd64
endif
ifeq ($(shell uname -m),i686)
  ARCH ?= 386
endif
ifeq ($(shell uname -m),aarch64)
  ARCH ?= arm
endif

.PHONY: terraform-dependencies
terraform-dependencies:
	echo $(TERRAFORM_VERSION)
	curl -L -o terraform.zip "https://releases.hashicorp.com/terraform/$(TERRAFORM_VERSION)/terraform_$(TERRAFORM_VERSION)_$(OS)_${ARCH}.zip"
	unzip terraform.zip -d .cache
	rm terraform.zip
