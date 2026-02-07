import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    SERVICE_NAME: str = "admin-service"
    LOG_LEVEL: str = "INFO"
    
    # Service URLs for aggregation
    USER_SERVICE_URL: str = "http://user-service:8000"
    BOOKING_SERVICE_URL: str = "http://booking-service:8000"
    ANALYTICS_SERVICE_URL: str = "http://analytics-service:8000"
    INVENTORY_SERVICE_URL: str = "http://inventory-service:8000"

settings = Settings()
