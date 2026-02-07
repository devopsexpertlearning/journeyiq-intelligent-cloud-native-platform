from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from src.routes import tickets

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"asctime": "%(asctime)s", "levelname": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)

logger = logging.getLogger("ticketing-service")

# Create FastAPI app
app = FastAPI(
    title="JourneyIQ Ticketing Service",
    description="E-ticket generation with PDF and QR code support",
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
    return {"status": "healthy", "service": "ticketing-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "ticketing-service",
        "version": "1.0.0",
        "endpoints": {
            "generate_ticket": "POST /ticketing/generate",
            "get_ticket": "GET /ticketing/{id}",
            "download_pdf": "GET /ticketing/{id}/download",
            "validate_ticket": "POST /ticketing/{id}/validate",
            "use_ticket": "POST /ticketing/{id}/use",
            "health": "/health"
        }
    }


# Include routers (After static routes to avoid shadowing)
app.include_router(tickets.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
