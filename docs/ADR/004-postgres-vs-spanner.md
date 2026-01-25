# ADR 004: PostgreSQL vs Cloud Spanner

**Status:** Accepted  
**Date:** 2026-01-10  
**Deciders:** Platform Architecture Team

## Context

We needed a database for storing user data, bookings, payments, and reviews across our microservices.

Requirements:
- ACID transactions
- Support for multiple services
- Good performance (<100ms queries)
- Cost-effective for demo/development
- Production scalability
- Easy local development

## Decision

We chose **PostgreSQL** over **Cloud Spanner** for our primary database.

## Rationale

### Why PostgreSQL?

1. **Cost Effective**
   - Free for development
   - Cheap for production (Cloud SQL: ~$50/month)
   - No minimum spend

2. **Mature Ecosystem**
   - 30+ years of development
   - Rich tooling (pgAdmin, DBeaver)
   - Extensive documentation

3. **Local Development**
   - Easy docker-compose setup
   - No internet required
   - Fast iteration

4. **Feature Rich**
   - JSON/JSONB support
   - Full-text search
   - Geospatial (PostGIS)
   - Rich data types

5. **Team Familiarity**
   - Most developers know SQL
   - Standard SQL syntax
   - Easy to hire for

### Why Not Cloud Spanner?

**Cloud Spanner (Google's Distributed DB):**
- ❌ Cost: $900+/month minimum
- ❌ Overkill for our scale
- ❌ Complex for local dev
- ✅ Global distribution
- ✅ Horizontal scalability
- ✅ 99.999% availability

**Trade-off:** We chose PostgreSQL for cost and simplicity, with option to migrate if we need global distribution.

## Consequences

### Positive
- Low cost ($0 dev, ~$50/month prod)
- Easy local development
- Rich ecosystem and tooling
- Team familiarity

### Negative
- Single-region by default
- Manual sharding if needed
- Need to manage backups
- Limited horizontal scaling

### Neutral
- Need to design schema carefully
- Responsible for performance tuning

## Implementation

**Docker Compose:**
```yaml
postgres:
  image: postgres:15-alpine
  environment:
    POSTGRES_DB: journeyiq
    POSTGRES_USER: postgres
    POSTGRES_PASSWORD: postgres
  ports:
    - "5432:5432"
```

**Production (Cloud SQL):**
```hcl
resource "google_sql_database_instance" "main" {
  name             = "journeyiq-prod"
  database_version = "POSTGRES_15"
  region           = "us-central1"
  
  settings {
    tier = "db-custom-2-7680"  # 2 vCPU, 7.68 GB
    
    backup_configuration {
      enabled = true
      start_time = "03:00"
    }
  }
}
```

## Migration Path

If we outgrow PostgreSQL (>10M users, multi-region):
1. Implement database abstraction layer
2. Shard by user_id or region
3. Consider Cloud Spanner for global tables
4. Hybrid: PostgreSQL for regional, Spanner for global

## Performance Benchmarks

| Metric | PostgreSQL | Cloud Spanner |
|--------|------------|---------------|
| Read latency | 5-10ms | 10-20ms (global) |
| Write latency | 10-20ms | 20-50ms (global) |
| Cost (1M queries/day) | ~$50/mo | ~$900/mo |
| Max throughput | 10k QPS | 100k+ QPS |

## References

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Cloud SQL Pricing](https://cloud.google.com/sql/pricing)
- [Cloud Spanner Pricing](https://cloud.google.com/spanner/pricing)
- Internal: `infra/terraform/modules/db/`
