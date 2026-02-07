from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
import logging
from src.routes import payments

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='{"asctime": "%(asctime)s", "levelname": "%(levelname)s", "name": "%(name)s", "message": "%(message)s"}'
)

logger = logging.getLogger("payment-service")

# Create FastAPI app
app = FastAPI(
    title="JourneyIQ Payment Service",
    description="Payment processing with mock gateway and refund handling",
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
    return {"status": "healthy", "service": "payment-service"}

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "payment-service",
        "version": "1.0.0",
        "endpoints": {
            "process_payment": "POST /payments",
            "get_payment": "GET /payments/{id}",
            "get_booking_payments": "GET /payments/booking/{booking_id}",
            "refund_payment": "POST /payments/{id}/refund",
            "health": "/health"
        }
    }


# Include routers (After static routes to avoid shadowing)
# Include routers (After static routes to avoid shadowing)
app.include_router(payments.router, prefix="/payments")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
