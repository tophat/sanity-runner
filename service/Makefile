SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)


ARTIFACTS_DIR = artifacts
BUILD_DIR = ${ARTIFACTS_DIR}/build
TEST_REPORTS_DIR ?= $(ARTIFACTS_DIR)/reports

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
	docker build . -t tophat/sanity-runner-service

.PHONY: publish-docker
publish-docker:
	@echo "Publishing Docker Image"
	VERSION=$(cat package.json | jq -r '.version')
	docker tag tophat/sanity-runner-service:latest tophat/sanity-runner-service:${VERSION}
	docker push tophat/sanity-runner-service@latest
	docker push tophat/sanity-runner-service@${VERSION}
