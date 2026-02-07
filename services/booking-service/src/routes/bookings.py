from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime, timedelta, date
from uuid import uuid4
import httpx
from src.database import get_db
from src.models import Booking, Flight, Passenger
from src.config import settings

router = APIRouter(tags=["bookings"])

# Request/Response Models
class PassengerInfo(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: date
    passport_number: Optional[str] = None
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None

class BookingCreate(BaseModel):
    flight_id: str
    user_id: str
    passengers: List[PassengerInfo]
    class_type: str = "economy"
    add_ons: List[str] = []

class BookingResponse(BaseModel):
    id: str
    flight_id: str
    user_id: str
    status: str
    total_amount: float
    passengers: List[PassengerInfo]
    resource_details: dict
    created_at: datetime
    expires_at: Optional[datetime]

class BookingListResponse(BaseModel):
    bookings: List[dict]
    total: int

@router.post("/", response_model=BookingResponse, status_code=201)
async def create_booking(
    booking_request: BookingCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new booking.
    - Gets flight details
    - Calculates price via pricing service
    - Creates booking with PENDING status
    - Sets 15-minute expiration
    """
    # Get flight details
    flight_result = await db.execute(
        select(Flight).where(Flight.id == booking_request.flight_id)
    )
    flight = flight_result.scalar_one_or_none()
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Calculate price via pricing service
    try:
        async with httpx.AsyncClient() as client:
            pricing_response = await client.post(
                f"{settings.PRICING_SERVICE_URL}/calculate",
                json={
                    "flight_id": booking_request.flight_id,
                    "passengers": len(booking_request.passengers),
                    "class_type": booking_request.class_type,
                    "add_ons": booking_request.add_ons
                },
                timeout=10.0
            )
            pricing_response.raise_for_status()
            pricing_data = pricing_response.json()
            total_amount = pricing_data["breakdown"]["total"]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pricing service error: {str(e)}")
    
    # Create booking
    booking_id = str(uuid4())
    created_at = datetime.utcnow()
    expires_at = created_at + timedelta(minutes=settings.BOOKING_EXPIRATION_MINUTES)
    
    new_booking = Booking(
        id=booking_id,
        user_id=booking_request.user_id,
        resource_type="FLIGHT",
        resource_id=booking_request.flight_id,
        status="PENDING",
        total_amount=total_amount,
        created_at=created_at
    )

    db.add(new_booking)
    await db.commit()

    for passenger_data in booking_request.passengers:
        passenger = Passenger(
            id=str(uuid4()),
            booking_id=booking_id,
            first_name=passenger_data.first_name,
            last_name=passenger_data.last_name,
            title=passenger_data.title,
            date_of_birth=passenger_data.date_of_birth,
            passport_number=passenger_data.passport_number,
            email=passenger_data.email,
            phone=passenger_data.phone
        )
        db.add(passenger)

    await db.commit()
    await db.refresh(new_booking)
    
    # Prepare response with standardized format
    resource_details = {
        "flight_number": flight.flight_number,
        "origin": flight.origin,
        "destination": flight.destination,
        "price": float(flight.base_price),
        "currency": "USD",
        "class_type": booking_request.class_type,
        "departure_time": flight.departure_time.isoformat(),
        "arrival_time": flight.arrival_time.isoformat(),
        "duration_minutes": int((flight.arrival_time - flight.departure_time).total_seconds() / 60),
        "airline": "JourneyIQ Air",
        "aircraft": "Boeing 737-800"
    }
    
    return BookingResponse(
        id=booking_id,
        flight_id=booking_request.flight_id,
        user_id=booking_request.user_id,
        status="PENDING",
        total_amount=total_amount,
        passengers=booking_request.passengers,
        resource_details=resource_details,
        created_at=created_at,
        expires_at=expires_at
    )

@router.get("/{booking_id}")
async def get_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get booking details by ID."""
    result = await db.execute(
        select(Booking).options(selectinload(Booking.passengers)).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Get flight details if it's a flight booking
    resource_details = None
    if booking.resource_type == "FLIGHT":
        flight_result = await db.execute(
            select(Flight).where(Flight.id == booking.resource_id)
        )
        flight = flight_result.scalar_one_or_none()
        if flight:
            resource_details = {
                "flight_number": flight.flight_number,
                "origin": flight.origin,
                "destination": flight.destination,
                "price": float(flight.base_price),
                "currency": "USD",
                "departure_time": flight.departure_time.isoformat() if flight.departure_time else None,
                "arrival_time": flight.arrival_time.isoformat() if flight.arrival_time else None,
                "duration_minutes": int((flight.arrival_time - flight.departure_time).total_seconds() / 60) if flight.arrival_time and flight.departure_time else 0,
                "airline": "JourneyIQ Air",
                "aircraft": "Boeing 737-800"
            }
    
    return {
        "id": str(booking.id),
        "user_id": str(booking.user_id),
        "resource_type": booking.resource_type,
        "resource_id": str(booking.resource_id),
        "status": booking.status,
        "total_amount": float(booking.total_amount) if booking.total_amount else 0,
        "created_at": booking.created_at.isoformat() if booking.created_at else None,
        "resource_details": resource_details,
        "passengers": [
            {
                "first_name": p.first_name,
                "last_name": p.last_name,
                "title": p.title,
                "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
                "passport_number": p.passport_number,
                "email": p.email,
                "phone": p.phone
            }
            for p in booking.passengers
        ] if hasattr(booking, 'passengers') and booking.passengers else []
    }

@router.get("/user/{user_id}", response_model=BookingListResponse)
async def list_user_bookings(
    user_id: str,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """List all bookings for a specific user with details."""
    query = select(Booking).where(Booking.user_id == user_id)
    
    if status:
        query = query.where(Booking.status == status.upper())
    
    result = await db.execute(query)
    bookings = result.scalars().all()
    
    booking_list = []
    for booking in bookings:
        resource_details = None
        if booking.resource_type == "FLIGHT":
            flight_result = await db.execute(
                select(Flight).where(Flight.id == booking.resource_id)
            )
            flight = flight_result.scalar_one_or_none()
            if flight:
                resource_details = {
                    "flight_number": flight.flight_number,
                    "origin": flight.origin,
                    "destination": flight.destination,
                    "price": float(flight.base_price),
                    "currency": "USD",
                    "departure_time": flight.departure_time.isoformat() if flight.departure_time else None,
                    "arrival_time": flight.arrival_time.isoformat() if flight.arrival_time else None,
                    "duration_minutes": int((flight.arrival_time - flight.departure_time).total_seconds() / 60) if flight.arrival_time and flight.departure_time else 0,
                    "airline": "JourneyIQ Air",
                    "aircraft": "Boeing 737-800"
                }

        booking_list.append({
            "id": str(booking.id),
            "resource_type": booking.resource_type,
            "resource_id": str(booking.resource_id),
            "status": booking.status,
            "total_amount": float(booking.total_amount) if booking.total_amount else 0,
            "created_at": booking.created_at.isoformat() if booking.created_at else None,
            "resource_details": resource_details,
            "passengers": [
                {
                    "first_name": p.first_name,
                    "last_name": p.last_name,
                    "title": p.title,
                    "date_of_birth": p.date_of_birth.isoformat() if p.date_of_birth else None,
                    "passport_number": p.passport_number,
                    "email": p.email,
                    "phone": p.phone
                }
                for p in booking.passengers
            ] if hasattr(booking, 'passengers') and booking.passengers else []
        })
    
    return BookingListResponse(
        bookings=booking_list,
        total=len(booking_list)
    )

@router.delete("/{booking_id}")
async def cancel_booking(
    booking_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Cancel a booking."""
    result = await db.execute(
        select(Booking).where(Booking.id == booking_id)
    )
    booking = result.scalar_one_or_none()
    
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking.status == "CANCELLED":
        raise HTTPException(status_code=400, detail="Booking already cancelled")
    
    if booking.status == "CONFIRMED":
        # In production, you'd check if refund is allowed
        pass
    
    booking.status = "CANCELLED"
    await db.commit()
    
    return {
        "message": "Booking cancelled successfully",
        "booking_id": booking_id,
        "status": "CANCELLED"
    }

@router.get("/")
async def list_all_bookings(
    limit: int = 10,
    offset: int = 0,
    db: AsyncSession = Depends(get_db)
):
    """List all bookings (admin endpoint)."""
    result = await db.execute(
        select(Booking).limit(limit).offset(offset)
    )
    bookings = result.scalars().all()
    
    return {
        "bookings": [
            {
                "id": str(b.id),
                "user_id": str(b.user_id),
                "resource_type": b.resource_type,
                "status": b.status,
                "created_at": b.created_at.isoformat() if b.created_at else None
            }
            for b in bookings
        ],
        "total": len(bookings)
    }
