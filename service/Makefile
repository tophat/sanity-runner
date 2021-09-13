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

ifdef CI
	ESLINT_EXTRA_ARGS=--format junit --output-file $(TEST_REPORTS_DIR)/lint/eslint.junit.xml
else
	ESLINT_EXTRA_ARGS=
endif

ESLINT_ARGS=--max-warnings 0 $(ESLINT_EXTRA_ARGS)
NODE_MODULES_BIN := node_modules/.bin
ESLINT := $(NODE_MODULES_BIN)/eslint $(ESLINT_ARGS)

.PHONY: docker
docker:
	docker build ../. -t "sanity"

.PHONY: install-mac
install-mac: docker
	docker run \
	-v $(shell pwd)/..:/sanities \
	sanity make -C /sanities/service install

.PHONY: install
install: check-versions clean
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install
	echo $(TERRAFORM_VERSION)
	curl -L -o terraform.zip "https://releases.hashicorp.com/terraform/$(TERRAFORM_VERSION)/terraform_$(TERRAFORM_VERSION)_$(OS)_${ARCH}.zip"
	unzip terraform.zip -d ${NODE_MODULES_BIN}
	rm terraform.zip

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh

.PHONY: clean
clean:
	@rm -rf node_modules
	@rm -rf "${ARTIFACTS_DIR}"

.PHONY: lint
lint:
	$(ESLINT) .

.PHONY: lint-fix
lint-fix:
	$(ESLINT) --fix .

.PHONY: build-docker
build-docker:
	@echo "Building Docker Container"
	docker build . -t ghcr.io/tophat/sanity-runner-service

.PHONY: publish-docker
publish-docker:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-service:latest ghcr.io/tophat/sanity-runner-service:${VERSION}
	docker push ghcr.io/tophat/sanity-runner-service:latest
	docker push ghcr.io/tophat/sanity-runner-service:${VERSION}
