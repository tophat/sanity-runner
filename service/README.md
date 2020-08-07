# sanity-runner (service)

The sanity-runner service is a lambda function that sits in AWS. It takes a [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) test file as input and returns the result of the test.

# Configuration

We currently use [serverless](https://serverless.com/framework/docs/) to deploy to AWS lambda. We use environment variables to help define resource names allowing for easy deployment of multiple sanity-runners across the same environment.

## Environment Variables

| ENV                         | Default Value                                         | Description   |
| --------------------------- |-----------------------------------------------------  |:----------------|
| `SERVERLESS_CF`             | "sanity"                                              | Name for the cloudformation stack |
| `SERVERLESS_REGION`         | self:provider.region                                  | Region to deploy the stack in|
| `SERVERLESS_TAG`            | self:provider.tag                                     | Can be used to make bucket/function name unique  |
| `SERVERLESS_ACCOUNTID`      | self:provider.tag                                     | Can be used to make bucket/function name unique |
| `SERVERLESS_S3_BUCKET_NAME` | sr-${self:custom.stage}-${self:custom.tag}            | Name of the s3 bucket associated with the sanity-runner |
| `SERVERLESS_FUNC`           | sanity-runner-${self:custom.stage}-${self:custom.tag} | Name of the Lambda function created |
| `SERVERLESS_STAGE`          | self:provider.stage                                   | Defines serverless stage |
| `SERVERLESS_VPC_ENABLED`    | "false"                                               | If "true" will deploy the lambda to a VPC. Requires `SG_ID` and `SUBNET_ID` to work |
| `SERVERLESS_SG_ID`          | "not_set"                                             | Security Group to associate with the lambda function. Requires `VPC_ENABLED="true"` |
| `SERVERLESS_SUBNET_ID`      | "not_set                                              | Subnet to associate with the lambda function. Requires `VPC_ENABLED="true"` |

## Alerting 

Sanity Runner supports two backends currently for alerting. (Pagerduty alerts and Slack messages)

### Slack

Requires a slack api key to be in AWS Secret Manager with the formatted name `sanity_runner/slack_api_token`. This secret should be set up with the secret/value pair of `secret:`slack_api_token and `value:` <insert slack_api_token>

#### SlackHandler

Requires slack integration to be enabled. Optional configuration that allows a handler to be prepended to from of slack messages. 

### Pagerduty

Requires a [Pagerduty integration key](https://developer.pagerduty.com/docs/events-api-v2/overview/). Integration keys are generated on a service level from within Pagerduty, allowing third party tools to send events to a given service without having to give account wide API access. The key should be stored in AWS Secret Manager with the formatted name `sanity_runner/pagerduty_<name of pagerduty service>`. This secret should be set up with a secret/value pair of `secret:` integration_key `value:` <integration key for intended service>. Once the integration key is setup in aws secret manager, you can use it in any test by referencing the secret name via the metadata fields.

ex)

```
/**
 * @Owner Some Team
 * @Slack #someslack-id
 * @SlackHandler @some-group-name
 * @Pagerduty pagerduty-tophat
 * @Description 
 *  - It does this
 */
```

## Quick Start

If wanting to just quickly deploy the lambda without conflicting with anything, just source [serverless.env](./serverless.env). This will set `SERVERLESS_TAG` and `SERVERLESS_STAGE` based on AWS account + git branch name.

# Deployment

## Install Depdendancies

```
make install
```

If running on a non-linux system, we recommend using `make install-mac` instead of make install. This will compile the dependencies in a linux docker container, ensuring they are compiled for the correct OS. (other wise they will compile for Mac OS and break when published to AWS Lambda)
```
make install-mac
```

## Package

Will package up the lambda into a zip file. Artifacts created while packaging can be found under the `artifacts` directory
```
make package
```

## Deploy

```
make deploy
``` 

## Cleanup
Deletes the current cloudformation stack
```
make cleanup
```
