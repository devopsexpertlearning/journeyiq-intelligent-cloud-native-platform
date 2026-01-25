# Freelance Project/Profile Assets

## Project Title
**JourneyIQ: Intelligent Cloud-Native Microservices Platform with AI Agent**

## Short Description (Upwork/Fiverr Card)
A production-ready travel booking platform built on Kubernetes and Google Cloud. Features 15+ microservices, event-driven architecture (Kafka/PubSub), and an actionable LLM-powered AI agent. Demonstrates expertise in Python, Go, Terraform, and DevOps best practices.

## Detailed Description (Case Study)

**The Challenge:**
Building a scalable, resilient travel booking system that handles high concurrency and integrates modern AI capabilities without compromising stability.

**The Solution:**
I architected JourneyIQ, a cloud-native solution leveraging:
*   **Microservices Architecture:** Decomposed domain logic into independent services (Booking, Inventory, Payment) for independent scaling.
*   **Event-Driven Design:** Implemented SAGA patterns using Pub/Sub to ensure data consistency across distributed transactions.
*   **Actionable AI:** Integrated OpenAI/Gemini via LangGraph to create an agent that performs real database actions (Booking, Searching) safely.
*   **Infrastructure as Code:** Fully automated GCP infrastructure provisioning using modular Terraform.
*   **GitOps & CI/CD:** Automated testing and deployment pipelines using GitHub Actions and Kustomize.

**Tech Stack:**
*   **Backend:** Python (FastAPI), Go, Node.js
*   **Infrastructure:** Kubernetes (GKE), Terraform, Docker
*   **Data:** PostgreSQL, Redis, Vector DB
*   **Tools:** Prometheus, Grafana, ArgoCD, GitHub Actions

**Key Achievements:**
*   Designed a fault-tolerant payment processing flow processing 1000+ tps (simulated).
*   Reduced deployment time by 60% via optimized CI pipelines.
*   Implemented "Chat-to-Action" capability allowing users to book complex itineraries via natural language.
