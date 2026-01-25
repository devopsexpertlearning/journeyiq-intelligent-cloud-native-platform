from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost/auth_db"
    ENVIRONMENT: str = "local"
    
    class Config:
        env_file = ".env"

settings = Settings()
