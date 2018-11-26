SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

ARTIFACTS_DIR = artifacts
BUILD_DIR = ${ARTIFACTS_DIR}/build

export SERVERLESS_STAGE := ${shell git branch | grep \* | cut -d ' ' -f2}
export AWS_ACCESS_KEY_ID := ${shell aws configure get aws_access_key_id  | tr "[:upper:]" "[:lower:]"}

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
	aws s3 sync ./chrome s3://sanity-runner-chrome-images-${AWS_PROFILE}

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
