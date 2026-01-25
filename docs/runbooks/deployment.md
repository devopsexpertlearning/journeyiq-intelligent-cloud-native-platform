# Deployment Runbook

## Standard Service Deployment

### Prerequisites
- Docker image built and pushed to Artifact Registry
- Kustomize installed locally
- `kubectl` configured for target cluster

### Steps

1. **Update Image Tag:**
   ```bash
   cd k8s/overlays/prod/<service-name>
   kustomize edit set image us-central1-docker.pkg.dev/journeyiq-prod/journeyiq-services/<service-name>:<new-tag>
   ```

2. **Preview Changes:**
   ```bash
   kustomize build . | kubectl diff -f -
   ```

3. **Apply:**
   ```bash
   kustomize build . | kubectl apply -f -
   ```

4. **Monitor Rollout:**
   ```bash
   kubectl rollout status deployment/<service-name>
   ```

5. **Verify Health:**
   ```bash
   kubectl get pods -l app=<service-name>
   curl http://<service-name>/health
   ```

---

## AI Agent Canary Deployment

### Steps

1. **Deploy Canary:**
   ```bash
   gcloud builds submit --config=services/ai-agent-service/cloudbuild-canary.yaml
   ```

2. **Monitor Metrics (15 minutes):**
   - Check `ai_latency_seconds` in Grafana
   - Verify `ai_token_usage_total` is within budget
   - Watch error rate

3. **Promote or Rollback:**
   ```bash
   # Promote
   kubectl set image deployment/ai-agent-service app=<canary-image>
   
   # Rollback
   kubectl delete deployment/ai-agent-canary
   ```

---

## Observability Stack Update

### Update Dashboards
```bash
cd k8s/observability
gcloud builds submit --config=../../ops/cloudbuild-observability.yaml
```

### Update Alert Rules
```bash
kubectl apply -f k8s/observability/rules/alert-rules.yaml
```
