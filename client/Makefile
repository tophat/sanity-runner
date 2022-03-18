SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

VERSION := $(shell cat package.json | jq -r '.version')

ARTIFACT_DIR?=artifacts
TEST_REPORTS_DIR?=$(ARTIFACT_DIR)/reports

ifdef CI
	ESLINT_EXTRA_ARGS=--format junit --output-file $(TEST_REPORTS_DIR)/lint/eslint.junit.xml
else
	ESLINT_EXTRA_ARGS=
endif

ESLINT_ARGS=--max-warnings 0 $(ESLINT_EXTRA_ARGS)

.PHONY: install
install: check-versions
	yarn install

.PHONY: build-docker
build-docker:
ifndef CI
	@make package
endif
	@echo "Building Docker Container"
	docker build . -t ghcr.io/tophat/sanity-runner-client

.PHONY: package
package:
	yarn pkg . --out-path bin/

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh

.PHONY: clean
clean:
	@rm -rf node_modules


.PHONY: lint
lint:
	yarn eslint $(ESLINT_ARGS) .

.PHONY: lint-fix
lint-fix:
	yarn eslint $(ESLINT_ARGS) --fix .

PHONY: publish-docker
publish-docker:
	@echo "Publishing Docker Image"
	docker tag ghcr.io/tophat/sanity-runner-client:latest ghcr.io/tophat/sanity-runner-client:${VERSION}
	docker push ghcr.io/tophat/sanity-runner-client:latest
	docker push ghcr.io/tophat/sanity-runner-client:${VERSION}
