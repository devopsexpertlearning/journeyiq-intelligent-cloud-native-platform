# Shared Schemas

Pydantic models and JSON schema validation for JourneyIQ platform.

## Overview

This package provides shared data models (Pydantic) and JSON schema validation utilities used across all microservices.

## Components

### 1. Pydantic Models (`models.py`)

**User Models:**
- `UserCreate` - User registration
- `UserResponse` - User data response
- `UserRole` - Enum: user, admin, agent
- `LoyaltyTier` - Enum: bronze, silver, gold, platinum

**Booking Models:**
- `BookingCreate` - Create booking request
- `BookingResponse` - Booking data response
- `BookingStatus` - Enum: PENDING, CONFIRMED, CANCELLED
- `ResourceType` - Enum: FLIGHT, HOTEL

**Payment Models:**
- `PaymentCreate` - Payment request
- `PaymentResponse` - Payment data response
- `PaymentStatus` - Enum: PENDING, SUCCEEDED, FAILED, REFUNDED

**Search Models:**
- `FlightSearch` - Flight search parameters
- `FlightResponse` - Flight data
- `HotelSearch` - Hotel search parameters
- `HotelResponse` - Hotel data

**AI Models:**
- `ChatRequest` - AI agent chat request
- `ChatResponse` - AI agent response

**Review Models:**
- `ReviewCreate` - Review submission
- `ReviewResponse` - Review data

### 2. JSON Schema Validator (`validator.py`)

**Functions:**
- `load_schema(schema_name)` - Load JSON schema from file
- `validate_event(event_data, schema_name)` - Validate event (raises exception)
- `is_valid_event(event_data, schema_name)` - Check validity (returns bool)

## Usage

### Pydantic Models

```python
from shared.schemas import UserCreate, BookingCreate, PaymentCreate

# Validate user registration
user_data = UserCreate(
    email="user@example.com",
    full_name="John Doe",
    password="SecurePass123!"
)

# Validate booking creation
booking_data = BookingCreate(
    user_id="u123",
    resource_type="FLIGHT",
    resource_id="f456",
    passengers=[{"name": "John Doe", "seat": "10A"}]
)

# Automatic validation on instantiation
try:
    payment = PaymentCreate(
        booking_id="b789",
        amount=720.00,
        currency="USD",
        payment_method={"type": "CARD", "card_number": "4111111111111111"}
    )
except ValidationError as e:
    print(e.errors())
```

### JSON Schema Validation

```python
from shared.schemas import validate_event, is_valid_event

# Validate event
event_data = {
    "event_type": "booking.created",
    "booking_id": "b123",
    "user_id": "u456",
    "amount": 720.00
}

# Raises exception if invalid
validate_event(event_data, "booking.created.v1.json")

# Returns boolean
if is_valid_event(event_data, "booking.created.v1.json"):
    print("Event is valid")
```

## JSON Schemas

Event schemas are in `shared/events/schemas/`:
- `booking.created.v1.json`
- `payment.succeeded.v1.json`
- `user.registered.v1.json`

## Benefits

✅ **Type Safety** - Pydantic provides runtime type checking  
✅ **Validation** - Automatic validation of all fields  
✅ **Documentation** - Models serve as API documentation  
✅ **Consistency** - Shared models ensure consistency across services  
✅ **IDE Support** - Autocomplete and type hints  

## Dependencies

```bash
pip install pydantic[email] jsonschema
```

## Testing

```python
from shared.schemas import UserCreate
from pydantic import ValidationError

# Valid user
user = UserCreate(
    email="test@example.com",
    full_name="Test User",
    password="SecurePass123!"
)
assert user.email == "test@example.com"

# Invalid email
try:
    user = UserCreate(
        email="invalid-email",
        full_name="Test",
        password="pass"
    )
except ValidationError as e:
    print("Validation failed:", e.errors())
```

## Files

- `models.py` - Pydantic data models
- `validator.py` - JSON schema validation
- `__init__.py` - Package exports
- `examples/` - JSON schema files
- `README.md` - This file
