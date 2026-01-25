variable "project_id" {}

locals {
  topics = [
    "booking.flight.purchased.v1",
    "user.account.created.v1",
    "inventory.flight.updated.v1",
    "payment.transaction.succeeded.v1",
    "payment.transaction.failed.v1"
  ]
}

resource "google_pubsub_topic" "topics" {
  for_each = toset(local.topics)
  name     = each.key
  project  = var.project_id
}

resource "google_pubsub_subscription" "subs" {
  for_each = toset(local.topics)
  name     = "${each.key}-sub"
  topic    = google_pubsub_topic.topics[each.key].name
  project  = var.project_id

  dead_letter_policy {
    dead_letter_topic     = google_pubsub_topic.dlq[each.key].id
    max_delivery_attempts = 5
  }
}

resource "google_pubsub_topic" "dlq" {
  for_each = toset(local.topics)
  name     = "${each.key}-dlq"
  project  = var.project_id
}
