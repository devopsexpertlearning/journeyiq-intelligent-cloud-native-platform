# JourneyIQ Demo Script (5 Minutes)

## 0:00 - 0:45: Introduction & "The Hook"
**(Visual: Slide or full-screen JourneyIQ logo with "Intelligent Cloud-Native Platform" subtitle)**
"Hi, I'm [Your Name], and this is JourneyIQ. Modern travel platforms handle millions of requests, but most are built on legacy monoliths that crash under load and offer rigid, unhelpful user experiences. I built JourneyIQ to solve this using a production-ready, event-driven microservices architecture."

**(Visual: Architecture Diagram from correct docs/ARCHITECTURE.md)**
"This isn't just a prototype. It's a fully distributed system running on Google Kubernetes Engine, featuring 15 microservices, asynchronous saga patterns for reliability, and a cutting-edge AI agent that doesn't just chat—it takes action."

## 0:45 - 2:00: The AI Agent (Deep Dive)
**(Visual: Terminal split screen with Logs and Chat Interface)**
"Let's look at the AI Agent. Most bots just summarize text. JourneyIQ's agent is integrated directly into the core platform via LangGraph."

**(Action: Type "Find me a flight to London for under $600 next Friday" in the chat)**
"Watch this. I ask for a flight. The agent parses my intent, calls the `search-service` API..."
**(Visual: Highlight log entry showing `TOOL EXECUTION: search_flights`)**
"...and returns real-time inventory. But it goes further."

**(Action: Type "Book the first one")**
"When I say 'Book it', it doesn't just say okay. It initiates a distributed transaction..."
**(Visual: Switch to Grafana Dashboard showing "Booking Created" spike)**
"...triggering the Booking Service, which coordinates with Inventory and Payment services asynchronously to ensure data consistency without locking the database."

## 2:00 - 3:30: Infrastructure & Resilience
**(Visual: VS Code showing `infra/terraform` and `k8s/overlays`)**
"This is built with Infrastructure as Code from day one. I use Terraform modules to provision the VPC, Private GKE Cluster, and Cloud SQL instances. No manual console clicking."

**(Visual: Terminal running `kubectl get pods`)**
"On Kubernetes, I use Kustomize for environment separation. The Production overlay enforces resource quotas, readiness probes, and pod anti-affinity to ensure high availability. If a node dies, the system self-heals."

## 3:30 - 4:30: Observability & Quality
**(Visual: Grafana Dashboard with RED metrics (Rate, Errors, Duration))**
"You can't fix what you can't see. I've instrumented every service with Prometheus. Here we can see the 95th percentile latency for the search API and the error rate for bookings."

**(Visual: Github Actions Pipeline Run)**
"And quality is automated. Every commit triggers a CI pipeline that runs unit tests, linting, and security scans with Trivy before building optimized Docker images."

## 4:30 - 5:00: Conclusion
**(Visual: Back to User Interface or Face Camera)**
"JourneyIQ demonstrates my ability to design, build, and deploy complex cloud-native systems. It combines robust DevOps practices with modern AI integration. Thanks for watching."
