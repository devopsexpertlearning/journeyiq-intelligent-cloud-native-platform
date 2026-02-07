# Getting Started with JourneyIQ

Welcome to JourneyIQ! This guide will get you up and running with the complete platform in under 5 minutes.

## Prerequisites

Before you begin, ensure you have the following installed:

- ✅ **Docker** (20.10+) and **Docker Compose** (2.0+)
- ✅ **Git** (2.30+)
- ✅ **Python** 3.11+ (for running services outside Docker)
- ✅ **Node.js** 18+ (optional, for frontend development)

### API Keys Required

You'll need at least one LLM provider API key for the AI agent:

- **Gemini API Key** (recommended for local) - Get from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Azure OpenAI** (production) - Get from Azure Portal
- **Groq API Key** (alternative) - Get from [Groq Console](https://console.groq.com)

---

## Quick Start (5 Minutes)

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/journeyiq-intelligent-cloud-native-platform.git
cd journeyiq-intelligent-cloud-native-platform
```

### 2. Configure Environment

```bash
cd local
cp .env.example .env
```

**Edit `.env` and add your API keys:**

```bash
# Minimum required for AI agent
GEMINI_API_KEY=your-gemini-api-key-here

# Optional: Azure OpenAI for production-like testing
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
```

### 3. Start the Platform

```bash
cd scripts
./start.sh
```

The script will:
- ✅ Create necessary directories
- ✅ Start PostgreSQL and Pub/Sub emulator
- ✅ Launch all 15 microservices
- ✅ Start Prometheus and Grafana
- ✅ Run health checks

**Expected output:**
```
========================================
JourneyIQ Platform Started!
========================================

Services ready: 15/15

📊 Service Endpoints:
  All services accessible via Gateway: http://localhost:8000
  ...
```

### 4. Verify Installation

Open your browser and check:

- **API Gateway Health:** http://localhost:8000/health
- **Swagger UI (Auth):** http://localhost:8000/auth/docs
- **Prometheus:** http://localhost:9090
- **Grafana:** http://localhost:3000 (admin/admin)

---

## Your First API Request

### 1. Test the AI Agent

```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What is the flight cancellation policy?",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }'
```

**Expected response:**
```json
{
  "response": "According to our policy, bookings created more than 24 hours ago are non-refundable unless purchased with Flexi-Fare protection..."
}
```

### 2. Search for Flights

```bash
curl "http://localhost:8000/search/flights?origin=JFK&destination=LHR"
```

### 3. Get User Profile

```bash
curl http://localhost:8000/users/u0000000-0000-0000-0000-000000000001
```

---

## Service Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway (8000)                       │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│  Auth (8001)   │   │  User (8002)    │   │ Search (8003)  │
└────────────────┘   └─────────────────┘   └────────────────┘
        │                     │                     │
┌───────▼────────┐   ┌────────▼────────┐   ┌───────▼────────┐
│ Booking (8006) │   │ Payment (8007)  │   │ AI Agent (8012)│
└────────────────┘   └─────────────────┘   └────────────────┘
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   PostgreSQL       │
                    │   Pub/Sub Emulator │
                    └────────────────────┘
```

**Port Mapping:**
- `8000` - API Gateway (Reverse Proxy for all services)
- `9090` - Prometheus
- `3000` - Grafana
- `2525` - Postfix SMTP
- *(Individual service ports 8001-8014 are internal only)*

---

## Exploring the Platform

### Swagger API Documentation

Each service has interactive API documentation accessible via the Gateway:

- Auth Service: http://localhost:8000/auth/docs
- AI Agent: http://localhost:8000/agent/docs
- Booking: http://localhost:8000/bookings/docs
- *(Pattern: http://localhost:8000/<service>/docs)*

### Observability

**Prometheus Metrics:**
- URL: http://localhost:9090
- Query examples:
  - `http_requests_total` - Total requests
  - `ai_latency_seconds` - AI agent latency
  - `rate(http_requests_total[5m])` - Request rate

**Grafana Dashboards:**
- URL: http://localhost:3000
- Login: `admin` / `admin`
- Dashboards: JourneyIQ Golden Signals, AI Insights, SLO Report

---

## Demo Data Available

The platform comes pre-seeded with realistic demo data:

### Users (10)
- `alice.voyager@journeyiq.com` (Gold tier)
- `bob.explorer@journeyiq.com` (Silver tier)
- `charlie.trekker@journeyiq.com`
- ...and 7 more

### Flights (50)
- JFK ↔ LHR (New York ↔ London)
- SFO ↔ SIN (San Francisco ↔ Singapore)
- LAX ↔ SYD (Los Angeles ↔ Sydney)
- ...and 44 more routes

### Hotels (20)
- Grand Plaza Central (New York)
- Tokyo Imperial Palace (Tokyo)
- Dubai Sands Hotel (Dubai)
- ...and 17 more

### Bookings (30)
- Mix of confirmed, pending, and cancelled bookings
- Linked to real users and flights/hotels

### RAG Documents (32)
- Flight policies (cancellation, changes, baggage)
- Hotel policies
- Visa requirements
- Travel tips
- Customer service info

---

## Development Workflow

### Making Changes

1. **Edit service code** in `services/<service-name>/`
2. **Rebuild specific service:**
   ```bash
   docker-compose up -d --build <service-name>
   ```
3. **View logs:**
   ```bash
   docker-compose logs -f <service-name>
   ```

### Running Tests

```bash
# Run tests for a specific service
cd services/ai-agent-service
pytest

# Run all tests
./scripts/run_all_tests.sh
```



---

## Troubleshooting

### Services Won't Start

**Check Docker resources:**
```bash
docker system df
docker system prune  # If low on space
```

**Increase Docker memory:**
- Docker Desktop → Settings → Resources → Memory: 8GB+

### Database Connection Errors

```bash
# Reset database
docker-compose down -v
docker-compose up -d postgres
# Wait 10 seconds
docker-compose up -d
```

### AI Agent Not Responding

**Check API key:**
```bash
docker-compose exec ai-agent-service env | grep API_KEY
```

**View logs:**
```bash
docker-compose logs ai-agent-service | tail -50
```

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000
# Kill it
kill -9 <PID>
```

---

## Stopping the Platform

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

---

## Next Steps

- 📖 **[API Documentation](./API.md)** - Detailed API reference
- 🎯 **[Demo Script](../DEMO.md)** - Guided platform tour
- 🏗️ **[Architecture](./ARCHITECTURE.md)** - System design deep dive
- 🤖 **[AI Agent Guide](./AI.md)** - LangGraph and RAG details
- 📊 **[Operations Guide](./OPERATIONS.md)** - Production deployment

---

## Getting Help

- **Issues:** https://github.com/your-org/journeyiq/issues
- **Discussions:** https://github.com/your-org/journeyiq/discussions
- **Email:** support@journeyiq.com
- **Slack:** #journeyiq-dev

---

**Happy coding! 🚀**
