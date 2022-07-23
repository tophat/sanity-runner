rule "terraform_module_pinned_source" {
    enabled = false
}

plugin "aws" {
    enabled = true
    version = "0.14.0"
    source  = "github.com/terraform-linters/tflint-ruleset-aws"
}
