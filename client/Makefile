SHELL := /bin/bash
export PATH := $(shell yarn bin):$(PATH)

.PHONY: install
install: check-versions
	yarn install

.PHONY: deploy-production
deploy-production:
	./scripts/deploy.sh

# ----- Helpers -----
.PHONY: check-versions
check-versions:
	@../infrastructure/scripts/check-versions.sh

.PHONY: clean
clean:
	@rm -rf node_modules
