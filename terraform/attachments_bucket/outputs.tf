output "attachments_bucket_id" {
  description = "ID of the attachments S3 bucket."
  value       = module.attachments_bucket.bucket_id
}

output "attachments_bucket_arn" {
  description = "ARN of the attachments S3 bucket."
  value       = module.attachments_bucket.bucket_arn
}
