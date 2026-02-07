import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "payment-service"
    LOG_LEVEL: str = "INFO"
    
    # Payment gateway settings (mock)
    PAYMENT_SUCCESS_RATE: float = 0.95  # 95% success rate for mock payments

settings = Settings()
