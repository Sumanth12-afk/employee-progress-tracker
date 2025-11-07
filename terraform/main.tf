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

module "student_tracker_bucket" {
  source      = "./modules/s3_bucket"
  bucket_name = var.s3_bucket_name
  tags        = var.tags
}

