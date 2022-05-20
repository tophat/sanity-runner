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

.PHONY: terraform-dependencies
terraform-dependencies:
	echo $(TERRAFORM_VERSION)
	curl -L -o terraform.zip "https://releases.hashicorp.com/terraform/$(TERRAFORM_VERSION)/terraform_$(TERRAFORM_VERSION)_$(OS)_${ARCH}.zip"
	unzip terraform.zip -d .cache
	rm terraform.zip

.PHONY: dependencies
dependencies:
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install

.PHONY: install
install: clean
	make terraform-dependencies
	make dependencies

# ----- Helpers -----

.PHONY: clean
clean:
	@rm -rf node_modules
	@rm -rf "${ARTIFACTS_DIR}"
	-@rm -rf .cache

.PHONY: typecheck
typecheck: dependencies
ifneq ($(SKIP_TYPECHECK),1)
	yarn workspace sanity-runner-service tsc -p tsconfig.json --noEmit
endif

.PHONY: bundle
bundle: dependencies typecheck
	-@rm -rf dist
	@mkdir -p dist
	yarn workspace sanity-runner-service \
		esbuild \
			src/jestConfig/* --platform=node \
			--target=node16 --outdir=dist/jestConfig \
			--external:../node_modules/* --bundle
	yarn workspace sanity-runner-service \
		esbuild \
			src/lambdaHandler.ts --bundle --platform=node \
			--target=node16 --outfile=dist/lambdaHandler.js \
			--external:../node_modules/*

.PHONY: package
package: bundle build-docker

.PHONY: build-docker
build-docker:
	@echo "Building Docker Container"
ifeq ($(LOCAL),1)
	docker build ../ -f service-local.Dockerfile -t ghcr.io/tophat/sanity-runner-service
else
	docker build ../ -f service.Dockerfile -t ghcr.io/tophat/sanity-runner-service
endif

.PHONY: run-local
run-local:
	@LOCAL=1 SKIP_TYPECHECK=1 make package
	docker run -p 9000:8080 --mount type=bind,source=$$(abspath ../node_modules 2>/dev/null || realpath ../node_modules),target=/var/task/node_modules --mount type=bind,source=$$(abspath ./dist 2>/dev/null || realpath ./dist),target=/var/task/service/dist,readonly ghcr.io/tophat/sanity-runner-service:latest

.PHONY: publish-docker
publish-docker:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-service:latest ghcr.io/tophat/sanity-runner-service:${VERSION}
	docker push ghcr.io/tophat/sanity-runner-service:latest
	docker push ghcr.io/tophat/sanity-runner-service:${VERSION}

.PHONY: publish-docker-prerelease
publish-docker-prerelease:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-service:latest ghcr.io/tophat/sanity-runner-service:${VERSION}
	docker tag ghcr.io/tophat/sanity-runner-service:latest ghcr.io/tophat/sanity-runner-service:next
	docker push ghcr.io/tophat/sanity-runner-service:next
	docker push ghcr.io/tophat/sanity-runner-service:${VERSION}
