SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)


ARTIFACTS_DIR = artifacts
BUILD_DIR = ${ARTIFACTS_DIR}/build
TEST_REPORTS_DIR ?= $(ARTIFACTS_DIR)/reports
VERSION := $(shell cat package.json | jq -r '.version')

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

.PHONY: install
install: clean
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install
	echo $(TERRAFORM_VERSION)
	curl -L -o terraform.zip "https://releases.hashicorp.com/terraform/$(TERRAFORM_VERSION)/terraform_$(TERRAFORM_VERSION)_$(OS)_${ARCH}.zip"
	unzip terraform.zip -d .cache
	rm terraform.zip

# ----- Helpers -----

.PHONY: clean
clean:
	@rm -rf node_modules
	@rm -rf "${ARTIFACTS_DIR}"
	-@rm -rf .cache

.PHONY: bundle
bundle:
	-@rm -rf dist
	@mkdir -p dist
	yarn workspace sanity-runner-service \
		esbuild \
			src/jestConfig/* --platform=node \
			--target=node14 --outdir=dist/jestConfig
	yarn workspace sanity-runner-service \
		esbuild \
			src/lambdaHandler.js --bundle --platform=node \
			--target=node14 --outfile=dist/lambdaHandler.js \
			--external:../node_modules/*

.PHONY: package
package: bundle build-docker

.PHONY: build-docker
build-docker:
	@echo "Building Docker Container"
	docker build ../ -f Dockerfile -t ghcr.io/tophat/sanity-runner-service

.PHONY: publish-docker
publish-docker:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-service:latest ghcr.io/tophat/sanity-runner-service:${VERSION}
	docker push ghcr.io/tophat/sanity-runner-service:latest
	docker push ghcr.io/tophat/sanity-runner-service:${VERSION}
