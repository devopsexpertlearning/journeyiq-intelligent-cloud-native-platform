from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from src.routes import bookings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"asctime": "%(asctime)s", "levelname": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)

logger = logging.getLogger("booking-service")

# Create FastAPI app
app = FastAPI(
    title="JourneyIQ Booking Service",
    description="Booking management with passenger information and payment integration",
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


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "booking-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "booking-service",
        "version": "1.0.0",
        "endpoints": {
            "create_booking": "POST /bookings",
            "get_booking": "GET /bookings/{id}",
            "list_user_bookings": "GET /bookings/user/{user_id}",
            "cancel_booking": "DELETE /bookings/{id}",
            "health": "/health"
        }
    }


# Include routers (After static routes to avoid shadowing)
app.include_router(bookings.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
