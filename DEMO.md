# JourneyIQ Platform Demo

**Complete demonstration of the JourneyIQ intelligent travel booking platform.**

This guide walks you through a complete end-to-end demo showcasing all major features.

---

## Prerequisites

Ensure the platform is running:
```bash
cd local/scripts
./start.sh
```

Wait for all services to be healthy (15/15).

---

## Demo Scenario

**Persona:** Alice Voyager (Gold loyalty member)  
**Goal:** Book a flight from New York to London, ask the AI agent about policies, and track the booking.

---

## Part 1: Platform Health Check (2 minutes)

### 1. Verify All Services Running

```bash
# Check all health endpoints
for port in {8000..8014}; do
  echo "Port $port: $(curl -s http://localhost:$port/health | jq -r '.status // "N/A"')"
done
```

**Expected:** All services return `{"status": "healthy"}`

### 2. Access Observability Dashboards

**Prometheus:**
- Open: http://localhost:9090
- Query: `up` → Should show 15 targets UP

**Grafana:**
- Open: http://localhost:3000
- Login: `admin` / `admin`
- Navigate to dashboards

---

## Part 2: AI Agent Demo (5 minutes)

### 1. Ask About Flight Cancellation Policy

```bash
curl -X POST http://localhost:8012/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the flight cancellation policy?",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }' | jq
```

**Expected Response:**
```json
{
  "response": "According to our policy, bookings created more than 24 hours ago are non-refundable unless purchased with Flexi-Fare protection. Cancellations within 24 hours of booking receive a full refund. For Flexi-Fare bookings, cancellations up to 4 hours before departure receive 80% refund..."
}
```

### 2. Ask About Baggage Allowance

```bash
curl -X POST http://localhost:8012/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the baggage allowance for economy class?",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }' | jq
```

**Expected:** Detailed baggage policy with weight limits and fees.

### 3. Ask About Loyalty Program

```bash
curl -X POST http://localhost:8012/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Tell me about the Gold tier loyalty benefits",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }' | jq
```

**Expected:** Details about Gold tier (10% bonus points, priority boarding, free seat selection).

### 4. Verify RAG Retrieval

```bash
curl -X POST http://localhost:8014/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "cancellation policy",
    "k": 3
  }' | jq
```

**Expected:** Top 3 relevant documents with similarity scores.

---

## Part 3: Complete Booking Flow (10 minutes)

### Step 1: Search for Flights

```bash
curl "http://localhost:8003/search/flights?origin=JFK&destination=LHR&max_price=700" | jq
```

**Expected Response:**
```json
{
  "flights": [
    {
      "id": "f0000000-0000-0000-0000-000000000001",
      "flight_number": "JQ101",
      "origin": "JFK",
      "destination": "LHR",
      "departure_time": "2026-01-15T08:00:00Z",
      "arrival_time": "2026-01-15T20:00:00Z",
      "base_price": 650.00,
      "status": "SCHEDULED"
    }
  ]
}
```

**Copy the flight ID:** `f0000000-0000-0000-0000-000000000001`

### Step 2: Get User Profile

```bash
curl http://localhost:8002/users/u0000000-0000-0000-0000-000000000001 | jq
```

**Expected:**
```json
{
  "id": "u0000000-0000-0000-0000-000000000001",
  "email": "alice.voyager@journeyiq.com",
  "full_name": "Alice Voyager",
  "preferences": {
    "currency": "USD",
    "seat": "aisle",
    "loyalty_tier": "gold"
  }
}
```

### Step 3: Create Booking

```bash
curl -X POST http://localhost:8006/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "u0000000-0000-0000-0000-000000000001",
    "resource_type": "FLIGHT",
    "resource_id": "f0000000-0000-0000-0000-000000000001",
    "passengers": [
      {
        "name": "Alice Voyager",
        "seat": "10A"
      }
    ]
  }' | jq
```

**Expected:**
```json
{
  "booking_id": "b0000000-0000-0000-0000-000000000031",
  "status": "PENDING",
  "payment_required": true,
  "amount": 720.00,
  "currency": "USD"
}
```

**Copy the booking ID:** `b0000000-0000-0000-0000-000000000031`

### Step 4: Process Payment

```bash
curl -X POST http://localhost:8007/payments \
  -H "Content-Type: application/json" \
  -d '{
    "booking_id": "b0000000-0000-0000-0000-000000000031",
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

**Expected:**
```json
{
  "payment_id": "p0000000-0000-0000-0000-000000000001",
  "status": "SUCCEEDED",
  "transaction_id": "txn_abc123"
}
```

### Step 5: Verify Booking Status

```bash
curl http://localhost:8006/bookings/b0000000-0000-0000-0000-000000000031 | jq
```

**Expected:** Status should be `CONFIRMED` and notification sent via Postfix

---

## Part 4: Observability Demo (5 minutes)

### 1. View Prometheus Metrics

Open: http://localhost:9090/graph

**Query Examples:**

```promql
# Total HTTP requests
sum(rate(http_requests_total[5m])) by (service)

# AI Agent latency (P99)
histogram_quantile(0.99, rate(ai_latency_seconds_bucket[5m]))

# Error rate
sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))
```

### 2. View Grafana Dashboards

Open: http://localhost:3000

**Navigate to:**
- JourneyIQ Golden Signals Dashboard
- AI Insights Dashboard
- SLO Report Dashboard

**Observe:**
- Request rates
- Latency percentiles
- Error rates
- AI token usage

---

## Part 5: Event-Driven Architecture (3 minutes)

### 1. Publish Event to Pub/Sub

```bash
curl -X POST http://localhost:8006/events/publish \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "booking.created",
    "data": {
      "booking_id": "b0000000-0000-0000-0000-000000000031",
      "user_id": "u0000000-0000-0000-0000-000000000001"
    }
  }'
```

### 2. Verify Event Consumption

```bash
# Check notification service logs
docker-compose logs notification-service | grep "booking.created"
```

**Expected:** Log showing event received and processed.

---

## Part 6: Swagger UI Exploration (5 minutes)

### 1. Auth Service API

Open: http://localhost:8001/docs

**Try:**
- POST `/auth/login` with demo credentials
- POST `/auth/register` to create new user

### 2. AI Agent API

Open: http://localhost:8012/docs

**Try:**
- POST `/agent/chat` with different questions
- Observe response times and quality

### 3. Booking Service API

Open: http://localhost:8006/docs

**Try:**
- GET `/bookings/{booking_id}`
- DELETE `/bookings/{booking_id}` (cancellation)

---

## Part 7: Performance Testing (Optional)

### Load Test AI Agent

```bash
# Install k6 if not already installed
# brew install k6  # macOS
# sudo apt install k6  # Ubuntu

k6 run - <<EOF
import http from 'k6/http';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  http.post('http://localhost:8012/agent/chat', JSON.stringify({
    message: 'What is the cancellation policy?',
    user_id: 'u0000000-0000-0000-0000-000000000001'
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
EOF
```

**Observe:**
- Request rate
- P95/P99 latencies
- Error rate

---

## Demo Summary

✅ **Verified:** All 15 services healthy  
✅ **Demonstrated:** AI agent with RAG (32 documents)  
✅ **Completed:** End-to-end booking flow  
✅ **Observed:** Real-time metrics in Prometheus/Grafana  
✅ **Validated:** Event-driven architecture  
✅ **Explored:** Interactive API documentation  

---

## Key Highlights for Portfolio

1. **Microservices Architecture:** 15 independent services
2. **AI/ML Integration:** LangGraph agent with RAG pipeline
3. **Event-Driven:** Pub/Sub for async communication
4. **Observability:** LGTM stack (Prometheus + Grafana)
5. **API-First:** Comprehensive Swagger documentation
6. **Production-Ready:** Health checks, metrics, logging
7. **Developer Experience:** One-command startup, demo data

---

## Next Steps

- Deploy to GKE using Terraform (see `infra/terraform/`)
- Set up CI/CD pipelines (see `cloudbuild-template.yaml`)
- Configure production observability
- Enable canary deployments for AI agent

---

**Demo Duration:** ~30 minutes  
**Difficulty:** Beginner-friendly  
**Prerequisites:** Docker, basic curl knowledge
