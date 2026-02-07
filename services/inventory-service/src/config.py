import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "inventory-service"
    LOG_LEVEL: str = "INFO"
    
    # Reservation settings
    RESERVATION_TIMEOUT_MINUTES: int = 15  # Hold seats/rooms for 15 minutes

settings = Settings()
