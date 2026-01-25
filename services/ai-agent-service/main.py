from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from src.agent.graph import app_graph
from langchain_core.messages import HumanMessage
from prometheus_fastapi_instrumentator import Instrumentator
from prometheus_client import Counter, Histogram
import time
from src.logging import setup_logging

# Custom Metrics
AI_LATENCY = Histogram("ai_latency_seconds", "Time spent in AI agent")
AI_TOKENS = Counter("ai_token_usage", "Tokens used by AI", ["model"])
AI_ACTIONS = Counter("ai_action_count", "Actions taken by AI", ["tool"])

app = FastAPI(
    title="JourneyIQ AI Agent Service",
    version="1.0.0",
    description="""
    Intelligent AI agent powered by LangGraph for travel assistance.
    
    ## Features
    - Natural language query processing
    - RAG-based policy answers
    - Multi-turn conversations
    - Tool calling for bookings
    
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
    ]
)
setup_logging()
Instrumentator().instrument(app).expose(app)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "healthy"}

class ChatRequest(BaseModel):
    message: str
    user_id: str

@app.post("/agent/chat")
async def chat(request: ChatRequest):
    start_time = time.time()
    try:
        inputs = {"messages": [HumanMessage(content=request.message)], "user_id": request.user_id}
        result = await app_graph.ainvoke(inputs)
        
        # Measure
        duration = time.time() - start_time
        AI_LATENCY.observe(duration)
        
        # In real usage, extract tokens from response.response_metadata
        # AI_TOKENS.labels(model="groq").inc(100) 

        return {"response": result["messages"][-1].content}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
