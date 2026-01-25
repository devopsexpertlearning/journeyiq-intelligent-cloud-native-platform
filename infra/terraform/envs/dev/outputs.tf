output "cluster_endpoint" {
  value       = module.gke.cluster_endpoint
  description = "GKE Cluster Endpoint"
  sensitive   = true
}

output "database_connection" {
  value       = module.db.connection_name
  description = "Cloud SQL Connection Name"
}

output "vpc_name" {
  value = module.vpc.network_name
}
