from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class HealthResponse(BaseModel):
    status: str

@router.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok"}

@router.get("/ready", response_model=HealthResponse)
async def readiness_check():
    # Check DB or dependent services here
    return {"status": "ok"}
