# JourneyIQ Platform - Demo Script for Portfolio Showcase

**Duration:** 15 minutes  
**Audience:** Potential clients, recruiters, technical evaluators  
**Goal:** Demonstrate production-ready cloud-native platform with AI capabilities

---

## Pre-Demo Setup

**Ensure platform is running:**
```bash
cd local/scripts && ./start.sh
# Wait for 15/15 services healthy
```

**Open browser tabs:**
1. Prometheus: http://localhost:9090
2. Grafana: http://localhost:3000
3. Swagger (Auth): http://localhost:8001/docs
4. Swagger (AI Agent): http://localhost:8012/docs

---

## Part 1: Platform Overview (2 minutes)

### Show Architecture

**Talk Track:**
> "JourneyIQ is a production-ready, cloud-native travel booking platform built with modern microservices architecture. Let me show you the key components."

**Demonstrate:**
1. Open `docs/ARCHITECTURE.md` - show Mermaid diagram
2. Explain: 15 microservices, event-driven, AI-powered

**Key Points:**
- ✅ 15 independent microservices
- ✅ Event-driven with Google Pub/Sub
- ✅ AI agent with RAG (32 policy documents)
- ✅ Full observability stack (Prometheus + Grafana)
- ✅ Production-ready Kubernetes manifests

---

## Part 2: AI Agent Demo (3 minutes)

### Demonstrate Intelligent Assistant

**Talk Track:**
> "The platform includes an AI agent powered by LangGraph that can answer policy questions using RAG. Watch how it retrieves and synthesizes information."

**Live Demo:**

```bash
# Query 1: Cancellation Policy
curl -X POST http://localhost:8012/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the flight cancellation policy?",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }' | jq
```

**Expected:** Detailed policy with refund percentages

```bash
# Query 2: Baggage Allowance
curl -X POST http://localhost:8012/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the baggage allowance for business class?",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }' | jq
```

**Expected:** Business class baggage details

**Show Swagger UI:**
- Open http://localhost:8012/docs
- Show interactive API documentation
- Demonstrate "Try it out" feature

**Key Points:**
- ✅ Natural language understanding
- ✅ RAG retrieval from 32 documents
- ✅ Context-aware responses
- ✅ Production-ready API

---

## Part 3: Complete Booking Flow (4 minutes)

### End-to-End Transaction

**Talk Track:**
> "Let me demonstrate a complete booking flow from search to payment confirmation, showing how microservices communicate."

**Step 1: Search Flights**
```bash
curl "http://localhost:8003/search/flights?origin=JFK&destination=LHR" | jq
```
**Show:** 50 realistic flight options

**Step 2: Create Booking**
```bash
curl -X POST http://localhost:8006/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u0000000-0000-0000-0000-000000000001",
    "resource_type": "FLIGHT",
    "resource_id": "f0000000-0000-0000-0000-000000000001",
    "passengers": [{"name": "Alice Voyager", "seat": "10A"}]
  }' | jq
```
**Show:** Booking created with PENDING status

**Step 3: Process Payment**
```bash
curl -X POST http://localhost:8007/payments \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "<BOOKING_ID>",
    "amount": 720.00,
    "currency": "USD",
    "payment_method": {
      "type": "CARD",
      "card_number": "4111111111111111",
      "expiry": "12/25",
      "cvv": "123"
    }
  }' | jq
```
**Show:** Payment SUCCEEDED

**Key Points:**
- ✅ Microservices orchestration
- ✅ Event-driven architecture
- ✅ Saga pattern for distributed transactions
- ✅ Real-time status updates

---

## Part 4: Observability & Monitoring (3 minutes)

### Production-Grade Monitoring

**Talk Track:**
> "The platform includes comprehensive observability with Prometheus and Grafana, essential for production operations."

**Prometheus Metrics:**
1. Open http://localhost:9090
2. Run query: `rate(http_requests_total[5m])`
3. Show request rate across all services

**Grafana Dashboards:**
1. Open http://localhost:3000 (admin/admin)
2. Navigate to "JourneyIQ Golden Signals"
3. Show:
   - Request rate
   - Error rate
   - Latency (P50, P95, P99)
   - AI token usage

**Key Metrics to Highlight:**
```promql
# Total requests per second
sum(rate(http_requests_total[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))

# AI agent latency (P99)
histogram_quantile(0.99, rate(ai_latency_seconds_bucket[5m]))
```

**Key Points:**
- ✅ Real-time metrics
- ✅ Custom AI metrics
- ✅ Production-ready alerting
- ✅ SLO tracking

---

## Part 5: Infrastructure as Code (2 minutes)

### Show Production Deployment

**Talk Track:**
> "Everything is infrastructure as code. Let me show you the Terraform and Kubernetes configurations."

**Terraform Modules:**
```bash
tree infra/terraform/modules/
```
**Show:** 6 modules (VPC, GKE, DB, Pub/Sub, Observability, Artifact Registry)

**Kubernetes Manifests:**
```bash
tree k8s/
```
**Show:** Base manifests + dev/prod overlays with Kustomize

**CI/CD Pipeline:**
```bash
cat .github/workflows/ci.yml
```
**Show:** Automated testing, security scans, Docker builds

**Key Points:**
- ✅ Modular Terraform (6 modules)
- ✅ Kustomize for K8s (base + overlays)
- ✅ GitHub Actions CI/CD
- ✅ Security scanning (Trivy, Bandit)

---

## Part 6: Developer Experience (1 minute)

### One-Command Setup

**Talk Track:**
> "Developer experience is crucial. The entire platform starts with one command."

**Demonstrate:**
```bash
cd local/scripts
./start.sh
```

**Show:**
- Health checks for all 15 services
- Auto-seeded demo data
- Comprehensive documentation

**Documentation:**
- `GETTING_STARTED.md` - 5-minute quick start
- `API.md` - Complete API reference
- `DEMO.md` - Full demo script
- `TROUBLESHOOTING.md` - Common issues
- 4 ADRs - Architecture decisions

**Key Points:**
- ✅ One-command startup
- ✅ Comprehensive documentation
- ✅ Postman collection included
- ✅ 50+ unit tests

---

## Closing Summary

### Platform Highlights

**Technical Excellence:**
- ✅ 15 microservices (Python/FastAPI)
- ✅ Event-driven architecture (Google Pub/Sub)
- ✅ AI/ML integration (LangGraph + RAG)
- ✅ Production-ready observability (LGTM stack)
- ✅ Infrastructure as Code (Terraform + Kustomize)
- ✅ Comprehensive testing (unit + integration)

**Production Readiness:**
- ✅ Health checks on all services
- ✅ Prometheus metrics + alerts
- ✅ Grafana dashboards
- ✅ Security scanning in CI/CD
- ✅ Database migrations
- ✅ Secrets management

**Developer Experience:**
- ✅ One-command local setup
- ✅ Interactive API docs (Swagger)
- ✅ Postman collection
- ✅ Comprehensive documentation
- ✅ Troubleshooting guide

**Demo Data:**
- ✅ 10 users
- ✅ 50 flights
- ✅ 20 hotels
- ✅ 30 bookings
- ✅ 32 RAG documents

---

## Q&A Preparation

**Common Questions:**

**Q: How does the AI agent work?**
> A: Uses LangGraph for state management, retrieves relevant documents via FAISS vector search, and generates responses using Gemini/Azure OpenAI.

**Q: How do you handle failures?**
> A: Saga pattern for distributed transactions, circuit breakers, retry logic, and comprehensive alerting via Prometheus.

**Q: What's the deployment process?**
> A: GitOps workflow - push to main triggers CI/CD, runs tests, builds Docker images, deploys to GKE using Kustomize.

**Q: How do you scale?**
> A: Horizontal Pod Autoscaling in Kubernetes, database read replicas, Pub/Sub for async processing, FAISS can be replaced with Pinecone for scale.

**Q: What's the cost?**
> A: Development: $0 (local Docker). Production: ~$200-300/month on GCP (GKE, Cloud SQL, Pub/Sub).

---

## Portfolio Presentation Tips

1. **Start with architecture diagram** - Visual impact
2. **Live demo the AI agent** - Most impressive feature
3. **Show metrics in Grafana** - Production readiness
4. **Highlight one-command setup** - Developer experience
5. **End with code quality** - Tests, CI/CD, documentation

**Time Management:**
- 2 min: Architecture overview
- 3 min: AI agent demo
- 4 min: Booking flow
- 3 min: Observability
- 2 min: Infrastructure
- 1 min: Developer experience

**Total: 15 minutes**
