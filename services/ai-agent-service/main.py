from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Dict, Any
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram, Gauge
import time
import asyncio

# Import from existing modules
from src.agent.graph import app_graph
from langchain_core.messages import HumanMessage
from src.vector_db import db_instance
from src.ingest import ingest_rag_documents
from src.routes import health
from src.logging import setup_logging, logger

# ============================================================================
# Pydantic Models
# ============================================================================

# AI Agent Models
class ChatRequest(BaseModel):
    message: str
    user_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    user_id: str

# Vector Store Models
class Document(BaseModel):
    content: str
    metadata: Dict[str, Any] = {}

class SearchRequest(BaseModel):
    query: str
    k: int = 3

# ============================================================================
# Custom Metrics
# ============================================================================

# AI Agent Metrics
AI_LATENCY = Histogram("ai_latency_seconds", "Time spent in AI agent")
AI_TOKENS = Counter("ai_token_usage", "Tokens used by AI", ["model"])
AI_ACTIONS = Counter("ai_action_count", "Actions taken by AI", ["tool"])

# Vector Store Metrics
INDEX_SIZE = Gauge("vector_index_size_documents", "Number of documents in vector index")

# ============================================================================
# FastAPI App
# ============================================================================

app = FastAPI(
    title="JourneyIQ AI Service",
    version="2.0.0",
    description="""
    Unified AI service combining AI Agent, Vector Store, and RAG Ingestion.
    
    ## Features
    
    ### AI Agent
    - Natural language query processing
    - RAG-based policy answers
    - Multi-turn conversations
    - Tool calling for bookings
    
    ### Vector Store
    - FAISS-based vector similarity search
    - Document indexing and retrieval
    - Semantic search
    
    ### RAG Ingestion
    - Document chunking
    - Embedding generation
    - Batch processing
    
    ## Supported LLM Providers
    - Gemini (local development)
    - Azure OpenAI (production)
    - Groq (alternative)
    """,
    contact={"name": "JourneyIQ API Support", "email": "support@journeyiq.com"},
    license_info={"name": "MIT"},
    openapi_tags=[
        {"name": "Health", "description": "Health check endpoints"},
        {"name": "AI Agent", "description": "AI conversation operations"},
        {"name": "Vector Store", "description": "Vector search operations"},
        {"name": "RAG Ingestion", "description": "Document ingestion operations"},
    ]
)

setup_logging()
Instrumentator().instrument(app).expose(app)

# Include health router
app.include_router(health.router, tags=["Health"])

# ============================================================================
# Startup Event
# ============================================================================

@app.on_event("startup")
async def startup_event():
    """Run RAG ingestion in background on startup"""
    logger.info("Starting AI Service - initializing RAG ingestion")
    asyncio.create_task(ingest_rag_documents())

# ============================================================================
# AI Agent Endpoints
# ============================================================================

@app.post("/chat", tags=["AI Agent"], response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Chat with the AI agent using natural language.
    
    The agent can:
    - Answer travel policy questions
    - Help with bookings
    - Provide recommendations
    - Handle multi-turn conversations
    """
    start_time = time.time()
    try:
        inputs = {
            "messages": [HumanMessage(content=request.message)], 
            "user_id": request.user_id
        }
        result = await app_graph.ainvoke(inputs)
        
        # Measure latency
        duration = time.time() - start_time
        AI_LATENCY.observe(duration)
        
        # In production: extract tokens from response.response_metadata
        # AI_TOKENS.labels(model="groq").inc(100)
        
        return ChatResponse(
            response=result["messages"][-1].content,
            user_id=request.user_id
        )
    except Exception as e:
        logger.error(f"AI agent error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"AI agent error: {str(e)}")

# ============================================================================
# Vector Store Endpoints
# ============================================================================

@app.post("/index", tags=["Vector Store"])
async def add_documents(documents: List[Document]):
    """
    Add documents to the vector index.
    
    Documents are embedded and stored in FAISS for similarity search.
    """
    try:
        texts = [d.content for d in documents]
        metas = [d.metadata for d in documents]
        
        # Store content in metadata for retrieval
        for i, m in enumerate(metas):
            m["content"] = texts[i]
            
        db_instance.add_documents(texts, metas)
        INDEX_SIZE.set(len(db_instance.metadata))
        
        logger.info(f"Indexed {len(texts)} documents")
        return {"status": "indexed", "count": len(texts)}
    except Exception as e:
        logger.error(f"Indexing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Indexing error: {str(e)}")

@app.post("/search", tags=["Vector Store"])
async def search(request: SearchRequest):
    """
    Search for similar documents using semantic similarity.
    
    Returns the top-k most similar documents based on the query.
    """
    try:
        results = db_instance.search(request.query, request.k)
        return {"results": results}
    except Exception as e:
        logger.error(f"Search error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Search error: {str(e)}")

@app.post("/reset", tags=["Vector Store"])
async def reset_index():
    """
    Clear the entire vector index.
    
    WARNING: This will delete all indexed documents.
    """
    try:
        db_instance.reset()
        INDEX_SIZE.set(0)
        logger.info("Vector index cleared")
        return {"status": "index_cleared"}
    except Exception as e:
        logger.error(f"Reset error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Reset error: {str(e)}")

@app.get("/stats", tags=["Vector Store"])
async def get_stats():
    """Get vector store statistics"""
    return {
        "document_count": len(db_instance.metadata),
        "index_type": "FAISS",
        "embedding_model": "sentence-transformers"
    }

# ============================================================================
# RAG Ingestion Endpoints
# ============================================================================

@app.post("/trigger", tags=["RAG Ingestion"])
async def trigger_ingestion(background_tasks: BackgroundTasks):
    """
    Trigger RAG document ingestion in the background.
    
    This will:
    1. Load documents from configured sources
    2. Chunk them appropriately
    3. Generate embeddings
    4. Index in vector store
    """
    background_tasks.add_task(ingest_rag_documents)
    logger.info("RAG ingestion triggered")
    return {"status": "ingestion_triggered"}

@app.get("/status", tags=["RAG Ingestion"])
async def get_ingestion_status():
    """Get the current status of RAG ingestion"""
    return {
        "status": "ready",
        "documents_indexed": len(db_instance.metadata),
        "last_ingestion": "on_startup"
    }
