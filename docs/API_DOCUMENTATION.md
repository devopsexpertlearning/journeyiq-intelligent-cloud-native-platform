# JourneyIQ API Documentation - Swagger/OpenAPI

## ✅ All Services Have Swagger Documentation Available

All 15 microservices are configured with FastAPI's automatic OpenAPI documentation.

## Access Swagger UI

Each service provides interactive API documentation at the `/docs` endpoint:

| Service | Swagger UI | OpenAPI Spec |
|---------|------------|--------------|
| **API Gateway** | http://localhost:8000/docs | http://localhost:8000/openapi.json |
| **Auth Service** | http://localhost:8000/auth/docs | http://localhost:8000/auth/openapi.json |
| **User Service** | http://localhost:8000/users/docs | http://localhost:8000/users/openapi.json |
| **Search Service** | http://localhost:8000/search/docs | http://localhost:8000/search/openapi.json |
| **Pricing Service** | http://localhost:8000/pricing/docs | http://localhost:8000/pricing/openapi.json |
| **Inventory Service** | http://localhost:8000/inventory/docs | http://localhost:8000/inventory/openapi.json |
| **Booking Service** | http://localhost:8000/bookings/docs | http://localhost:8000/bookings/openapi.json |
| **Payment Service** | http://localhost:8000/payments/docs | http://localhost:8000/payments/openapi.json |
| **Ticketing Service** | http://localhost:8000/ticketing/docs | http://localhost:8000/ticketing/openapi.json |
| **Notification Service** | http://localhost:8000/notifications/docs | http://localhost:8000/notifications/openapi.json |
| **Review Service** | http://localhost:8000/reviews/docs | http://localhost:8000/reviews/openapi.json |
| **Analytics Service** | http://localhost:8000/analytics/docs | http://localhost:8000/analytics/openapi.json |
| **AI Agent Service** | http://localhost:8000/agent/docs | http://localhost:8000/agent/openapi.json |
| **IoT Service** | http://localhost:8000/iot/docs | http://localhost:8000/iot/openapi.json |
| **Admin Service** | http://localhost:8000/admin/docs | http://localhost:8000/admin/openapi.json |

## Features

Each Swagger UI page provides:
- **Interactive API Testing**: Try out endpoints directly from the browser
- **Request/Response Examples**: See example payloads and responses
- **Schema Documentation**: View data models and validation rules
- **Authentication**: Test authenticated endpoints (where applicable)



## Alternative Documentation

FastAPI also provides ReDoc documentation at `/redoc` for each service:
- Example: http://localhost:8000/redoc

## Notes

- All services use FastAPI's automatic OpenAPI generation
- Documentation is generated from Python type hints and docstrings
- Swagger UI is served at `/docs` (default FastAPI behavior)
- OpenAPI 3.0 specifications available at `/openapi.json`
