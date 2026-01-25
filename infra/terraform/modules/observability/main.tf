variable "project_id" {}
variable "cluster_name" {}
variable "bucket_location" { default = "US" }

# GCS Buckets for Loki (Logs) and Tempo (Traces) long-term storage
resource "google_storage_bucket" "loki_chunks" {
  name          = "journeyiq-loki-chunks-${var.project_id}"
  location      = var.bucket_location
  force_destroy = false
  project       = var.project_id
}

resource "google_storage_bucket" "loki_ruler" {
  name          = "journeyiq-loki-ruler-${var.project_id}"
  location      = var.bucket_location
  force_destroy = false
  project       = var.project_id
}

resource "google_storage_bucket" "tempo_traces" {
  name          = "journeyiq-tempo-traces-${var.project_id}"
  location      = var.bucket_location
  force_destroy = false
  project       = var.project_id
}

# Workload Identity: GKE Service Account -> Google Service Account
resource "google_service_account" "observability_sa" {
  account_id   = "observability-sa"
  display_name = "Observability Service Account for Loki/Tempo"
  project      = var.project_id
}

resource "google_storage_bucket_iam_member" "loki_admin" {
  bucket = google_storage_bucket.loki_chunks.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.observability_sa.email}"
}

resource "google_storage_bucket_iam_member" "tempo_admin" {
  bucket = google_storage_bucket.tempo_traces.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.observability_sa.email}"
}

# Bind GKE K8s SA to Google SA
# Assuming standard namespace 'observability'
# ... existing bucket & IAM code ...

resource "google_service_account_iam_member" "workload_identity_binding" {
  service_account_id = google_service_account.observability_sa.name
  role               = "roles/iam.workloadIdentityUser"
  member             = "serviceAccount:${var.project_id}.svc.id.goog[observability/loki-sa]"
}

# HELM RELEASES FOR OBSERVABILITY

resource "helm_release" "loki" {
  name       = "loki"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "loki-stack"
  namespace  = "observability"
  create_namespace = true

  set {
    name  = "loki.persistence.enabled"
    value = "false" # Using GCS, config via values.yaml pattern usually, simplified here
  }
  # simplified config for contract demonstration
}

resource "helm_release" "tempo" {
  name       = "tempo"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "tempo"
  namespace  = "observability"
}

resource "helm_release" "grafana" {
  name       = "grafana"
  repository = "https://grafana.github.io/helm-charts"
  chart      = "grafana"
  namespace  = "observability"

  set {
    name  = "ingress.enabled"
    value = "true"
  }
  set {
    name  = "ingress.annotations.kubernetes\\.io/ingress\\.class"
    value = "gce"
  }
}

