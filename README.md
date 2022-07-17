<div align="center"> <img src="./.github/runner.png" width="400px;"/>

[![CI](https://github.com/tophat/sanity-runner/actions/workflows/cicd.yml/badge.svg)](https://github.com/tophat/sanity-runner/actions/workflows/cicd.yml)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![Discord](https://img.shields.io/discord/809577721751142410)](https://discord.gg/YhK3GFcZrk)

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-12-orange.svg?style=flat-square)](#contributors-)
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
yarn workspace sanity-runner-service dev
```

One the service is up and running, execute:

```sh
yarn dev --test-dir example/repo/sanities/ --include google-fail-example -vv
```

For more information about the [Client](./client/README.md) and [Service](./service/README.md), see the respective READMEs.

## References

- https://github.com/smooth-code/jest-puppeteer
- https://github.com/smooth-code/jest-puppeteer/tree/master/packages/expect-puppeteer
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- https://github.com/adieuadieu/serverless-chrome

## Contributors

Thanks goes to these wonderful people [emoji key](https://github.com/kentcdodds/all-contributors#emoji-key):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://github.com/mattthaber"><img src="https://avatars.githubusercontent.com/u/42545233?v=4?s=100" width="100px;" alt=""/><br /><sub><b>mattthaber</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=mattthaber" title="Code">💻</a> <a href="#infra-mattthaber" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://noahnu.com/"><img src="https://avatars.githubusercontent.com/u/1297096?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Noah</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=noahnu" title="Code">💻</a> <a href="#infra-noahnu" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://www.linkedin.com/in/brandonbaksh/"><img src="https://avatars.githubusercontent.com/u/39271619?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brandon Baksh</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=brandonbaksh" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/eastenluis"><img src="https://avatars.githubusercontent.com/u/2723622?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Martin Lai</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=eastenluis" title="Code">💻</a></td>
    <td align="center"><a href="http://www.linkedin.com/profile/view?id=245244184"><img src="https://avatars.githubusercontent.com/u/4661702?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tom Grant</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=tgrant59" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/chrono"><img src="https://avatars.githubusercontent.com/u/76803?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Martin Ringehahn</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=chrono" title="Code">💻</a></td>
    <td align="center"><a href="https://jakebolam.com/"><img src="https://avatars.githubusercontent.com/u/3534236?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jake Bolam</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=jakebolam" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://gabriellesc.github.io/"><img src="https://avatars.githubusercontent.com/u/5559014?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Gabrielle Singh Cadieux</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=gabriellesc" title="Code">💻</a></td>
    <td align="center"><a href="http://dra.pe/"><img src="https://avatars.githubusercontent.com/u/539437?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Shawn Drape</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=shawndrape" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/allen-lam"><img src="https://avatars.githubusercontent.com/u/43854211?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Allen Lam</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=allen-lam" title="Code">💻</a></td>
    <td align="center"><a href="https://www.karnov.club/"><img src="https://avatars.githubusercontent.com/u/6210361?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marc Cataford</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=mcataford" title="Code">💻</a></td>
    <td align="center"><a href="https://opensource.tophat.com/"><img src="https://avatars.githubusercontent.com/u/6020693?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Shouvik DCosta</b></sub></a><br /><a href="https://github.com/tophat/sanity-runner/commits?author=sdcosta" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

We welcome contributions from the community, Top Hatters and non-Top Hatters alike. Check out our [contributing guidelines](CONTRIBUTING.md) for more details.

## Credits

Thanks to [Carol Skelly](https://github.com/iatek) for donating the github organization!
