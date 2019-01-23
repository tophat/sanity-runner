SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

.PHONY: install
install: check-versions
	yarn install

.PHONY: package
package:
	pkg . --out-path bin/

.PHONY: release-version
release-version:
	./scripts/version.sh

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh

.PHONY: clean
clean:
	@rm -rf node_modules

.PHONY: build-docker
build-docker:
	@echo "Building Docker Container"
	docker build . -t tophat/sanity-runner
