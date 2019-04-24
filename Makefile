SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

.PHONY: install
install: check-versions
	yarn install

.PHONY: deploy-release-dry
deploy-release-dry:
	yarn run semantic-release --dry-run

.PHONY: deploy-release
deploy-release:
	yarn run semantic-release

.PHONY: create-release-package
create-release-package:
	rm -rf release-archive
	mkdir release-archive
	tar cvf sanity-runner-serverless.tar service/artifacts/build/
	mv sanity-runner-serverless.tar release-archive/
	mv client/bin/* release-archive/

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@./infrastructure/scripts/check-versions.sh



