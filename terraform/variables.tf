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

variable "github_oidc_sub_prefix" {
  description = "OIDC subject prefix of the repository allowed to assume the deploy role. The repository uses immutable subjects (owner and repo with their IDs); read it with `gh api repos/OWNER/REPO/actions/oidc/customization/sub`."
  type        = string
  default     = "repo:sei40kr@11665236/madori@1438352034"
}
