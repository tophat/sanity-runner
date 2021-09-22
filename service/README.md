# sanity-runner (service)

The sanity-runner service is a lambda function that sits in AWS. It takes a [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) test file as input and returns the result of the test.

# Deployment 

##  Terraform

We currently use [terraform](https://www.terraform.io/docs/index.html) to deploy to AWS lambda. We use [input variables](https://www.terraform.io/docs/language/values/variables.html) to help define resource names allowing for easy deployment of multiple sanity-runners across the same environment.

The prefered way to deploy the sanity runner would be reference the module in a `main.tf` file like the below example. This lets you pin to a specific version of the terraform code. 

EX)
```
locals {
    function_name = (terraform.workspace == "prod" || terraform.workspace == "sandbox") ? "sanity-runner" : "sanity-runner-${terraform.workspace}"
    version = "2.0.0"
}

module "sanity-runner" {
  source                      = "git@github.com:tophat/sanity-runner.git//service/terraform?ref=${local.version}"
  function_name		          = local.function_name
  container_version           = local.version
  vpc_subnet_ids              = var.vpc_subnet_ids
  vpc_sg_ids                  = var.vpc_sg_ids
}

```


variable "function_name" {
    default = "sanity-runner"
    type = string
}

variable "container_version" {
    default = "2.0.0"
    type = string
}

variable "vpc_sg_ids" {
    type = list(string)
    default = []
}

variable "vpc_subnet_ids" {
    type = list(string)
    default = []
}

variable "memory_size" {
    type = number
    default = 2048
}

variable "timeout" {
    type = number
    default = 600
}
# Input Variables

| Variable                      | Default Value                                         | Description   |
| ----------------------------- |-----------------------------------------------------  |:----------------|
| `function_name`               | "sanity-runner"                                       | Name for the lambda function deploys |
| `container_version`           | "2.0.0"                                               | Version of Service Container to deploy to the lambda (ghcr.io/tophat/sanity-runner-service) |
| `vpc_sg_ids`                  | []                                                    | Security Group IDs to associate with lambda. Enables VPC mode. If used, requites vpc_subnet_ids to also be set  |
| `vpc_subnet_ids`              | []                                                    | Subnet Ids to associate with the lambda. Enables VPC mode. If used, requites vpc_sg_ids to also be set |
| `memory_size`                 | 2048                                                  | Memory_size for lambda  |
| `timeout`                     | 600                                                   | Sets Default timeout for lambda invocation |



# Configuration 

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


# Quick Start

## 1. Install Terraform

```
make install
```

## 2. Deploy Terraform 

```
cd terraform
../node_modules/.bin/terraform plan
../node_modules/.bin/terraform apply
```

