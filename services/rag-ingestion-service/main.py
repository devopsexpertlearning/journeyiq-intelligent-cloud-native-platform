from fastapi import FastAPI, BackgroundTasks
from prometheus_fastapi_instrumentator import Instrumentator
from src.logging import setup_logging
from src.ingest import ingest_rag_documents
import asyncio

app = FastAPI(
    title="JourneyIQ RAG Ingestion Service",
    version="1.0.0",
    description="""
    Document ingestion for RAG pipeline.
    
    ## Features
    - Document chunking
    - Embedding generation
    - Vector store indexing
    - Batch processing
    """,
    contact={"name": "JourneyIQ API Support", "email": "support@journeyiq.com"},
    license_info={"name": "MIT"},
    openapi_tags=[
        {"name": "Health", "description": "Health check endpoints"},
        {"name": "Ingestion", "description": "Document ingestion operations"},
    ]
)
setup_logging()
Instrumentator().instrument(app).expose(app)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

@app.on_event("startup")
async def startup_event():
    # Run ingestion in background to not block startup
    asyncio.create_task(ingest_rag_documents())

@app.post("/trigger")
async def trigger_ingestion(background_tasks: BackgroundTasks):
    background_tasks.add_task(ingest_rag_documents)
    return {"status": "ingestion_triggered"}
