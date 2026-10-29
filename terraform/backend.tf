terraform {
  backend "s3" {
    bucket       = "madori.yong-ju.me-tfstate"
    key          = "terraform.tfstate"
    region       = "ap-northeast-1"
    encrypt      = true
    use_lockfile = true
  }
}
