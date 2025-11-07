terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

module "attachments_bucket" {
  source      = "../modules/s3_bucket"
  bucket_name = var.attachments_bucket_name
  tags        = merge(var.tags, { Purpose = "attachments" })
}
