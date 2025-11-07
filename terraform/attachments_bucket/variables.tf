variable "aws_region" {
  description = "AWS region where the attachments bucket will be provisioned."
  type        = string
  default     = "ap-south-1"
}

variable "attachments_bucket_name" {
  description = "Name of the S3 bucket for storing student attachments."
  type        = string
  default     = "student-tracker-attachments"
}

variable "tags" {
  description = "Common tags applied to resources."
  type        = map(string)
  default = {
    Project     = "student-progress-tracker"
    Environment = "dev"
  }
}
