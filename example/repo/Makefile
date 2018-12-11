.PHONY: set-env
set-env:
ifndef APP_ENV
	echo "APP_ENV not defined, using default"
else
	cat config.json | jq '.var.APP_ENV = "$(APP_ENV)"' > tmp.json && mv tmp.json config.json
endif

.PHONY: run-tests
run-tests: install clean-webpack webpack set-env
	sanity-runner --config config.json

.PHONY: clean-webpack
clean-webpack:
	rm -rf dist/*test.js

.PHONY: webpack
webpack:
	./node_modules/.bin/webpack --config webpacker.config.js

.PHONE: install
install:
	yarn install
