from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.events import notification_consumer
from src.logging import setup_logging
from src.routes import health
from prometheus_fastapi_instrumentator import Instrumentator
import asyncio

app = FastAPI(
    title="JourneyIQ Notification Service",
    version="1.0.0",
    description="""
    Multi-channel notification delivery system.
    
    ## Features
    - Email notifications
    - SMS alerts  
    - Push notifications
    - Event-driven messaging
    """,
    contact={"name": "JourneyIQ API Support", "email": "support@journeyiq.com"},
    license_info={"name": "MIT"},
    openapi_tags=[
        {"name": "Health", "description": "Health check endpoints"},
        {"name": "Notifications", "description": "Notification delivery operations"},
    ]
)

# Setup Logging
setup_logging()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Metrics
Instrumentator().instrument(app).expose(app)

# Routes
app.include_router(health.router, tags=["Health"])

@app.on_event("startup")
async def startup_event():
    # Start consumer (non-blocking in this simplified mock/thread model)
    # The Google PubSub client start_listening returns a future, it runs in bg threads.
    notification_consumer.start_listening()

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

