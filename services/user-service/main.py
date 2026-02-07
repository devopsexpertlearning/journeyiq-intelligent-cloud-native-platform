from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.logging import setup_logging
from src.routes import health, users
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI(
    title="JourneyIQ User Service",
    version="1.0.0",
    description="""
    User profile and preference management.
    
    ## Features
    - User profile CRUD operations
    - Travel preferences management
    - Loyalty tier tracking
    - User search and filtering
    """,
    contact={"name": "JourneyIQ API Support", "email": "support@journeyiq.com"},
    license_info={"name": "MIT"},
    openapi_tags=[
        {"name": "Health", "description": "Health check endpoints"},
        {"name": "Users", "description": "User management operations"},
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
app.include_router(users.router, tags=["Users"], prefix="/users")

@app.on_event("startup")
async def startup_event():
    pass

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

