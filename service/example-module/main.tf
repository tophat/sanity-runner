locals {
    function_name = "sanity-runner-example"
    version = "2.2.0"
}

module "sanity-runner" {
  source                      = "../terraform"
  function_name		          = local.function_name
  container_version           = local.version
}