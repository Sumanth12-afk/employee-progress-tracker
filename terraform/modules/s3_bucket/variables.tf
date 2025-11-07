variable "bucket_name" {
  description = "Name of the S3 bucket."
  type        = string
}

variable "tags" {
  description = "Tags to apply to S3 bucket resources."
  type        = map(string)
  default     = {}
}

variable "force_destroy" {
  description = "Whether to force destroy the bucket even if it contains objects."
  type        = bool
  default     = false
}

variable "versioning_enabled" {
  description = "Enable versioning on the bucket."
  type        = bool
  default     = true
}
