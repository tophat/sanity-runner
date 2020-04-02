# sanity-runner (service)

The sanity-runner service is a lambda function that sits in AWS. It takes a [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) test file as input and returns the result of the test.

# Configuration

We currently use [serverless](https://serverless.com/framework/docs/) to deploy to AWS lambda. We use Environment variables to help define resource names allowing for easy deployment of multiple sanity-runners across the same envrionment.

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


## Quick Start

If wanting to just quickly deploy the lambda without conflicting with anything, just source [serverless.env](./serverless.env). This will set `SERVERLESS_TAG` and `SERVERLESS_STAGE` based on AWS account + git branch name.

# Deployment

## Install Depdendancies

```
make install
```

If Running on a non-linux system, we reccomend using `make install-mac` instead of make install. This will compile the dependancies in a linux docker container, ensuring they are compiled for the correct OS. (other wise they will compile for Mac OS and break when published to AWS Lambda)
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
