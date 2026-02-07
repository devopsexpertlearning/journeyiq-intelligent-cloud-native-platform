# Troubleshooting Guide

Common issues and solutions for JourneyIQ platform.

---

## Docker & Docker Compose Issues

### Services Won't Start

**Symptom:** `docker-compose up` fails or services crash immediately

**Solutions:**

1. **Check Docker resources:**
   ```bash
   docker system df
   docker system prune -a  # Remove unused data
   ```

2. **Increase Docker memory:**
   - Docker Desktop → Settings → Resources
   - Set Memory to at least 8GB
   - Set CPUs to at least 4

3. **Check for port conflicts:**
   ```bash
   # Find what's using port 8000
   lsof -i :8000
   # Kill the process
   kill -9 <PID>
   ```

4. **Rebuild containers:**
   ```bash
   docker-compose down -v
   docker-compose build --no-cache
   docker-compose up
   ```

### Container Keeps Restarting

**Symptom:** Service shows "Restarting" status

**Solutions:**

1. **Check logs:**
   ```bash
   docker-compose logs <service-name>
   ```

2. **Common causes:**
   - Missing environment variables
   - Database connection failure
   - Port already in use
   - Insufficient memory

3. **Verify health check:**
   ```bash
   docker-compose ps
   curl http://localhost:8000/auth/health
   ```

---

## Database Issues

### PostgreSQL Connection Refused

**Symptom:** `connection refused` or `could not connect to server`

**Solutions:**

1. **Verify PostgreSQL is running:**
   ```bash
   docker-compose ps postgres
   ```

2. **Check PostgreSQL logs:**
   ```bash
   docker-compose logs postgres
   ```

3. **Reset database:**
   ```bash
   docker-compose down -v  # Removes volumes
   docker-compose up -d postgres
   # Wait 10 seconds
   docker-compose up -d
   ```

4. **Verify connection string:**
   ```bash
   # Should be: postgresql://postgres:postgres@postgres:5432/journeyiq
   docker-compose exec auth-service env | grep DATABASE_URL
   ```

### Database Schema Not Created

**Symptom:** Tables don't exist errors

**Solutions:**

1. **Check init script ran:**
   ```bash
   docker-compose logs postgres | grep "init_schemas"
   ```

2. **Manually run init script:**
   ```bash
   docker-compose exec postgres psql -U postgres -d journeyiq -f /docker-entrypoint-initdb.d/01_init_schemas.sql
   ```

---

## AI Agent Issues

### AI Agent Not Responding

**Symptom:** Timeout or 500 errors from `/agent/chat`

**Solutions:**

1. **Check API key is set:**
   ```bash
   docker-compose exec ai-agent-service env | grep API_KEY
   ```

2. **Verify LLM provider:**
   ```bash
   # Check which provider is configured
   docker-compose exec ai-agent-service env | grep LLM_PROVIDER
   ```

3. **Test with simple query:**
   ```bash
   curl -X POST http://localhost:8000/agent/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "hello", "user_id": "u0000000-0000-0000-0000-000000000001"}'
   ```

### RAG Returns No Results

**Symptom:** AI agent can't find policy information

**Solutions:**

1. **Verify documents indexed (internal log):**
   ```bash
   docker-compose logs ai-agent-service
   ```

2. **Restart AI service:**
   ```bash
   docker-compose restart ai-agent-service
   ```

---

## API Issues

### 401 Unauthorized Errors

**Symptom:** API returns 401 even with token

**Solutions:**

1. **Verify token format:**
   ```bash
   # Should be: Authorization: Bearer <token>
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/users/u123
   ```

2. **Check token expiration:**
   - Default expiration: 24 hours
   - Get new token via `/auth/login`

3. **Verify JWT secret matches:**
   ```bash
   docker-compose exec auth-service env | grep JWT_SECRET
   ```

### 422 Validation Errors

**Symptom:** Request rejected with validation error

**Solutions:**

1. **Check request body format:**
   - Use Swagger UI at `http://localhost:8000/<service>/docs`
   - Verify all required fields present
   - Check data types match schema

2. **Common validation issues:**
   - Missing required fields
   - Invalid email format
   - Invalid UUID format
   - Empty strings where not allowed

---

## Performance Issues

### Slow Response Times

**Symptom:** Requests take >5 seconds

**Solutions:**

1. **Check Prometheus metrics:**
   ```promql
   # P99 latency
   histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
   ```

2. **Identify slow service:**
   ```bash
   # Check logs for slow queries
   docker-compose logs | grep "slow"
   ```

3. **Increase resources:**
   - Docker memory/CPU
   - Database connection pool size

4. **Check for rate limiting:**
   ```bash
   # Look for 429 responses
   docker-compose logs api-gateway | grep "429"
   ```

### High Memory Usage

**Symptom:** Docker using >10GB RAM

**Solutions:**

1. **Identify memory hog:**
   ```bash
   docker stats
   ```

2. **Restart specific service:**
   ```bash
   docker-compose restart <service-name>
   ```

---

## Pub/Sub Emulator Issues

### Events Not Being Consumed

**Symptom:** Events published but not received

**Solutions:**

1. **Verify emulator running:**
   ```bash
   docker-compose ps pubsub-emulator
   curl http://localhost:8085
   ```

2. **Check environment variable:**
   ```bash
   docker-compose exec notification-service env | grep PUBSUB_EMULATOR_HOST
   # Should be: pubsub-emulator:8085
   ```

3. **Restart consumers:**
   ```bash
   docker-compose restart notification-service
   ```

---

## Observability Issues

### Prometheus Not Scraping Metrics

**Symptom:** No data in Prometheus

**Solutions:**

1. **Check Prometheus targets:**
   - Open: http://localhost:9090/targets
   - All should be "UP"

2. **Verify metrics endpoint:**
   ```bash
   curl http://localhost:8000/auth/metrics
   ```

3. **Check Prometheus config:**
   ```bash
   docker-compose exec prometheus cat /etc/prometheus/prometheus.yml
   ```

### Grafana Dashboards Empty

**Symptom:** Dashboards show no data

**Solutions:**

1. **Verify Prometheus datasource:**
   - Grafana → Configuration → Data Sources
   - Test connection

2. **Check time range:**
   - Set to "Last 5 minutes"
   - Generate some traffic

3. **Import dashboards:**
   - Grafana → Dashboards → Import
   - Use dashboard JSON from `local/observability/grafana/dashboards/`

---

## Development Issues

### Code Changes Not Reflected

**Symptom:** Changes to code don't appear

**Solutions:**

1. **Rebuild service:**
   ```bash
   docker-compose up -d --build <service-name>
   ```

2. **Clear Python cache:**
   ```bash
   find . -type d -name __pycache__ -exec rm -r {} +
   find . -type f -name "*.pyc" -delete
   ```

3. **Use volume mounts for development:**
   ```yaml
   # Add to docker-compose.yml
   volumes:
     - ./services/auth-service:/app
   ```

### Import Errors

**Symptom:** `ModuleNotFoundError` or `ImportError`

**Solutions:**

1. **Install dependencies:**
   ```bash
   docker-compose exec <service-name> pip install -r requirements.txt
   ```

2. **Check PYTHONPATH:**
   ```bash
   docker-compose exec <service-name> python -c "import sys; print(sys.path)"
   ```

---

## Network Issues

### Services Can't Communicate

**Symptom:** Connection refused between services

**Solutions:**

1. **Verify network:**
   ```bash
   docker network ls
   docker network inspect journeyiq-network
   ```

2. **Use service names, not localhost:**
   - ✅ `http://auth-service:8000`
   - ❌ `http://localhost:8001`

3. **Check depends_on:**
   - Ensure service dependencies in docker-compose.yml

---

## Getting More Help

### Enable Debug Logging

```bash
# Set LOG_LEVEL=DEBUG in .env
docker-compose down
docker-compose up -d
docker-compose logs -f <service-name>
```

### Check Service Health

```bash
# Health check script via Gateway
services=("auth" "users" "search" "pricing" "inventory" "bookings" "payments" "ticketing" "notifications" "reviews" "analytics" "iot" "admin" "agent")
for service in "${services[@]}"; do
  status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/$service/health)
  echo "Service $service: $status"
done
```

### Collect Diagnostics

```bash
# Save logs for support
docker-compose logs > journeyiq-logs.txt
docker-compose ps > journeyiq-services.txt
docker stats --no-stream > journeyiq-stats.txt
```

### Community Support

- **GitHub Issues:** https://github.com/your-org/journeyiq/issues
- **Slack:** #journeyiq-support
- **Email:** support@journeyiq.com

---

## Still Having Issues?

1. Check the [GETTING_STARTED.md](./GETTING_STARTED.md) guide
2. Review [OPERATIONS.md](./OPERATIONS.md) for production issues
3. Search existing GitHub issues
4. Create a new issue with:
   - Error messages
   - Logs (`docker-compose logs`)
   - System info (`docker version`, `docker-compose version`)
   - Steps to reproduce
