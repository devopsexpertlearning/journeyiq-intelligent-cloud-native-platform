from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional
from pydantic import BaseModel
from datetime import datetime
from uuid import uuid4
import random
from src.database import get_db
from src.models import Payment, Booking
from src.config import settings

router = APIRouter(tags=["payments"])

# Request/Response Models
class PaymentMethod(BaseModel):
    type: str  # credit_card, debit_card, paypal
    card_number: Optional[str] = None
    expiry_month: Optional[str] = None
    expiry_year: Optional[str] = None
    cvv: Optional[str] = None
    cardholder_name: Optional[str] = None

class PaymentRequest(BaseModel):
    booking_id: str
    amount: float
    currency: str = "USD"
    payment_method: PaymentMethod

class PaymentResponse(BaseModel):
    payment_id: str
    booking_id: str
    status: str
    transaction_id: str
    amount: float
    currency: str
    processed_at: datetime

@router.post("/", response_model=PaymentResponse, status_code=201)
async def process_payment(
    payment_request: PaymentRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Process a payment for a booking.
    - Mock payment gateway (95% success rate)
    - Updates booking status to CONFIRMED on success
    - Generates transaction ID
    """
    # Verify booking exists
    booking_result = await db.execute(
        select(Booking).where(Booking.id == payment_request.booking_id)
    )
    booking = booking_result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Cannot pay for cancelled booking")
    
    if booking.status == "CONFIRMED":
        raise HTTPException(status_code=400, detail="Booking already paid")
    
    # Mock payment processing
    payment_id = str(uuid4())
    transaction_id = f"TXN{random.randint(100000, 999999)}"
    
    # Simulate payment gateway (95% success rate)
    success = random.random() < settings.PAYMENT_SUCCESS_RATE
    
    if success:
        # Create payment record
        new_payment = Payment(
            id=payment_id,
            booking_id=payment_request.booking_id,
            amount=payment_request.amount,
            currency=payment_request.currency,
            status="SUCCEEDED"
        )
        db.add(new_payment)
        
        # Update booking status
        booking.status = "CONFIRMED"
        
        await db.commit()
        
        return PaymentResponse(
            payment_id=payment_id,
            booking_id=payment_request.booking_id,
            status="SUCCEEDED",
            transaction_id=transaction_id,
            amount=payment_request.amount,
            currency=payment_request.currency,
            processed_at=datetime.utcnow()
        )
    else:
        # Payment failed
        new_payment = Payment(
            id=payment_id,
            booking_id=payment_request.booking_id,
            amount=payment_request.amount,
            currency=payment_request.currency,
            status="FAILED"
        )
        db.add(new_payment)
        await db.commit()
        
        raise HTTPException(
            status_code=402,
            detail="Payment failed. Please try again or use a different payment method."
        )

@router.get("/{payment_id}")
async def get_payment(
    payment_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get payment details by ID."""
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return {
        "id": str(payment.id),
        "booking_id": str(payment.booking_id),
        "amount": float(payment.amount),
        "currency": payment.currency,
        "status": payment.status
    }

@router.get("/booking/{booking_id}")
async def get_booking_payments(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get all payments for a specific booking."""
    result = await db.execute(
        select(Payment).where(Payment.booking_id == booking_id)
    )
    payments = result.scalars().all()
    
    return {
        "booking_id": booking_id,
        "payments": [
            {
                "id": str(p.id),
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.status
            }
            for p in payments
        ],
        "total": len(payments)
    }

@router.post("/{payment_id}/refund")
async def refund_payment(
    payment_id: str,
    amount: Optional[float] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Process a refund for a payment.
    - Full or partial refund
    - Updates payment status to REFUNDED
    - Updates booking status to CANCELLED
    """
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id)
    )
    payment = result.scalar_one_or_none()
    
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    if payment.status != "SUCCEEDED":
        raise HTTPException(status_code=400, detail="Can only refund successful payments")
    
    # Determine refund amount
    refund_amount = amount if amount else float(payment.amount)
    
    if refund_amount > float(payment.amount):
        raise HTTPException(status_code=400, detail="Refund amount exceeds payment amount")
    
    # Update payment status
    payment.status = "REFUNDED"
    
    # Update booking status
    booking_result = await db.execute(
        select(Booking).where(Booking.id == payment.booking_id)
    )
    booking = booking_result.scalar_one_or_none()
    if booking:
        booking.status = "CANCELLED"
    
    await db.commit()
    
    return {
        "message": "Refund processed successfully",
        "payment_id": payment_id,
        "refund_amount": refund_amount,
        "currency": payment.currency,
        "status": "REFUNDED"
    }

@router.get("/")
async def list_payments(
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """List all payments (admin endpoint)."""
    result = await db.execute(
        select(Payment).limit(limit).offset(offset)
    )
    payments = result.scalars().all()
    
    return {
        "payments": [
            {
                "id": str(p.id),
                "booking_id": str(p.booking_id),
                "amount": float(p.amount),
                "currency": p.currency,
                "status": p.status
            }
            for p in payments
        ],
        "total": len(payments)
    }
