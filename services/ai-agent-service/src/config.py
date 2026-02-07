from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/auth_db"
    ENVIRONMENT: str = "local"
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/auth_db"
    ENVIRONMENT: str = "local"
    SEARCH_SERVICE_URL: str = "http://search-service:8000"
    BOOKING_SERVICE_URL: str = "http://booking-service:8000"
    
    class Config:
        env_file = ".env"

settings = Settings()
