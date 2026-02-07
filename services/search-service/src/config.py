import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://postgres:postgres@postgres:5432/journeyiq"
    )
    SERVICE_NAME: str = "search-service"
    LOG_LEVEL: str = "INFO"

settings = Settings()
