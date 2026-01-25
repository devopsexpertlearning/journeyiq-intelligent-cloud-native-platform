module "vpc" {
  source       = "../../modules/vpc"
  project_id   = var.project_id
  region       = var.region
  cluster_name = var.cluster_name
}

module "gke" {
  source       = "../../modules/gke"
  project_id   = var.project_id
  region       = var.region
  cluster_name = var.cluster_name
  network_name = module.vpc.network_name
  subnet_name  = module.vpc.subnet_name
}

module "db" {
  source            = "../../modules/db"
  project_id        = var.project_id
  region            = var.region
  network_self_link = module.vpc.network_self_link
}

module "pubsub" {
  source     = "../../modules/pubsub"
  project_id = var.project_id
}

module "observability" {
  source       = "../../modules/observability"
  project_id   = var.project_id
  cluster_name = module.gke.cluster_name
}

module "artifact_registry" {
  source     = "../../modules/artifact_registry"
  project_id = var.project_id
  region     = var.region
}

