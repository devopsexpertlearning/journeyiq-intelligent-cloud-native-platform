# JourneyIQ API Documentation

Complete API reference for all JourneyIQ microservices.

## Base URLs

**Local Development:**
- API Gateway: `http://localhost:8000`
- Service Access: All services accessible via Gateway paths (e.g., `/auth`, `/users`).

**Production:**
- API Gateway: `https://api.journeyiq.com`

---

## Authentication

All protected endpoints require JWT authentication.

### Get Access Token

**POST** `/auth/login`

```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice.voyager@journeyiq.com",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

### Using the Token

Include in `Authorization` header:
```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Service Endpoints

### 1. Auth Service (Gateway: /auth)

#### Register User
**POST** `/auth/register`

```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "full_name": "New User"
}
```

#### Refresh Token
**POST** `/auth/refresh`

```json
{
  "refresh_token": "..."
}
```

---

### 2. User Service (Gateway: /users)

#### Get User Profile
**GET** `/users/{user_id}`

```bash
curl http://localhost:8000/users/u0000000-0000-0000-0000-000000000001
```

#### Update Preferences
**PATCH** `/users/{user_id}/preferences`

```json
{
  "currency": "EUR",
  "seat_preference": "window",
  "diet": "vegetarian"
}
```

---

### 3. Search Service (Gateway: /search)

#### Search Flights
**GET** `/search/flights`

**Query Parameters:**
- `origin` (required): 3-letter airport code
- `destination` (required): 3-letter airport code
- `departure_date` (optional): YYYY-MM-DD
- `max_price` (optional): Maximum price

```bash
curl "http://localhost:8000/search/flights?origin=JFK&destination=LHR&max_price=700"
```

**Response:**
```json
{
  "flights": [
    {
      "id": "f0000000-0000-0000-0000-000000000001",
      "flight_number": "JQ101",
      "origin": "JFK",
      "destination": "LHR",
      "departure_time": "2026-01-15T08:00:00Z",
      "arrival_time": "2026-01-15T20:00:00Z",
      "base_price": 650.00,
      "status": "SCHEDULED"
    }
  ],
  "count": 1
}
```

#### Search Hotels
**GET** `/search/hotels`

**Query Parameters:**
- `location` (required): City name
- `check_in` (optional): YYYY-MM-DD
- `check_out` (optional): YYYY-MM-DD
- `min_rating` (optional): 1-5

```bash
curl "http://localhost:8000/search/hotels?location=Tokyo&min_rating=4.5"
```

---

### 4. Pricing Service (Gateway: /pricing)

#### Get Dynamic Price
**POST** `/pricing/calculate`

```json
{
  "resource_type": "FLIGHT",
  "resource_id": "f0000000-0000-0000-0000-000000000001",
  "travel_date": "2026-01-15",
  "passenger_count": 2
}
```

**Response:**
```json
{
  "base_price": 650.00,
  "dynamic_price": 720.00,
  "factors": {
    "demand_multiplier": 1.1,
    "seasonal_adjustment": 1.0
  }
}
```

---

### 5. Booking Service (Gateway: /bookings)

#### Create Booking
**POST** `/bookings`

```json
{
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "resource_type": "FLIGHT",
  "resource_id": "f0000000-0000-0000-0000-000000000001",
  "passengers": [
    {
      "name": "Alice Voyager",
      "seat": "10A"
    }
  ]
}
```

**Response:**
```json
{
  "booking_id": "b0000000-0000-0000-0000-000000000031",
  "status": "PENDING",
  "payment_required": true,
  "amount": 720.00,
  "currency": "USD"
}
```

#### Get Booking
**GET** `/bookings/{booking_id}`

#### Cancel Booking
**DELETE** `/bookings/{booking_id}`

---

### 6. Payment Service (Gateway: /payments)

#### Process Payment
**POST** `/payments`

```json
{
  "booking_id": "b0000000-0000-0000-0000-000000000031",
  "amount": 720.00,
  "currency": "USD",
  "payment_method": {
    "type": "CARD",
    "card_number": "4111111111111111",
    "expiry": "12/25",
    "cvv": "123"
  }
}
```

**Response:**
```json
{
  "payment_id": "p0000000-0000-0000-0000-000000000001",
  "status": "SUCCEEDED",
  "transaction_id": "txn_abc123"
}
```

---

### 7. AI Agent Service (Gateway: /agent)

#### Chat with AI Agent
**POST** `/agent/chat`

```json
{
  "message": "What is the baggage allowance for economy class?",
  "user_id": "u0000000-0000-0000-0000-000000000001"
}
```

**Response:**
```json
{
  "response": "Economy class passengers are allowed one carry-on bag (max 7kg) and one personal item. Checked baggage is not included and must be purchased separately at $30 per bag (up to 23kg)."
}
```

**Example Questions:**
- "What is the flight cancellation policy?"
- "How do I change my booking?"
- "What are the visa requirements for Japan?"
- "Tell me about the loyalty program"

---



---

### 8. Review Service (Gateway: /reviews)

#### Submit Review
**POST** `/reviews`

```json
{
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "resource_id": "f0000000-0000-0000-0000-000000000001",
  "rating": 5,
  "comment": "Excellent flight experience!"
}
```

#### Get Reviews
**GET** `/reviews/{resource_id}`

---

### 9. Notification Service (Gateway: /notifications)

#### Send Notification
**POST** `/notifications/send`

```json
{
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "type": "EMAIL",
  "template": "booking_confirmation",
  "data": {
    "booking_id": "b0000000-0000-0000-0000-000000000031",
    "flight_number": "JQ101"
  }
}
```

---

## Rate Limiting

- **Anonymous:** 100 requests/minute
- **Authenticated:** 1000 requests/minute
- **Premium:** 10,000 requests/minute

**Headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642521600
```

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "BOOKING_NOT_FOUND",
    "message": "Booking with ID b123 not found",
    "details": {
      "booking_id": "b123"
    }
  }
}
```

**Common Error Codes:**
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Too Many Requests
- `500` - Internal Server Error

---

## Webhooks

Subscribe to events:

**POST** `/webhooks/subscribe`

```json
{
  "url": "https://your-app.com/webhooks",
  "events": ["booking.created", "payment.succeeded"]
}
```

**Event Payload:**
```json
{
  "event": "booking.created",
  "timestamp": "2026-01-14T14:50:00Z",
  "data": {
    "booking_id": "b0000000-0000-0000-0000-000000000031",
    "user_id": "u0000000-0000-0000-0000-000000000001"
  }
}
```

---


---

### 10. IoT Service (Gateway: /iot)

#### Update Device Telemetry
**POST** `/iot/devices/{device_id}/telemetry`

```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "battery_level": 85.5
}
```

---

### 11. Admin Service (Gateway: /admin)

#### System Health Check
**GET** `/admin/health-check`

```json
{
  "overall_status": "healthy",
  "services": {
    "auth": "up",
    "database": "connected"
  }
}
```

---

## Interactive Documentation

Each service provides Swagger UI:

- Auth: http://localhost:8000/auth/docs
- User: http://localhost:8000/users/docs
- Search: http://localhost:8000/search/docs
- Booking: http://localhost:8000/bookings/docs
- AI Agent: http://localhost:8000/agent/docs

**Try it out directly in your browser!**

---

## SDKs

Coming soon:
- Python SDK
- JavaScript/TypeScript SDK
- Go SDK

---

## Support

- **API Status:** https://status.journeyiq.com
- **Support:** support@journeyiq.com
- **Slack:** #journeyiq-api
