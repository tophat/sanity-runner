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
    --output-dir <directory>          Test results output directory.
    --var [VAR=VALUE]                 Custom variables passed to all jest tests. (default: [object Object])
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
Enables 

### PAGERDUTY_ALERT
```
sanity-runner --var SLACK_ALERT=true
``` 

### APP_ENV
```
sanity-runner --var APP_ENV=true
``` 