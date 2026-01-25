# Incident Response Runbook

## High Error Rate Alert

**Alert:** `HighErrorRate` (>5% errors for 5 minutes)

### Immediate Actions
1. **Check Grafana Dashboard:** [JourneyIQ Golden Signals](http://grafana:3000)
2. **Identify Service:** Look at `app` label in alert
3. **Check Recent Deployments:**
   ```bash
   kubectl rollout history deployment/<service-name>
   ```

### Investigation Steps
1. **View Logs:**
   ```bash
   kubectl logs -l app=<service-name> --tail=100
   ```
   Or in Grafana Loki: `{app="<service-name>"} |= "error"`

2. **Check Resource Limits:**
   ```bash
   kubectl top pods -l app=<service-name>
   ```

3. **Verify Database Connectivity:**
   ```bash
   kubectl exec -it <pod-name> -- psql $DATABASE_URL -c "SELECT 1"
   ```

### Resolution
- **If recent deployment:** Rollback
  ```bash
  kubectl rollout undo deployment/<service-name>
  ```
- **If resource exhaustion:** Scale up
  ```bash
  kubectl scale deployment/<service-name> --replicas=5
  ```
- **If database issue:** Check Cloud SQL status in GCP Console

---

## Cloud SQL Failure

**Symptom:** Database connection errors across multiple services

### Immediate Actions
1. **Check GCP Console:** Cloud SQL instance status
2. **Verify HA Replica:** Should auto-promote within 60 seconds

### Investigation
```bash
# Check connection from pod
kubectl exec -it <any-pod> -- nc -zv <cloud-sql-ip> 5432
```

### Resolution
- GCP handles automatic failover
- Services retry with exponential backoff (via `tenacity`)
- Monitor recovery in Grafana

---

## Pub/Sub Backlog

**Alert:** `notification-service` lag > 1000 messages

### Immediate Actions
1. **Scale Consumer:**
   ```bash
   kubectl scale deployment/notification-service --replicas=10
   ```

2. **Check DLQ:**
   ```bash
   gcloud pubsub subscriptions pull booking.created.v1-dlq --limit=10
   ```

### Investigation
- Check consumer logs for errors
- Verify idempotency table isn't blocking

### Resolution
- Consumers are idempotent - safe to replay
- Increase HPA max replicas if recurring
