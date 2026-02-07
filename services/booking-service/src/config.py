import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "booking-service"
    LOG_LEVEL: str = "INFO"
    
    # Service URLs
    PRICING_SERVICE_URL: str = os.getenv("PRICING_SERVICE_URL", "http://pricing-service:8000")
    INVENTORY_SERVICE_URL: str = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8000")
    
    # Booking settings
    BOOKING_EXPIRATION_MINUTES: int = 15  # Unpaid bookings expire after 15 minutes

settings = Settings()
