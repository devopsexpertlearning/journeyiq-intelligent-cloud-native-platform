# Operations & Observability Guide

## 1. Running the Platform

### Local Development
To run the full stack locally:
```bash
# 1. Start Infrastructure
docker-compose up -d

# 2. Seed Data
python scripts/seed_all.py

# 3. Access Services
# API Gateway: http://localhost:8000
# Grafana: http://localhost:3000
```

### Production Deployment
Deployments are managed via Cloud Build and Kustomize:
```bash
# Manual Deploy (if needed)
cd k8s/overlays/prod/auth-service
kustomize build . | kubectl apply -f -
```

## 2. Observability (LGTM Stack)

### Metrics (Prometheus)
We monitor the **RED** signals (Rate, Errors, Duration).
- **Critical Alert:** `HighErrorRate` (>5% of requests failing).
- **Warning:** `HighLatency` (P99 > 2s).

### Logs (Loki)
Logs are structured JSON.
- **Query:** `{app="auth-service"} |= "error"`
- **Trace correlation:** Look for `trace_id` in logs to view the request span in Tempo.

### Dashboards (Grafana)
- **JourneyIQ Golden Signals:** Traffic, Errors, and Latency for all services.
- **AI Insights:** Token usage, cost estimation, and model performance.
- **SLO Report:** 7-day error budget burn rate.

## 3. Failure Scenarios & Recovery

### Scenario: Cloud SQL Primary Failure
- **Impact:** Write operations fail. Read operations may degrade.
- **Recovery:** GCP automatically promotes the HA replica. App reconnects automatically via `tenacity` retries.

### Scenario: Pub/Sub Backlog
- **Impact:** Notification delays.
- **Recovery:** Consumers are idempotent. Scale up `notification-service` replicas to drain the queue.

### Scenario: Bad Deployment
- **Impact:** New pods crash or serve errors.
- **Recovery:** CI/CD pipeline supports rollback.
  ```bash
  kubectl rollout undo deployment/auth-service
  ```

## 4. Cost Optimization
- **Labels:** We explicitly drop high-cardinality labels (user IDs) at the scrape level.
- **Logs:** Debug logs are dropped in Prod. Retention is 30 days.
