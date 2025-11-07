output "s3_bucket_id" {
  description = "ID of the provisioned S3 bucket."
  value       = module.student_tracker_bucket.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the provisioned S3 bucket."
  value       = module.student_tracker_bucket.bucket_arn
}

