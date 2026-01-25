# Troubleshooting Guide

## Common Issues

### 1. Docker Compose Fails to Start
**Error:** `Bind for 0.0.0.0:8000 failed: port is already allocated`
**Solution:**
Check if another service is running on port 8000.
```bash
sudo lsof -i :8000
kill -9 <PID>
```

### 2. AI Agent Returns "I cannot fulfill this request"
**Cause:**
The safety filter in `safety.py` triggered, or the LLM API key is missing.
**Solution:**
- Verify `OPENAI_API_KEY` or `AZURE_OPENAI_KEY` is set in `.env`.
- Check logs: `docker logs ai-agent-service`

### 3. Terraform Apply Fails on GKE
**Error:** `Insufficient quotas for region`
**Solution:**
The configured region might be out of resources. Change `region` in `infra/terraform/envs/prod/variables.tf`.

### 4. Booking Status Stuck at "PENDING"
**Cause:**
The event consumer in `payment-service` or `inventory-service` might be down.
**Solution:**
- Check Pub/Sub emulator logs.
- Restart services: `docker-compose restart payment-service inventory-service`

## Debugging

### Enable Debug Logging
Set `LOG_LEVEL=DEBUG` in your `.env` file and restart.

### Inspecting Events
Use the Pub/Sub emulator UI (if active) or check logs for `[EventProducer]` tags.
