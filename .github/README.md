<div align="center"> <img src="./runner.png" width="400px;"/>

[![Builds](https://img.shields.io/circleci/project/github/tophat/sanity-runner/master.svg)](https://circleci.com/gh/tophat/sanity-runner)
[![All Contributors](https://img.shields.io/badge/all_contributors-5-orange.svg?style=flat)](#Contributing)
[![Maturity badge - level 2](https://img.shields.io/badge/Maturity-Level%202%20--%20First%20Release-yellowgreen.svg)](https://github.com/tophat/getting-started/blob/master/scorecard.md)
[![Slack workspace](https://slackinvite.dev.tophat.com/badge.svg)](https://tophat-opensource.slack.com/)

</div>

# Sanity-Runner

A distributed sanity test runner.

## Installation

### Bootstrap Scripts

#### Serverless // Lambda
```
nvm use
export AWS_PROFILE=<AWS account>
export AWS_REGION=<AWS region>

bash service/boostrap.sh                    # Deploy current source
bash service/boostrap.sh -v latest          # Deploy Latest Release
bash service/boostrap.sh -v X.X.X           # Deploy specific release
```
#### Client
Default installs binary to /usr/local/bin/sanity-runner
```
bash client/bootstrap.sh                    # gets latest client binary release
bash client/bootstrap.sh -v X.X.X           # gets specific release of client binary
bash client/bootstrap.sh -p <path>           # installs binary to specfied path
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
