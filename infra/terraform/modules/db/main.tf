variable "project_id" {}
variable "region" {}
variable "network_self_link" {}

# Private Service Access
resource "google_compute_global_address" "private_ip_address" {
  name          = "private-ip-address"
  purpose       = "VPC_PEERING"
  address_type  = "INTERNAL"
  prefix_length = 16
  network       = var.network_self_link
}

resource "google_service_networking_connection" "private_vpc_connection" {
  network                 = var.network_self_link
  service                 = "servicenetworking.googleapis.com"
  reserved_peering_ranges = [google_compute_global_address.private_ip_address.name]
}

resource "google_sql_database_instance" "master" {
  name             = "journeyiq-prod-db"
  region           = var.region
  database_version = "POSTGRES_15"
  project          = var.project_id

  depends_on = [google_service_networking_connection.private_vpc_connection]

  settings {
    tier = "db-custom-4-15360" # 4 vCPU, 15GB RAM
    ip_configuration {
      ipv4_enabled    = false
      private_network = var.network_self_link
    }
    backup_configuration {
      enabled = true
    }
  }
  deletion_protection = true
}

# Create Databases per service
resource "google_sql_database" "databases" {
  for_each = toset([
    "user_db", "inventory_db", "booking_db", "payment_db", "review_db",
    "search_db", "pricing_db", "ticketing_db", "notification_db",
    "analytics_db", "ai_agent_db", "rag_db", "vector_store_db"
  ])
  name     = each.key
  instance = google_sql_database_instance.master.name
}

resource "google_sql_user" "users" {
  name     = "journeyiq-app"
  instance = google_sql_database_instance.master.name
  password = "CHANGE_ME_IN_SECRET_MANAGER" # Placeholder
}

output "connection_name" {
  value = google_sql_database_instance.master.connection_name
}
