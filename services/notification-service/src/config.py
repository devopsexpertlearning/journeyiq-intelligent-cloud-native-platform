import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "notification-service"
    LOG_LEVEL: str = "INFO"
    
    # Mock Provider Settings
    EMAIL_ENABLED: bool = True
    SMS_ENABLED: bool = True
    
    # Provider API Keys (Mock)
    SENDGRID_API_KEY: str = "SG.mock_key"
    TWILIO_ACCOUNT_SID: str = "ACmock_sid"
    TWILIO_AUTH_TOKEN: str = "mock_token"

settings = Settings()
