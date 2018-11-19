SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

ARTIFACTS_DIR = artifacts
BUILD_DIR = ${ARTIFACTS_DIR}/build

.PHONY: install
install: check-versions clean
	yarn install

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
deploy: check-versions
	serverless deploy --package "${BUILD_DIR}"
	aws s3 sync ./chrome s3://thm-chrome-images-dev  --no-progress

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh

.PHONY: install-ci
install-ci:
	PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn install

.PHONY: clean
clean:
	@rm -rf .serverless
	@rm -rf node_modules
	@rm -rf "${ARTIFACTS_DIR}"
