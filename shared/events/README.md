# Shared Events

Event publishing and consumption utilities for Google Pub/Sub.

## Overview

This package provides utilities for publishing and consuming events across JourneyIQ microservices using Google Pub/Sub.

## Components

### 1. Event Publisher (`publisher.py`)

**Functions:**
- `publish_event(topic, data, attributes)` - Generic event publisher
- `publish_booking_created(booking_id, user_id, amount)` - Booking created event
- `publish_payment_succeeded(payment_id, booking_id, amount)` - Payment succeeded event
- `publish_booking_cancelled(booking_id, user_id, reason)` - Booking cancelled event

**Usage:**
```python
from shared.events import publish_booking_created

# Publish event
message_id = publish_booking_created(
    booking_id="b123",
    user_id="u456",
    amount=720.00,
    currency="USD"
)
```

### 2. Event Consumer (`consumer.py`)

**Classes:**
- `EventConsumer` - Event consumer with handler registration

**Usage:**
```python
from shared.events import EventConsumer

# Create consumer
consumer = EventConsumer('booking-events-subscription')

# Register handler
def handle_booking(event_data):
    booking_id = event_data['booking_id']
    print(f"Processing booking: {booking_id}")

consumer.register_handler('booking.created', handle_booking)

# Start listening (blocking)
consumer.start_listening()
```

## Event Schemas

Event schemas are defined in `shared/events/schemas/`:
- `booking.created.v1.json`
- `payment.succeeded.v1.json`
- `user.registered.v1.json`

## Configuration

Set environment variables:

```bash
GCP_PROJECT_ID=journeyiq-prod
PUBSUB_EMULATOR_HOST=localhost:8085  # For local development
SERVICE_NAME=booking-service
```

## Local Development

Use Pub/Sub emulator for local testing:

```bash
# Start emulator (in docker-compose)
docker-compose up pubsub-emulator

# Services will automatically use emulator if PUBSUB_EMULATOR_HOST is set
```

## Event Flow

```
Booking Service → publish_booking_created()
                ↓
         Pub/Sub Topic (booking-events)
                ↓
         Subscription (booking-events-notification)
                ↓
Notification Service → EventConsumer → handle_booking_created()
```

## Best Practices

✅ **Idempotency** - Handlers should be idempotent (safe to retry)  
✅ **Error Handling** - Always handle exceptions in handlers  
✅ **Acknowledgment** - Ack messages after successful processing  
✅ **Logging** - Log all event processing for debugging  
✅ **Schema Validation** - Validate events against JSON schemas  

## Dependencies

```bash
pip install google-cloud-pubsub
```

## Testing

```python
# Mock publisher for testing
from unittest.mock import patch

with patch('shared.events.publisher.publisher.publish') as mock_publish:
    publish_booking_created("b123", "u456", 720.00)
    assert mock_publish.called
```

## Files

- `publisher.py` - Event publishing utilities
- `consumer.py` - Event consumption utilities
- `__init__.py` - Package exports
- `schemas/` - JSON schemas for events
- `README.md` - This file
