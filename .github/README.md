<div align="center"> <img src="./runner.png" width="400px;"/>

[![Builds](https://img.shields.io/circleci/project/github/tophat/sanity-runner/master.svg)](https://github.com/tophat/sanity-runner/workflows/CI/badge.svg)
[![Greenkeeper badge](https://badges.greenkeeper.io/tophat/sanity-runner.svg)](https://greenkeeper.io/) <br />
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat)](#Contributing)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![Slack workspace](https://slackinvite.dev.tophat.com/badge.svg)](https://opensource.tophat.com/slack)

</div>

# Sanity-Runner

A distributed sanity test runner.

<div align="center"> <img src="./sanity-runner-description.png"/> </div>

The Sanity Runner consists of two packages. **sanity-runner-client** and **sanity-runner-service**.

#### sanity-runner-client
The client takes a test suite of jest-puppeteer tests, splits them up, and sends each one to their own unique invocation of the lambda service. It waits on all responses and reports back the status of each test.

#### sanity-runner-service 
Takes a single jest-puppeteer test as input, runs it and returns the response. The service also has extra configuration for alerting based on results.


## [Client](../client/README.md)
### Installation
* requires aws-cli
* requires jq

```
make -C client install
```

### Package
```
# Binaries
make -C client package

# Package Binaries in docker container (optional)
make -C client build-docker 

# Link binary (optional)
ln -s ./client/bin/sanity-runner-client-<OS> /usr/local/bin/sanity-runner-client
```

`make -C client package`: Creates 3 binaries under **./client/bin/**  
`make -C client build-docker`: Packages the linux binary in a docker container for usage. Container name is: **ghcr.io/tophat/sanity-runner-client**


## [Service](../service/README.md) 
### Installation
* requires aws-cli
* requires jq

```
make -C service install
```

### Package

```
# Build and package in docker container (currently only option)
make -C service build-docker 
```
`make -C client build-docker`: Packages the code in a docker container for usage. Container name is: **ghcr.io/tophat/sanity-runner-service**


### Deploy 
* requires terraform

```
cd service/example-module
terraform apply
```

## [Usage](../client/README.md)

### Invoke Lambda
Ensure AWS Creds are setup
```
export AWS_PROFILE=<AWS account>
export AWS_REGION=<AWS region>
```

Run Client against folder with written sanity tests
```
./client/bin/sanity-runner-client-<OS> --test-dir example/repo/sanities --lambda-function <FUNCTION_NAME> --output-dir output
```

### Local

TBD

## Reccomend Project Setups 

TBD

## References

- https://github.com/smooth-code/jest-puppeteer
- https://github.com/smooth-code/jest-puppeteer/tree/master/packages/expect-puppeteer
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- https://github.com/adieuadieu/serverless-chrome

## Contributing

Thanks goes to these wonderful people [emoji key](https://github.com/kentcdodds/all-contributors#emoji-key):

| [<img src="https://avatars1.githubusercontent.com/u/42545233?s=400&v=4" width="100px;"/><br /><sub><b>Matt Haber</b></sub>](https://github.com/mhaber-tophat)<br />[💻](https://github.com/mhaber-tophat)[🚇](https://github.com/tophat/sanity-runner/commits?author=mhaber-tophat) | [<img src="https://avatars.githubusercontent.com/u/39271619?s=100" width="100px;"/><br /><sub><b>Brandon Baksh</b></sub>](https://github.com/brandonbaksh)<br />[📖](https://github.com/tophat/sanity-runner/commits?author=brandonbaksh) | [<img src="https://avatars2.githubusercontent.com/u/2723622?s=400&v=4" width="100px;"/><br /><sub><b>Martin Lai</b></sub>](https://github.com/eastenluis)<br />[💻](https://github.com/tophat/sanity-runner) |
| :---: | :---: | :---: |
| [<img src="https://avatars3.githubusercontent.com/u/76803?s=400&v=4" width="100px;"/><br /><sub><b>Martin Ringehahn</b></sub>](https://github.com/chrono)<br />[💻](https://github.com/tophat/sanity-runner) | [<img src="https://avatars3.githubusercontent.com/u/4661702?s=400&v=4" width="100px;"/><br /><sub><b>Tom Grant</b></sub>](https://github.com/tgrant59)<br />[💻](https://github.com/tophat/sanity-runner) |

We welcome contributions from the community, Top Hatters and non-Top Hatters alike. Check out our [contributing guidelines](CONTRIBUTING.md) for more details.

## Credits
Thanks to [Carol Skelly](https://github.com/iatek) for donating the github organization!
