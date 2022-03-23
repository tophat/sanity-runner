SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

ARTIFACTS_DIR = artifacts
BUILD_DIR = ${ARTIFACTS_DIR}/build
TEST_REPORTS_DIR ?= $(ARTIFACTS_DIR)/reports

.PHONY: install
install:
	yarn install

.PHONY: deploy-release-dry
deploy-release-dry: install
	yarn monodeploy \
	 --config-file monodeploy.config.js \
	 --log-level 0 \
	 --dry-run

.PHONY: deploy-release
deploy-release: install
	yarn monodeploy \
	 --config-file monodeploy.config.js \
	 --log-level 0 \
	 --push \
	 --auto-commit

.PHONY: create-release-package
create-release-package:
	rm -rf release-archive
	mkdir release-archive
	mv client/bin/* release-archive/


ifdef CI
    ESLINT_EXTRA_ARGS=--format junit --output-file $(TEST_REPORTS_DIR)/lint/eslint.junit.xml
else
    ESLINT_EXTRA_ARGS=
endif

ESLINT_ARGS=--max-warnings 0 $(ESLINT_EXTRA_ARGS)

.PHONY: lint
lint: install
	yarn eslint $(ESLINT_ARGS) .

.PHONY: lint-fix
lint-fix: install
	yarn eslint $(ESLINT_ARGS) --fix .
