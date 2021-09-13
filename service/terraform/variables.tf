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