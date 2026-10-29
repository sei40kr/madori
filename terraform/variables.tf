variable "project" {
  type    = string
  default = "madori"
}

variable "aws_region" {
  type    = string
  default = "ap-northeast-1"
}

variable "domain_name" {
  type    = string
  default = "madori.yong-ju.me"
}

variable "parent_zone_name" {
  description = "Existing Route53 hosted zone that contains domain_name"
  type        = string
  default     = "yong-ju.me"
}

variable "github_repository" {
  description = "owner/repo allowed to assume the deploy role via OIDC"
  type        = string
  default     = "sei40kr/madori"
}
