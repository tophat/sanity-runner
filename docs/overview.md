---
id: overview
title: Overview
---

[![Builds](https://img.shields.io/circleci/project/github/tophat/sanity-runner/master.svg)](https://circleci.com/gh/tophat/sanity-runner)
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat)](#Contributing)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![Slack workspace](https://slackinvite.dev.tophat.com/badge.svg)](https://opensource.tophat.com/slack)

## About
A distributed sanity test runner.

Allows you to automate your sanities tests against a chrome browser running in AWS Lambda. This can be implemented into deployment pipelines for easy post-deploy tests or can be ran on the regular to determine if your site starts regressing

## Installation
* requires aws-cli
* requires jq


### Bootstrap Scripts
latest release 
```
npm install -g serverless@1.27.3
curl -o sanity-runner-bootstrap.sh -L https://raw.githubusercontent.com/tophat/sanity-runner/master/bootstrap.sh
sh sanity-runner-bootstrap.sh
```

specific git release 
```
npm install -g serverless@1.27.3
curl -o sanity-runner-bootstrap.sh -L https://raw.githubusercontent.com/tophat/sanity-runner/master/bootstrap.sh
sh sanity-runner-bootstrap.sh -v X.X.X
```

### Build From Source

#### Serverless // Lambda
```
export AWS_PROFILE=<AWS account>
export AWS_REGION=<AWS region>
make -C service install-ci
make -C service package
make -C service deploy
```

#### Client
```
make -C client install
make -C client package
```

## Usage

Ensure AWS Creds are setup
```
export AWS_PROFILE=<AWS account>
export AWS_REGION=<AWS region>
```

Run Client against folder with written sanity tests
```
sanity-runner --test-dir example/repo/sanities --output-dir output
```

## Links

You can view the [README on GitHub](http://github.com/tophat/sanity-runner) for more information about the project, including more documentation and how to contribute.

This light weight sanitiy tests runner is meant to be used with knowledge of the following resources:

- https://github.com/smooth-code/jest-puppeteer
- https://github.com/smooth-code/jest-puppeteer/tree/master/packages/expect-puppeteer
- https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Selectors
- https://github.com/adieuadieu/serverless-chrome
