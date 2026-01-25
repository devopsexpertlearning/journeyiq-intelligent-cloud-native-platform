# Observability Strategy: Metrics & Logs

## 1. Metrics Strategy (Prometheus)

We adhere to the **RED Method** (Rate, Errors, Duration) for all services.

### Standard Metrics
All services must expose:
- `http_requests_total{status, method, path}`: Counter.
- `http_request_duration_seconds_bucket{status, method, path}`: Histogram.
- `http_requests_in_progress{method, path}`: Gauge.

### AI Specific Metrics
The `ai-agent-service` must expose:
- `ai_token_usage_total{model, type}`: Counter (Prompt vs Completion tokens).
- `ai_latency_seconds_bucket{tool}`: Histogram (Duration of agent steps).
- `ai_action_count{tool}`: Counter (Tools invoked).

### Cost Optimization
To prevent high cardinality:
1.  **Drop Labels:** `user_id`, `email`, `request_id` must NOT be metric labels.
2.  **Aggregation:** Recording rules are used for long-term retention of aggregated data.

## 2. Log Strategy (Loki)

### Format
- **JSON Structure:** `{ "level": "info", "ts": "...", "msg": "...", "trace_id": "...", "user_id": "..." }`
- **Labels:** Only static infrastructure labels (`app`, `env`, `pod`). High cardinality data goes in the JSON payload (structured metadata).

### Retention
- **Dev:** 7 Days.
- **Prod:** 30 Days.

### Trace Correlation
- All logs must include `trace_id` (OpenTelemetry standard) to allow jumping from Grafana Trace view to Loki Logs.
