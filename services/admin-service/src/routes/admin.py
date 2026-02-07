from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from pydantic import BaseModel
import httpx
import asyncio
from src.config import settings

router = APIRouter(tags=["admin"])

# Models
class ServiceStatus(BaseModel):
    service: str
    status: str
    details: Dict[str, Any] = {}

class SystemHealth(BaseModel):
    overall_status: str # HEALTHY, DEGRADED, DOWN
    services: List[ServiceStatus]

class AdminUser(BaseModel):
    id: str
    email: str
    role: str
    is_active: bool

@router.get("/health-check", response_model=SystemHealth)
async def system_health_check():
    """Check health of all registered microservices."""
    services = [
        {"name": "user-service", "url": f"{settings.USER_SERVICE_URL}/health"},
        {"name": "booking-service", "url": f"{settings.BOOKING_SERVICE_URL}/health"},
        {"name": "analytics-service", "url": f"{settings.ANALYTICS_SERVICE_URL}/health"},
        {"name": "inventory-service", "url": f"{settings.INVENTORY_SERVICE_URL}/health"},
    ]
    
    results = []
    failed_count = 0
    
    async with httpx.AsyncClient(timeout=3.0) as client:
        # Check all services in parallel
        tasks = [check_service(client, s["name"], s["url"]) for s in services]
        service_statuses = await asyncio.gather(*tasks)
        
        for status in service_statuses:
            results.append(status)
            if status.status != "UP":
                failed_count += 1
    
    overall = "HEALTHY"
    if failed_count == len(services):
        overall = "DOWN"
    elif failed_count > 0:
        overall = "DEGRADED"
        
    return SystemHealth(overall_status=overall, services=results)

async def check_service(client, name, url) -> ServiceStatus:
    try:
        response = await client.get(url)
        if response.status_code == 200:
            return ServiceStatus(service=name, status="UP", details=response.json())
        else:
            return ServiceStatus(service=name, status="DOWN", details={"error": f"Status {response.status_code}"})
    except Exception as e:
        return ServiceStatus(service=name, status="DOWN", details={"error": str(e)})

@router.get("/users", response_model=List[AdminUser])
async def list_users():
    """List all users (Proxy to User Service)."""
    # In a real app, this would use a dedicated admin endpoint in user-service with pagination
    # For now, we'll mock the internal call logic or just return sample data if user-service doesn't expose list
    
    # Simulating connection to user service
    try:
        async with httpx.AsyncClient() as client:
            # Assuming user-service has a list endpoint (which we implemented earlier?)
            # If not, we'll mock response for admin demo
            # response = await client.get(f"{settings.USER_SERVICE_URL}/users")
            # users = response.json()
            
            # Mock response for demo purposes
            return [
                {"id": "u1", "email": "admin@journeyiq.com", "role": "ADMIN", "is_active": True},
                {"id": "u2", "email": "user@example.com", "role": "USER", "is_active": True},
                {"id": "u3", "email": "traveler@example.com", "role": "USER", "is_active": True}
            ]
    except Exception as e:
        raise HTTPException(status_code=503, detail=f"User service unavailable: {str(e)}")

@router.post("/config/pricing")
async def update_pricing_rules(multiplier: float):
    """Update dynamic pricing rules."""
    # This would simulate pushing config to a config server or database
    return {"status": "updated", "message": f"Global pricing multiplier set to {multiplier}x"}
