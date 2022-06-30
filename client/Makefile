SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

VERSION := $(shell cat package.json | jq -r '.version')

ARTIFACT_DIR?=artifacts
TEST_REPORTS_DIR?=$(ARTIFACT_DIR)/reports

.PHONY: dependencies
dependencies:
	yarn install

.PHONY: install
install: clean dependencies

.PHONY: build-docker
build-docker:
ifndef CI
	@make package
endif
	@echo "Building Docker Container"
	docker build . -f client.Dockerfile -t ghcr.io/tophat/sanity-runner-client

.PHONY: typecheck
typecheck: dependencies
ifneq ($(SKIP_TYPECHECK),1)
	yarn workspace sanity-runner-client tsc -p tsconfig.json --noEmit
endif

.PHONY: bundle
bundle: dependencies typecheck
	-@rm -rf dist
	@mkdir -p dist
	yarn workspace sanity-runner-client \
		esbuild \
			src/index.ts --bundle --platform=node \
			--target=node16 --outfile=dist/index.js \
			--external:../node_modules/*

.PHONY: package
package: bundle
	-@rm -rf bin
	@mkdir -p bin
	yarn workspace sanity-runner-client pkg dist/index.js -c package.json --out-path bin/ --targets "node16-linux,node16-macos,node16-win"

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

PHONY: publish-docker-prerelease
publish-docker-prerelease:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-client:latest ghcr.io/tophat/sanity-runner-client:${VERSION}
	docker tag ghcr.io/tophat/sanity-runner-client:latest ghcr.io/tophat/sanity-runner-client:next
	docker push ghcr.io/tophat/sanity-runner-client:next
	docker push ghcr.io/tophat/sanity-runner-client:${VERSION}
