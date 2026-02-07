from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from typing import List
from pydantic import BaseModel
from src.database import get_db
from src.models import Flight, Seat, Hotel, Room

router = APIRouter(tags=["inventory"])

# Response Models
class SeatInfo(BaseModel):
    id: str
    seat_number: str
    class_type: str
    is_available: bool

class FlightInventoryResponse(BaseModel):
    flight_id: str
    flight_number: str
    total_seats: int
    available_seats: int
    seats_by_class: dict
    seats: List[SeatInfo]

class RoomInfo(BaseModel):
    id: str
    room_number: str
    type: str
    price_night: float
    is_available: bool

class HotelInventoryResponse(BaseModel):
    hotel_id: str
    hotel_name: str
    total_rooms: int
    available_rooms: int
    rooms_by_type: dict
    rooms: List[RoomInfo]

@router.get("/flights/{flight_id}/seats", response_model=FlightInventoryResponse)
async def get_flight_seats(
    flight_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get seat availability for a specific flight.
    Returns all seats with availability status.
    """
    # Get flight info
    flight_result = await db.execute(
        select(Flight).where(Flight.id == flight_id)
    )
    flight = flight_result.scalar_one_or_none()
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Get all seats for this flight
    seats_result = await db.execute(
        select(Seat).where(Seat.flight_id == flight_id)
    )
    seats = seats_result.scalars().all()
    
    # Count available seats
    available_seats = sum(1 for seat in seats if seat.is_available)
    
    # Group by class
    seats_by_class = {}
    for seat in seats:
        class_type = seat.class_type
        if class_type not in seats_by_class:
            seats_by_class[class_type] = {"total": 0, "available": 0}
        seats_by_class[class_type]["total"] += 1
        if seat.is_available:
            seats_by_class[class_type]["available"] += 1
    
    # Convert to response format
    seat_infos = [
        SeatInfo(
            id=str(seat.id),
            seat_number=seat.seat_number,
            class_type=seat.class_type,
            is_available=seat.is_available
        )
        for seat in seats
    ]
    
    return FlightInventoryResponse(
        flight_id=str(flight.id),
        flight_number=flight.flight_number,
        total_seats=len(seats),
        available_seats=available_seats,
        seats_by_class=seats_by_class,
        seats=seat_infos
    )

@router.get("/hotels/{hotel_id}/rooms", response_model=HotelInventoryResponse)
async def get_hotel_rooms(
    hotel_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get room availability for a specific hotel.
    Returns all rooms with availability status.
    """
    # Get hotel info
    hotel_result = await db.execute(
        select(Hotel).where(Hotel.id == hotel_id)
    )
    hotel = hotel_result.scalar_one_or_none()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    # Get all rooms for this hotel
    rooms_result = await db.execute(
        select(Room).where(Room.hotel_id == hotel_id)
    )
    rooms = rooms_result.scalars().all()
    
    # Count available rooms
    available_rooms = sum(1 for room in rooms if room.is_available)
    
    # Group by type
    rooms_by_type = {}
    for room in rooms:
        room_type = room.type
        if room_type not in rooms_by_type:
            rooms_by_type[room_type] = {"total": 0, "available": 0}
        rooms_by_type[room_type]["total"] += 1
        if room.is_available:
            rooms_by_type[room_type]["available"] += 1
    
    # Convert to response format
    room_infos = [
        RoomInfo(
            id=str(room.id),
            room_number=room.room_number,
            type=room.type,
            price_night=float(room.price_night),
            is_available=room.is_available
        )
        for room in rooms
    ]
    
    return HotelInventoryResponse(
        hotel_id=str(hotel.id),
        hotel_name=hotel.name,
        total_rooms=len(rooms),
        available_rooms=available_rooms,
        rooms_by_type=rooms_by_type,
        rooms=room_infos
    )

@router.get("/availability/summary")
async def get_availability_summary(db: AsyncSession = Depends(get_db)):
    """Get overall availability summary for flights and hotels."""
    # Count total and available seats
    seats_result = await db.execute(select(Seat))
    all_seats = seats_result.scalars().all()
    total_seats = len(all_seats)
    available_seats_count = sum(1 for seat in all_seats if seat.is_available)
    
    # Count total and available rooms
    rooms_result = await db.execute(select(Room))
    all_rooms = rooms_result.scalars().all()
    total_rooms = len(all_rooms)
    available_rooms_count = sum(1 for room in all_rooms if room.is_available)
    
    return {
        "flights": {
            "total_seats": total_seats,
            "available_seats": available_seats_count,
            "occupancy_rate": round((1 - available_seats_count / total_seats) * 100, 2) if total_seats > 0 else 0
        },
        "hotels": {
            "total_rooms": total_rooms,
            "available_rooms": available_rooms_count,
            "occupancy_rate": round((1 - available_rooms_count / total_rooms) * 100, 2) if total_rooms > 0 else 0
        }
    }
