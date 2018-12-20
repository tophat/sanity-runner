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

.PHONE: docker
docker:
	docker build ../. -t "sanity"

.PHONE: install-mac
install-mac: docker
	docker run \
	-v $(shell pwd)/..:/sanities \
	sanity make -C /sanities/service install

.PHONY: install
install: check-versions clean
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install

.PHONY: invoke
invoke: check-versions
	serverless invoke local --function sanityLauncher --path test/sampleData.json

.PHONY: invoke-remote
invoke-remote: check-versions
	serverless invoke --function sanityLauncher --path test/sampleData.json

.PHONY: tail
tail: check-versions
	serverless logs --function sanityLauncher --tail


.PHONY: package
package: check-versions
	@rm -rf "${BUILD_DIR}"
	serverless package --package "${BUILD_DIR}"

.PHONY: deploy
deploy: check-versions download-serverless-chrome
	serverless deploy --package "${BUILD_DIR}"
	aws s3 sync ./chrome s3://sr-chrome-${SERVERLESS_STAGE}-${SERVERLESS_TAG}

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh


.PHONY: download-serverless-chrome
download-serverless-chrome:
	OUTPUT_DIR=./chrome ../infrastructure/scripts/download-serverless-chrome.sh

.PHONY: clean
clean:
	@rm -rf .serverless
	@rm -rf node_modules
	@rm -rf "${ARTIFACTS_DIR}"

.PHONY: lint
lint:
	$(ESLINT) .

.PHONY: lint-fix
lint-fix:
	$(ESLINT) --fix .
