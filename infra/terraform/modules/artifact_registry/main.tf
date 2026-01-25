variable "project_id" {}
variable "region" {}

resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "journeyiq-services"
  description   = "Docker repository for JourneyIQ Microservices"
  format        = "DOCKER"
  project       = var.project_id
}

output "repository_url" {
  value = "${var.region}-docker.pkg.dev/${var.project_id}/${google_artifact_registry_repository.repo.repository_id}"
}
