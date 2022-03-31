<div align="center"> <img src="./.github/runner.png" width="400px;"/>

[![CI](https://github.com/tophat/sanity-runner/actions/workflows/cicd.yml/badge.svg)](https://github.com/tophat/sanity-runner/actions/workflows/cicd.yml)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![Discord](https://img.shields.io/discord/809577721751142410)](https://discord.gg/YhK3GFcZrk)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->

</div>

# Sanity-Runner

A distributed sanity test runner.

<div align="center"> <img src="./.github/sanity-runner-description.png"/> </div>

## Workspaces

The Sanity Runner consists of two workspaces managed via Yarn Berry workspaces: **sanity-runner-client** and **sanity-runner-service**. You can find the latest release on [GitHub Releases](https://github.com/tophat/sanity-runner/releases) and the published docker images on [GitHub Packages](https://github.com/orgs/tophat/packages?repo_name=sanity-runner).

### sanity-runner-client

The client is the Command Line Interface used to communicate with the distributed service. It takes a collection of jest-puppeteer based tests and distributes them among individual invocations of the sanity runner service (hosted on AWS lambda). The client will hang until all lambdas finish executing, and report back the results for each test.

#### sanity-runner-service

The service, which is shipped as a lambda docker container, parses a jest-puppeteer test from the lambda invocation event, runs it, and returns the response. There is additional configuration for success and failure alerting, such as posting to Slack, or trigger PagerDuty.

## Getting Started

The lambda service infrastructure is shipped as a terraform module, hosted in this git repository. In your own private infrastructure repository, you can reference the terraform module like so:

```tf
locals {
    function_name = "sanity-runner"
}

module "sanity-runner" {
  source                      = "git@github.com:tophat/sanity-runner.git//service/terraform?ref=v0.11.1"
  function_name               = local.function_name
  container_version           = "latest"
  vpc_subnet_ids              = var.vpc_subnet_ids
  vpc_sg_ids                  = var.vpc_sg_ids
}
```

You can change the `container_version` to point to a specific version, `latest`, or `next` (for pre-releases). It is recommended to hardcode the exact version. This version corresponds to the sanity-runner-service version, which you can find in [GitHub Releases](https://github.com/tophat/sanity-runner/releases).

Once your terraform modules are configured and deployed, you can invoke the client. Note that each test file being sent to the distributed service must be self-contained. If referencing "helper/util" files, or any other external modules, use a bundler such as webpack or esbuild to ensure a single file per test case (yes, test case not test suite).

The client is shipped as both a binary and as a docker image. The docker image is recommended.

## Contributing

### Quick Start

Open 2 terminals, one for the service and one for the client.

In the service terminal execute:

```sh
make -C service package && docker run -p 9000:8080 ghcr.io/tophat/sanity-runner-service:latest
```

One the service is up and running, execute:

```sh
yarn node $(yarn workspace sanity-runner-client bin sanity-runner) --test-dir example/repo/sanities/ --local --output-dir output --include google-fail-example
```

For more information about the [Client](./client/README.md) and [Service](./service/README.md), see the respective READMEs.

## References

- https://github.com/smooth-code/jest-puppeteer
- https://github.com/smooth-code/jest-puppeteer/tree/master/packages/expect-puppeteer
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- https://github.com/adieuadieu/serverless-chrome

## Contributors

Thanks goes to these wonderful people [emoji key](https://github.com/kentcdodds/all-contributors#emoji-key):

| [<img src="https://avatars1.githubusercontent.com/u/42545233?s=400&v=4" width="100px;"/><br /><sub><b>Matt Haber</b></sub>](https://github.com/mhaber-tophat)<br />[💻](https://github.com/mhaber-tophat)[🚇](https://github.com/tophat/sanity-runner/commits?author=mhaber-tophat) | [<img src="https://avatars.githubusercontent.com/u/39271619?s=100" width="100px;"/><br /><sub><b>Brandon Baksh</b></sub>](https://github.com/brandonbaksh)<br />[📖](https://github.com/tophat/sanity-runner/commits?author=brandonbaksh) | [<img src="https://avatars2.githubusercontent.com/u/2723622?s=400&v=4" width="100px;"/><br /><sub><b>Martin Lai</b></sub>](https://github.com/eastenluis)<br />[💻](https://github.com/tophat/sanity-runner) |
| :---: | :---: | :---: |
| [<img src="https://avatars3.githubusercontent.com/u/76803?s=400&v=4" width="100px;"/><br /><sub><b>Martin Ringehahn</b></sub>](https://github.com/chrono)<br />[💻](https://github.com/tophat/sanity-runner) | [<img src="https://avatars3.githubusercontent.com/u/4661702?s=400&v=4" width="100px;"/><br /><sub><b>Tom Grant</b></sub>](https://github.com/tgrant59)<br />[💻](https://github.com/tophat/sanity-runner) |

We welcome contributions from the community, Top Hatters and non-Top Hatters alike. Check out our [contributing guidelines](CONTRIBUTING.md) for more details.

## Credits

Thanks to [Carol Skelly](https://github.com/iatek) for donating the github organization!
