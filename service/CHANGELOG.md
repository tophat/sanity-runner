# Changelog

<!-- MONODEPLOY:BELOW -->

## [4.0.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@4.0.0-rc.0...sanity-runner-service@4.0.0) "sanity-runner-service" (2022-05-24)<a name="4.0.0"></a>

### Breaking Changes

* See puppeteer changelog for entries from v10 to v14. This also updates the version of chromium used to 102.0.5002.0 (r991974). ([4a838c0](https://github.com/tophat/sanity-runner/commits/4a838c0))
* Upgrade to Jest 28. Please see Jest v28 changelog for details. ([92f1fd5](https://github.com/tophat/sanity-runner/commits/92f1fd5))

### Bug Fixes

* add temporary logging (#277) ([847877e](https://github.com/tophat/sanity-runner/commits/847877e))
* target node 16 in lambda build ([4e48254](https://github.com/tophat/sanity-runner/commits/4e48254))

### Features

* upgrade puppeteer from v10 to v14 (#288) ([4a838c0](https://github.com/tophat/sanity-runner/commits/4a838c0))
* upgrade to jest 28 ([92f1fd5](https://github.com/tophat/sanity-runner/commits/92f1fd5))

### Reverts

* Revert [40f7675](https://github.com/tophat/sanity-runner/commits/40f7675): "fix: add temporary logging (#277)" ([b268fd5](https://github.com/tophat/sanity-runner/commits/b268fd5))




## [4.0.0-rc.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.5.0...sanity-runner-service@4.0.0-rc.0) "sanity-runner-service" (2022-05-20)<a name="4.0.0-rc.0"></a>

### Breaking Changes

* See puppeteer changelog for entries from v10 to v14. This also updates the version of chromium used to 102.0.5002.0 (r991974). ([4a838c0](https://github.com/tophat/sanity-runner/commits/4a838c0))
* Upgrade to Jest 28. Please see Jest v28 changelog for details. ([92f1fd5](https://github.com/tophat/sanity-runner/commits/92f1fd5))

### Bug Fixes

* add temporary logging (#277) ([847877e](https://github.com/tophat/sanity-runner/commits/847877e))
* target node 16 in lambda build ([4e48254](https://github.com/tophat/sanity-runner/commits/4e48254))

### Features

* upgrade puppeteer from v10 to v14 (#288) ([4a838c0](https://github.com/tophat/sanity-runner/commits/4a838c0))
* upgrade to jest 28 ([92f1fd5](https://github.com/tophat/sanity-runner/commits/92f1fd5))

### Reverts

* Revert [40f7675](https://github.com/tophat/sanity-runner/commits/40f7675): "fix: add temporary logging (#277)" ([b268fd5](https://github.com/tophat/sanity-runner/commits/b268fd5))




## [3.5.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.4.2...sanity-runner-service@3.5.0) "sanity-runner-service" (2022-05-13)<a name="3.5.0"></a>

### Features

* update service docker image to node 16 (#285) ([e546815](https://github.com/tophat/sanity-runner/commits/e546815))




## [3.4.2](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.4.1...sanity-runner-service@3.4.2) "sanity-runner-service" (2022-04-18)<a name="3.4.2"></a>

### Bug Fixes

* truncate error message to first 3001 characters (#283) ([83bd821](https://github.com/tophat/sanity-runner/commits/83bd821))




## [3.4.1](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.4.0...sanity-runner-service@3.4.1) "sanity-runner-service" (2022-04-14)<a name="3.4.1"></a>

### Bug Fixes

* formatting issues in slack message (#282) ([a75e604](https://github.com/tophat/sanity-runner/commits/a75e604))




## [3.4.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.3.0...sanity-runner-service@3.4.0) "sanity-runner-service" (2022-04-12)<a name="3.4.0"></a>

### Features

* consolidate slack message (#281) ([7484062](https://github.com/tophat/sanity-runner/commits/7484062))




## [3.3.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.2.0...sanity-runner-service@3.3.0) "sanity-runner-service" (2022-04-12)<a name="3.3.0"></a>

### Features

* add runId to slack thread (#270) ([b94253f](https://github.com/tophat/sanity-runner/commits/b94253f))




## [3.2.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.1.1...sanity-runner-service@3.2.0) "sanity-runner-service" (2022-04-07)<a name="3.2.0"></a>

### Features

* improve console logging (#280) ([d6f860e](https://github.com/tophat/sanity-runner/commits/d6f860e))




## [3.1.1](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.1.0...sanity-runner-service@3.1.1) "sanity-runner-service" (2022-04-06)<a name="3.1.1"></a>



## [3.1.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@3.0.0...sanity-runner-service@3.1.0) "sanity-runner-service" (2022-04-06)<a name="3.1.0"></a>

### Features

* increase screenshot expiry to 30 days (#278) ([f7cdba2](https://github.com/tophat/sanity-runner/commits/f7cdba2))




## [3.0.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.10.5-rc.0...sanity-runner-service@3.0.0) "sanity-runner-service" (2022-04-05)<a name="3.0.0"></a>

### Breaking Changes

* Update to Jest 27 ([a6ed950](https://github.com/tophat/sanity-runner/commits/a6ed950))

### Bug Fixes

* do not fail on missing screenshot (#272) ([a6ed950](https://github.com/tophat/sanity-runner/commits/a6ed950))

### Features

* update jest to v27, as well as misc dependencies (#271) ([a6ed950](https://github.com/tophat/sanity-runner/commits/a6ed950))




## [2.10.5-rc.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.10.4-rc.0...sanity-runner-service@2.10.5-rc.0) "sanity-runner-service" (2022-04-05)<a name="2.10.5-rc.0"></a>

### Reverts

* Revert [40f7675](https://github.com/tophat/sanity-runner/commits/40f7675): "fix: add temporary logging (#277)" ([d64c063](https://github.com/tophat/sanity-runner/commits/d64c063))




## [2.10.4-rc.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.10.3-rc.0...sanity-runner-service@2.10.4-rc.0) "sanity-runner-service" (2022-04-05)<a name="2.10.4-rc.0"></a>

### Bug Fixes

* add temporary logging (#277) ([40f7675](https://github.com/tophat/sanity-runner/commits/40f7675))




## [2.10.3-rc.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.10.2-rc.0...sanity-runner-service@2.10.3-rc.0) "sanity-runner-service" (2022-03-30)<a name="2.10.3-rc.0"></a>

### Bug Fixes

* slack check (#275) ([bee1c5c](https://github.com/tophat/sanity-runner/commits/bee1c5c))




## [2.10.2-rc.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.10.1-rc.0...sanity-runner-service@2.10.2-rc.0) "sanity-runner-service" (2022-03-30)<a name="2.10.2-rc.0"></a>

### Bug Fixes

* ensure suites directory exists (#274) ([2c0a842](https://github.com/tophat/sanity-runner/commits/2c0a842))




## [2.10.1-rc.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.10.0-rc.0...sanity-runner-service@2.10.1-rc.0) "sanity-runner-service" (2022-03-30)<a name="2.10.1-rc.0"></a>

### Bug Fixes

* commit pre-release artifacts (#273) ([db208cc](https://github.com/tophat/sanity-runner/commits/db208cc))




## [2.9.2](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.9.1...sanity-runner-service@2.9.2) "sanity-runner-service" (2022-03-18)<a name="2.9.2"></a>

### Bug Fixes

* dependency updates (#268) ([f4c8bea](https://github.com/tophat/sanity-runner/commits/f4c8bea))




## [2.9.1](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.9.0...sanity-runner-service@2.9.1) "sanity-runner-service" (2021-10-25)<a name="2.9.1"></a>

### Bug Fixes

* fix bug with FS and upgrade lint ([3bbd5f8](https://github.com/tophat/sanity-runner/commits/3bbd5f8))
* updated yarn ([3bbd5f8](https://github.com/tophat/sanity-runner/commits/3bbd5f8))
* fix bug with FS and upgrade lint (#263) ([3bbd5f8](https://github.com/tophat/sanity-runner/commits/3bbd5f8))




## [2.9.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.8.1...sanity-runner-service@2.9.0) "sanity-runner-service" (2021-10-19)<a name="2.9.0"></a>

### Bug Fixes

* add 5 second delay and fix token ([22e6fc9](https://github.com/tophat/sanity-runner/commits/22e6fc9))
* lint ([22e6fc9](https://github.com/tophat/sanity-runner/commits/22e6fc9))

### Features

* add fullstory

* remove testing ([22e6fc9](https://github.com/tophat/sanity-runner/commits/22e6fc9))
* add fullstory (#260) ([22e6fc9](https://github.com/tophat/sanity-runner/commits/22e6fc9))




## [2.8.1](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.8.0...sanity-runner-service@2.8.1) "sanity-runner-service" (2021-10-13)<a name="2.8.1"></a>

### Bug Fixes

* fix copy pasta ([948cccc](https://github.com/tophat/sanity-runner/commits/948cccc))




## [2.8.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.7.0...sanity-runner-service@2.8.0) "sanity-runner-service" (2021-10-13)<a name="2.8.0"></a>

### Features

* fix ci for service (#259) ([12d76fc](https://github.com/tophat/sanity-runner/commits/12d76fc))




## [2.7.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.6.0...sanity-runner-service@2.7.0) "sanity-runner-service" (2021-10-13)<a name="2.7.0"></a>

### Bug Fixes

* remove debug statements ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* remove unneeded casting ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* docker tag earlier ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* based on comments

* remove duplicate channels ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))

### Features

* add localPort and update docs ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* fix json bug ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* support multi channels and threads

* doc: add docs on new var ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* release service ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))
* Support Slack multiple channel + slack threads   (#256) ([8343fbc](https://github.com/tophat/sanity-runner/commits/8343fbc))




## [2.6.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.5.1...sanity-runner-service@2.6.0) "sanity-runner-service" (2021-10-07)<a name="2.6.0"></a>

### Features

* increase timeout slightly ([efda14d](https://github.com/tophat/sanity-runner/commits/efda14d))
* increase service timeout as well ([efda14d](https://github.com/tophat/sanity-runner/commits/efda14d))
* make timeout configurable ([efda14d](https://github.com/tophat/sanity-runner/commits/efda14d))
* fix casting to int ([efda14d](https://github.com/tophat/sanity-runner/commits/efda14d))
* increase timeout slightly (#258) ([efda14d](https://github.com/tophat/sanity-runner/commits/efda14d))




## [2.5.1](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.5.0...sanity-runner-service@2.5.1) "sanity-runner-service" (2021-10-07)<a name="2.5.1"></a>

### Bug Fixes

* catch lambda errors correctly (#257) ([9210d89](https://github.com/tophat/sanity-runner/commits/9210d89))




## [2.5.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.4.0...sanity-runner-service@2.5.0) "sanity-runner-service" (2021-10-05)<a name="2.5.0"></a>

### Bug Fixes

* remove debug statements ([213f090](https://github.com/tophat/sanity-runner/commits/213f090))
* remove unneeded casting ([213f090](https://github.com/tophat/sanity-runner/commits/213f090))
* update yarn version

* dont screenshot if bucket isnt defined

* catch errors on local better

* stringify for some responses

* lint ([213f090](https://github.com/tophat/sanity-runner/commits/213f090))

### Features

* add localPort and update docs ([213f090](https://github.com/tophat/sanity-runner/commits/213f090))
* fix json bug ([213f090](https://github.com/tophat/sanity-runner/commits/213f090))




## [2.4.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.3.0...sanity-runner-service@2.4.0) "sanity-runner-service" (2021-09-22)<a name="2.4.0"></a>

### Features

* update more readme ([e592868](https://github.com/tophat/sanity-runner/commits/e592868))




## [2.3.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.2.0...sanity-runner-service@2.3.0) "sanity-runner-service" (2021-09-22)<a name="2.3.0"></a>

### Features

* publish client docker as well ([737b0ed](https://github.com/tophat/sanity-runner/commits/737b0ed))




## [2.2.0](https://github.com/tophat/sanity-runner/compare/sanity-runner-service@2.1.0...sanity-runner-service@2.2.0) "sanity-runner-service" (2021-09-22)<a name="2.2.0"></a>

### Features

* git changes ([5eab448](https://github.com/tophat/sanity-runner/commits/5eab448))


