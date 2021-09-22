SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

.PHONY: install
install: check-versions
	yarn install

.PHONY: deploy-release-dry
deploy-release-dry:
	yarn monodeploy \
	 --config-file monodeploy.config.js \
	 --log-level 0 \
	 --dry-run

.PHONY: deploy-release
deploy-release:
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

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@./infrastructure/scripts/check-versions.sh


