import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "pricing-service"
    LOG_LEVEL: str = "INFO"
    
    # Pricing configuration
    TAX_RATE: float = 0.15  # 15% tax
    BASE_FEE_PER_PASSENGER: float = 50.00
    
    # Class multipliers
    CLASS_MULTIPLIERS: dict = {
        "economy": 1.0,
        "premium": 1.5,
        "business": 2.5,
        "first": 4.0
    }
    
    # Add-on prices
    ADDON_PRICES: dict = {
        "baggage": 35.00,
        "seat_selection": 25.00,
        "priority_boarding": 15.00,
        "meal": 20.00,
        "wifi": 10.00,
        "extra_legroom": 40.00
    }

settings = Settings()
