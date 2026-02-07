from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import Optional, List
import uuid
import uuid as uuid_lib

router = APIRouter()

class ChatRequest(BaseModel):
    user_id: Optional[str] = None
    message: str
    context_id: Optional[str] = None

class FeedbackRequest(BaseModel):
    message_id: str
    helpful: bool
    comment: Optional[str] = None

@router.post("/chat")
async def chat_agent(request: ChatRequest):
    # Journey 8, 61
    # Mock RAG / Agent response
    conversation_id = request.context_id or str(uuid.uuid4())
    
    response_text = "I found some flights to Paris for you."
    if "hotel" in request.message.lower():
        response_text = "Here are some top-rated hotels in Paris."
    
    return {
        "message_id": str(uuid.uuid4()),
        "response": response_text,
        "context_id": conversation_id,
        "suggested_actions": ["Book Now", "View Details"]
    }

@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest):
    # Journey 41
    # Save feedback to DB
    return {"status": "received", "id": str(uuid.uuid4())}

@router.post("/agent/plan")
async def plan_trip(request: ChatRequest):
    # Journey 64
    return {
        "plan_id": str(uuid.uuid4()),
        "itinerary": {
            "day_1": "Visit Eiffel Tower",
            "day_2": "Louvre Museum"
        }
    }
