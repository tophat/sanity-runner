SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

VERSION := $(shell cat package.json | jq -r '.version')

ARTIFACT_DIR?=artifacts
TEST_REPORTS_DIR?=$(ARTIFACT_DIR)/reports

.PHONY: install
install:
	yarn install

.PHONY: build-docker
build-docker:
ifndef CI
	@make package
endif
	@echo "Building Docker Container"
	docker build . -f client.Dockerfile -t ghcr.io/tophat/sanity-runner-client

.PHONY: package
package:
	yarn workspace sanity-runner-client pkg . --out-path bin/ --targets "node16-linux"

# ----- Helpers -----

.PHONY: clean
clean:
	@rm -rf node_modules

PHONY: publish-docker
publish-docker:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-client:latest ghcr.io/tophat/sanity-runner-client:${VERSION}
	docker push ghcr.io/tophat/sanity-runner-client:latest
	docker push ghcr.io/tophat/sanity-runner-client:${VERSION}
