from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from src.vector_db import db_instance
from src.logging import setup_logging
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Gauge

app = FastAPI(
    title="JourneyIQ Vector Store Service",
    version="1.0.0",
    description="""
    FAISS-based vector similarity search for RAG.
    
    ## Features
    - Vector storage and retrieval
    - Similarity search
    - Index management
    - Embedding queries
    """,
    contact={"name": "JourneyIQ API Support", "email": "support@journeyiq.com"},
    license_info={"name": "MIT"},
    openapi_tags=[
        {"name": "Vector Search", "description": "Vector search operations"},
    ]
)
setup_logging()
Instrumentator().instrument(app).expose(app)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

# Metrics
INDEX_SIZE = Gauge("vector_index_size_documents", "Number of documents in vector index")

class Document(BaseModel):
    content: str
    metadata: Dict[str, Any] = {}

class SearchRequest(BaseModel):
    query: str
    k: int = 3

@app.post("/index")
async def add_documents(documents: List[Document]):
    texts = [d.content for d in documents]
    metas = [d.metadata for d in documents]
    # In real app: include content in metadata or separate store to retrieve it
    # Here we store content in metadata for simplicity in retrieval
    for i, m in enumerate(metas):
        m["content"] = texts[i]
        
    db_instance.add_documents(texts, metas)
    INDEX_SIZE.set(len(db_instance.metadata))
    return {"status": "indexed", "count": len(texts)}

@app.post("/search")
async def search(request: SearchRequest):
    results = db_instance.search(request.query, request.k)
    return {"results": results}

@app.post("/reset")
async def reset_index():
    db_instance.reset()
    INDEX_SIZE.set(0)
    return {"status": "index_cleared"}
