import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "ticketing-service"
    LOG_LEVEL: str = "INFO"
    
    # Ticket settings
    TICKET_VALIDITY_DAYS: int = 365  # Tickets valid for 1 year

settings = Settings()
