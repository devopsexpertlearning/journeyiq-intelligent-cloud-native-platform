from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.logging import setup_logging
from src.routes import health
from prometheus_fastapi_instrumentator import Instrumentator
import os

app = FastAPI(title="JourneyIQ Auth Service", version="1.0.0")

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
    # In a real app, initialize DB connection pool here if not using dependency injection
    pass

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

