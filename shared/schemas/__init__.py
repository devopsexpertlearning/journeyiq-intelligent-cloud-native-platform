"""
Shared Schema Utilities

Pydantic models and JSON schema validation.
"""

from .models import (
    # User models
    UserRole,
    LoyaltyTier,
    UserCreate,
    UserResponse,
    # Booking models
    ResourceType,
    BookingStatus,
    PassengerInfo,
    BookingCreate,
    BookingResponse,
    # Payment models
    PaymentMethod,
    PaymentStatus,
    PaymentCreate,
    PaymentResponse,
    # Search models
    FlightClass,
    FlightStatus,
    FlightSearch,
    FlightResponse,
    HotelSearch,
    HotelResponse,
    # AI models
    ChatRequest,
    ChatResponse,
    # Review models
    ReviewCreate,
    ReviewResponse,
    # Health models
    HealthResponse,
)

from .validator import (
    load_schema,
    validate_event,
    is_valid_event,
)

__all__ = [
    # Enums
    "UserRole",
    "LoyaltyTier",
    "ResourceType",
    "BookingStatus",
    "PaymentMethod",
    "PaymentStatus",
    "FlightClass",
    "FlightStatus",
    # User models
    "UserCreate",
    "UserResponse",
    # Booking models
    "PassengerInfo",
    "BookingCreate",
    "BookingResponse",
    # Payment models
    "PaymentCreate",
    "PaymentResponse",
    # Search models
    "FlightSearch",
    "FlightResponse",
    "HotelSearch",
    "HotelResponse",
    # AI models
    "ChatRequest",
    "ChatResponse",
    # Review models
    "ReviewCreate",
    "ReviewResponse",
    # Health models
    "HealthResponse",
    # Validators
    "load_schema",
    "validate_event",
    "is_valid_event",
]
