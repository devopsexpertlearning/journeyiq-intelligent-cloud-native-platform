from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.logging import setup_logging
from src.routes import health, auth
from prometheus_fastapi_instrumentator import Instrumentator
import os

app = FastAPI(
    title="JourneyIQ Auth Service",
    version="1.0.0",
    description="""
    Authentication and authorization service for JourneyIQ platform.
    
    ## Features
    - User registration and login
    - JWT token issuance
    - Token validation and refresh
    - Role-based access control
    
    ## Authentication Flow
    1. POST /auth/register - Create new user account
    2. POST /auth/login - Get JWT access token
    3. Use token in Authorization header: `Bearer <token>`
    4. POST /auth/refresh - Refresh expired token
    """,
    contact={
        "name": "JourneyIQ API Support",
        "email": "support@journeyiq.com",
    },
    license_info={
        "name": "MIT",
    },
    openapi_tags=[
        {"name": "Health", "description": "Health check endpoints"},
        {"name": "Authentication", "description": "User authentication operations"},
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
app.include_router(auth.router, tags=["Authentication"])

@app.on_event("startup")
async def startup_event():
    # In a real app, initialize DB connection pool here if not using dependency injection
    pass

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

