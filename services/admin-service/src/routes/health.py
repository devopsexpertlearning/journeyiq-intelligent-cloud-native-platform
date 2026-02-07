from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str
    service: str = "admin-service"

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "healthy", "service": "admin-service"}

@router.get("/ready", response_model=HealthResponse)
async def readiness_check():
    return {"status": "ready", "service": "admin-service"}
