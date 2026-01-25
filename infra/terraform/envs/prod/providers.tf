terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  backend "gcs" {
    bucket = "journeyiq-tf-state"
    prefix = "env/prod"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Configure Helm provider using GKE cluster details (requires data source or outputs in real run)
# For this contract, we define the provider block layout.
provider "helm" {
  kubernetes {
    # In real usage: config_path or host/token from module outputs
    config_path = "~/.kube/config" 
  }
}

