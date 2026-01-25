# JourneyIQ API Documentation - Swagger/OpenAPI

## ✅ All Services Have Swagger Documentation Available

All 15 microservices are configured with FastAPI's automatic OpenAPI documentation.

## Access Swagger UI

Each service provides interactive API documentation at the `/docs` endpoint:

| Service | Swagger UI | OpenAPI Spec |
|---------|------------|--------------|
| **API Gateway** | http://localhost:8000/docs | http://localhost:8000/openapi.json |
| **Auth Service** | http://localhost:8001/docs | http://localhost:8001/openapi.json |
| **User Service** | http://localhost:8002/docs | http://localhost:8002/openapi.json |
| **Search Service** | http://localhost:8003/docs | http://localhost:8003/openapi.json |
| **Pricing Service** | http://localhost:8004/docs | http://localhost:8004/openapi.json |
| **Inventory Service** | http://localhost:8005/docs | http://localhost:8005/openapi.json |
| **Booking Service** | http://localhost:8006/docs | http://localhost:8006/openapi.json |
| **Payment Service** | http://localhost:8007/docs | http://localhost:8007/openapi.json |
| **Ticketing Service** | http://localhost:8008/docs | http://localhost:8008/openapi.json |
| **Notification Service** | http://localhost:8009/docs | http://localhost:8009/openapi.json |
| **Review Service** | http://localhost:8010/docs | http://localhost:8010/openapi.json |
| **Analytics Service** | http://localhost:8011/docs | http://localhost:8011/openapi.json |
| **AI Agent Service** | http://localhost:8012/docs | http://localhost:8012/openapi.json |
| **RAG Ingestion Service** | http://localhost:8013/docs | http://localhost:8013/openapi.json |
| **Vector Store Service** | http://localhost:8014/docs | http://localhost:8014/openapi.json |

## Features

Each Swagger UI page provides:
- **Interactive API Testing**: Try out endpoints directly from the browser
- **Request/Response Examples**: See example payloads and responses
- **Schema Documentation**: View data models and validation rules
- **Authentication**: Test authenticated endpoints (where applicable)

## Quick Test

To verify all Swagger pages are accessible, run:
```bash
python3 local/scripts/check_swagger.py
```

## Alternative Documentation

FastAPI also provides ReDoc documentation at `/redoc` for each service:
- Example: http://localhost:8000/redoc

## Notes

- All services use FastAPI's automatic OpenAPI generation
- Documentation is generated from Python type hints and docstrings
- Swagger UI is served at `/docs` (default FastAPI behavior)
- OpenAPI 3.0 specifications available at `/openapi.json`
