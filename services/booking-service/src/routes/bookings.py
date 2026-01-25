from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.models import Booking
from src.events import producer
from src.logging import logger
import uuid
import asyncio

router = APIRouter()

class BookingRequest(BaseModel):
    user_id: str
    flight_id: str
    price: float

class BookingResponse(BaseModel):
    booking_id: str
    status: str

@router.post("/", response_model=BookingResponse)
async def create_booking(request: BookingRequest):
    booking_id = str(uuid.uuid4())
    logger.info(f"Creating booking {booking_id} for user {request.user_id}")
    
    # In a real app, save to DB here. For now we assume DB save success.
    # booking = Booking(id=booking_id, user_id=request.user_id, status="PENDING", ...)
    
    event_data = {
        "booking_id": booking_id,
        "user_id": request.user_id,
        "flight_id": request.flight_id,
        "amount": request.price
    }
    
    try:
        await producer.publish("booking-created", event_data)
        logger.info(f"Published booking-created event for {booking_id}")
    except Exception as e:
        logger.error(f"Failed to publish event: {e}")
        raise HTTPException(status_code=500, detail="Failed to initiate booking")

    return BookingResponse(booking_id=booking_id, status="PENDING")

@router.get("/{booking_id}")
async def get_booking(booking_id: str):
    # Mock return for demo
    return {"booking_id": booking_id, "status": "CONFIRMED", "notes": "Demo: In real app, query DB"}
