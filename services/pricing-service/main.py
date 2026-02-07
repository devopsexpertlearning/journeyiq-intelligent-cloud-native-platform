from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from src.routes import calculate

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"asctime": "%(asctime)s", "levelname": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)

logger = logging.getLogger("pricing-service")

# Create FastAPI app
app = FastAPI(
    title="JourneyIQ Pricing Service",
    description="Dynamic pricing calculation with taxes, fees, and add-ons",
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
app.include_router(calculate.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "pricing-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "pricing-service",
        "version": "1.0.0",
        "endpoints": {
            "calculate": "/pricing/calculate",
            "add_ons": "/pricing/add-ons",
            "class_types": "/pricing/class-types",
            "health": "/health"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
