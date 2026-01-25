from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from src.adapters.stripe import stripe_client
from src.logging import logger
import asyncio

router = APIRouter()

class PaymentRequest(BaseModel):
    booking_id: str
    amount: float
    # In a real event-driven system, this would consume from Pub/Sub, 
    # but we expose an HTTP endpoint for the 'Push' subscription or testing.

@router.post("/process")
async def process_payment(request: PaymentRequest):
    logger.info(f"Processing payment for booking {request.booking_id}")
    
    try:
        # Idempotency key based on booking_id ensures we don't double charge
        idempotency_key = f"idemp_{request.booking_id}"
        
        result = await stripe_client.create_payment_intent(
            amount=request.amount,
            currency="usd",
            idempotency_key=idempotency_key
        )
        
        logger.info(f"Payment successful: {result['id']}")
        # In real app: Publish 'PaymentSucceeded' event here
        return {"status": "success", "transaction_id": result["id"]}
        
    except Exception as e:
        logger.error(f"Payment failed: {e}")
        # In real app: Publish 'PaymentFailed' event here
        raise HTTPException(status_code=402, detail=str(e))
