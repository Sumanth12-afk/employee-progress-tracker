variable "aws_region" {
  description = "AWS region where resources will be provisioned."
  type        = string
  default     = "ap-south-1"
}

variable "s3_bucket_name" {
  description = "Name of the S3 bucket for student tracker data."
  type        = string
  default     = "student-tracker-data"
}

variable "tags" {
  description = "Common tags applied to resources."
  type        = map(string)
  default = {
    Project     = "student-progress-tracker"
    Environment = "dev"
  }
}

