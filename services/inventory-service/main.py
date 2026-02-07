from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from src.routes import availability

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"asctime": "%(asctime)s", "levelname": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)

logger = logging.getLogger("inventory-service")

# Create FastAPI app
app = FastAPI(
    title="JourneyIQ Inventory Service",
    description="Real-time seat and room availability tracking",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Prometheus metrics
Instrumentator().instrument(app).expose(app)

# Include routers
app.include_router(availability.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "inventory-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "inventory-service",
        "version": "1.0.0",
        "endpoints": {
            "flight_seats": "/inventory/flights/{flight_id}/seats",
            "hotel_rooms": "/inventory/hotels/{hotel_id}/rooms",
            "summary": "/inventory/availability/summary",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
