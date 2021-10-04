# sanity-runner (client)

The sanity-runner client takes a suite of test files and distributes them to a different instance of the sanity-runner lambda function.  

## Usage
```
sanity-runner --test-dir path/to/tests --output-dir path/to/output/dir --lambda-function lambdafunction-name
```

## Supported Arguments

```
$sanity-runner --help

  Usage: cli [options] [options] [testPathPattern]

  Options:

    -V, --version                     output the version number
    --config <path>                   The path to a sanity runner configuration file, in the JSON syntax. It specifies how to find and execute tests. It will overridden if the corresponding flag values.
    --test-dir <directory>            Test suites directory
    --include <regexForTestFiles>     Have the client ONLY run test files matching the supplied regex
    --exclude <regexForTestFiles>     Have the client ignore NOT run test files matching the supplied regex
    --lambda-function [functionName]  The AWS Lambda function name. Default to sanity-runner-dev-default if omitted.
    --localPort [localPort]           Send tests to container instead of lambda. Used in conjuction with --local Default to 9000 if omitted.
    --local                           Enables local mode for the sanity-runner-client. Will send tests to local container instead of lambda. Used in conjuction with --containerName
    --output-dir <directory>          Test results output directory.
    --var [VAR=VALUE]                 Custom variables passed to all jest tests. (default: [object Object])
    --retry-count <retryCount>        Specify number of retries a test will perform if an error occurs (default 0)
    -h, --help                        output usage information
```

## Config File
Instead of command line arguments you may use a config file instead that can be used

```
sanity-runner --config config.json
```

Variables within the config.json must be set via camel case

### config.json
```
{
  "testDir": "./dist",
  "outputDir": "./output",
  "var": {
    "APP_ENV": "US"
  },
  "lambdaFunction": "sanity-runner-dev-default"
}
```

## Supported Variables

### SLACK_ALERT
```
sanity-runner --var SLACK_ALERT=true
``` 
Enables Slack alerts to trigger if configured

#### SLACK_CHANNELS
```
sanity-runner --var SLACK_CHANNELS=channel-name
sanity-runner --var SLACK_CHANNELS=channel-name,another-channel
sanity-runner --var SLACK_CHANNELS="channel-name another-channel"
sanity-runner --var SLACK_CHANNELS=channel-name:123123123.123
```
Defines slack channel(s) to alert to incase of errors. These are appended in conjuction to the channels defined in a tests metadata. 

Multiple channels can be defined by commas or spaces. 

Slack threads can be passed in via the format <slack_channel>:<thread_ts>

### PAGERDUTY_ALERT
```
sanity-runner --var SLACK_ALERT=true
``` 
Enables Slack alerts to trigger if configured

### APP_ENV
```
sanity-runner --var APP_ENV=true
``` 
Used in alerting to help signify which Environment the tests are running in. 


## Local Usage
You can use the `--local` and `--localPort` flags to point the sanity-runner-client to a local container running the service. This can make local debugging of the sanity-runner-service a lot easier.

Launch service container 
```
docker run -p 9000:8080 ghcr.io/tophat/sanity-runner-service:latest
```
In a seperate terminal...

```
sanity-runner-client --test-dir example/repo/sanities/ --local --output-dir output --include google-fail-example
```
NOTE: local usage of the sanity-runner-client requires only a SINGLE test being passed in. Either use a test suite with one test, or use the `--include` to regex match on a single test.