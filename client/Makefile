SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

ARTIFACT_DIR?=artifacts
TEST_REPORTS_DIR?=$(ARTIFACT_DIR)/reports

ifdef CI
	ESLINT_EXTRA_ARGS=--format junit --output-file $(TEST_REPORTS_DIR)/lint/eslint.junit.xml
else
	ESLINT_EXTRA_ARGS=
endif

ESLINT_ARGS=--max-warnings 0 $(ESLINT_EXTRA_ARGS)
NODE_MODULES_BIN := ./node_modules/.bin
ESLINT := $(NODE_MODULES_BIN)/eslint $(ESLINT_ARGS)

.PHONY: install
install: check-versions
	yarn install

.PHONY: package
package:
	pkg . --out-path bin/

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh

.PHONY: clean
clean:
	@rm -rf node_modules

.PHONY: lint
lint:
	$(ESLINT) .

.PHONY: lint-fix
lint-fix:
	$(ESLINT) --fix .
