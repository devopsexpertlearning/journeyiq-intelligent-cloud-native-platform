# Screenshots Directory

This directory contains screenshots for portfolio presentation.

## Required Screenshots

### 1. Grafana Dashboards
- [ ] `grafana-golden-signals.png` - Request rate, latency, errors
- [ ] `grafana-ai-insights.png` - AI token usage, latency
- [ ] `grafana-slo-report.png` - SLO tracking

### 2. Swagger UI
- [ ] `swagger-auth-service.png` - Auth API documentation
- [ ] `swagger-ai-agent.png` - AI agent API
- [ ] `swagger-booking-service.png` - Booking API

### 3. Prometheus
- [ ] `prometheus-targets.png` - All 15 services UP
- [ ] `prometheus-metrics.png` - Sample query results

### 4. Platform Running
- [ ] `docker-compose-up.png` - All services healthy
- [ ] `services-health-check.png` - Health check results

### 5. AI Agent Demo
- [ ] `ai-agent-query-1.png` - Cancellation policy query
- [ ] `ai-agent-query-2.png` - Baggage allowance query

### 6. Code Quality
- [ ] `github-actions-ci.png` - CI pipeline passing
- [ ] `test-coverage.png` - Code coverage report

## How to Capture

### Grafana Dashboards
1. Start platform: `cd local/scripts && ./start.sh`
2. Open http://localhost:3000
3. Login: admin/admin
4. Navigate to each dashboard
5. Take full-screen screenshot

### Swagger UI
1. Open http://localhost:8001/docs (auth)
2. Open http://localhost:8012/docs (AI agent)
3. Open http://localhost:8006/docs (booking)
4. Take screenshots showing API endpoints

### Prometheus
1. Open http://localhost:9090
2. Go to Status → Targets
3. Screenshot showing all services UP
4. Run sample query, screenshot results

### Platform Running
```bash
# Run health check script
for port in {8000..8014}; do
  echo "Port $port: $(curl -s http://localhost:$port/health | jq -r '.status')"
done
```
Screenshot the output

### AI Agent Demo
```bash
curl -X POST http://localhost:8012/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is the cancellation policy?", "user_id": "u0000000-0000-0000-0000-000000000001"}' | jq
```
Screenshot the response

## Image Specifications

- **Format:** PNG
- **Resolution:** 1920x1080 or higher
- **Quality:** High (no compression artifacts)
- **Naming:** Lowercase with hyphens
- **Size:** <2MB per image

## Usage

These screenshots will be used in:
- Portfolio website
- Upwork/Fiverr profiles
- GitHub README
- Demo presentations
- Client proposals
