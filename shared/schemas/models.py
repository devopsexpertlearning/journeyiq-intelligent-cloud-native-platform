"""
Pydantic Models for API Request/Response Validation

Shared data models used across all JourneyIQ services.
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


# ============================================================================
# User Models
# ============================================================================

class UserRole(str, Enum):
    """User role enumeration"""
    USER = "user"
    ADMIN = "admin"
    AGENT = "agent"


class LoyaltyTier(str, Enum):
    """Loyalty tier enumeration"""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=100)


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8)


class UserResponse(UserBase):
    """User response model"""
    id: str
    role: UserRole = UserRole.USER
    loyalty_tier: LoyaltyTier = LoyaltyTier.BRONZE
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Booking Models
# ============================================================================

class ResourceType(str, Enum):
    """Resource type enumeration"""
    FLIGHT = "FLIGHT"
    HOTEL = "HOTEL"


class BookingStatus(str, Enum):
    """Booking status enumeration"""
    PENDING = "PENDING"
    CONFIRMED = "CONFIRMED"
    CANCELLED = "CANCELLED"


class PassengerInfo(BaseModel):
    """Passenger information"""
    name: str = Field(..., min_length=1)
    seat: Optional[str] = None


class BookingCreate(BaseModel):
    """Booking creation model"""
    user_id: str
    resource_type: ResourceType
    resource_id: str
    passengers: List[PassengerInfo] = Field(..., min_items=1)


class BookingResponse(BaseModel):
    """Booking response model"""
    booking_id: str
    user_id: str
    resource_type: ResourceType
    resource_id: str
    status: BookingStatus
    amount: float
    currency: str = "USD"
    payment_required: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Payment Models
# ============================================================================

class PaymentMethod(str, Enum):
    """Payment method enumeration"""
    CARD = "CARD"
    PAYPAL = "PAYPAL"
    BANK_TRANSFER = "BANK_TRANSFER"


class PaymentStatus(str, Enum):
    """Payment status enumeration"""
    PENDING = "PENDING"
    SUCCEEDED = "SUCCEEDED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"


class CardInfo(BaseModel):
    """Credit card information"""
    card_number: str = Field(..., regex=r'^\d{16}$')
    expiry: str = Field(..., regex=r'^\d{2}/\d{2}$')
    cvv: str = Field(..., regex=r'^\d{3,4}$')


class PaymentMethodInfo(BaseModel):
    """Payment method information"""
    type: PaymentMethod
    card_number: Optional[str] = None
    expiry: Optional[str] = None
    cvv: Optional[str] = None


class PaymentCreate(BaseModel):
    """Payment creation model"""
    booking_id: str
    amount: float = Field(..., gt=0)
    currency: str = "USD"
    payment_method: PaymentMethodInfo


class PaymentResponse(BaseModel):
    """Payment response model"""
    payment_id: str
    booking_id: str
    amount: float
    currency: str
    status: PaymentStatus
    transaction_id: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Search Models
# ============================================================================

class FlightClass(str, Enum):
    """Flight class enumeration"""
    ECONOMY = "ECONOMY"
    BUSINESS = "BUSINESS"
    FIRST = "FIRST"


class FlightStatus(str, Enum):
    """Flight status enumeration"""
    SCHEDULED = "SCHEDULED"
    DELAYED = "DELAYED"
    CANCELLED = "CANCELLED"
    COMPLETED = "COMPLETED"


class FlightSearch(BaseModel):
    """Flight search parameters"""
    origin: str = Field(..., min_length=3, max_length=3)
    destination: str = Field(..., min_length=3, max_length=3)
    departure_date: Optional[str] = None
    max_price: Optional[float] = Field(None, gt=0)
    flight_class: Optional[FlightClass] = None


class FlightResponse(BaseModel):
    """Flight response model"""
    id: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    base_price: float
    status: FlightStatus
    available_seats: int
    
    class Config:
        from_attributes = True


class HotelSearch(BaseModel):
    """Hotel search parameters"""
    location: str = Field(..., min_length=1)
    check_in: Optional[str] = None
    check_out: Optional[str] = None
    min_rating: Optional[float] = Field(None, ge=1, le=5)


class HotelResponse(BaseModel):
    """Hotel response model"""
    id: str
    name: str
    location: str
    rating: float = Field(..., ge=1, le=5)
    price_per_night: float
    available_rooms: int
    
    class Config:
        from_attributes = True


# ============================================================================
# AI Agent Models
# ============================================================================

class ChatRequest(BaseModel):
    """AI agent chat request"""
    message: str = Field(..., min_length=1, max_length=1000)
    user_id: str


class ChatResponse(BaseModel):
    """AI agent chat response"""
    response: str
    confidence: Optional[float] = None
    sources: Optional[List[str]] = None


# ============================================================================
# Review Models
# ============================================================================

class ReviewCreate(BaseModel):
    """Review creation model"""
    user_id: str
    resource_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: Optional[str] = Field(None, max_length=500)


class ReviewResponse(BaseModel):
    """Review response model"""
    id: str
    user_id: str
    resource_id: str
    rating: int
    comment: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# ============================================================================
# Health Check Models
# ============================================================================

class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "healthy"
    service: Optional[str] = None
    version: Optional[str] = None
    timestamp: Optional[datetime] = None
