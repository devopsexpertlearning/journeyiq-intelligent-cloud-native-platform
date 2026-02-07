from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from contextlib import asynccontextmanager
from src.database import engine
from src.models import Base
from src.routes import iot

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"asctime": "%(asctime)s", "levelname": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)

logger = logging.getLogger("iot-service")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created")
    yield
    # Shutdown
    await engine.dispose()

# Create FastAPI app
app = FastAPI(
    title="JourneyIQ IoT Service",
    description="Smart Device Tracking & Telemetry",
    version="1.0.0",
    lifespan=lifespan
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
app.include_router(iot.router)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "iot-service"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
