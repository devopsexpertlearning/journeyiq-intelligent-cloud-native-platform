
from fastapi import APIRouter, Query, HTTPException
from typing import List, Optional
import random
from uuid import uuid4
from pydantic import BaseModel

router = APIRouter()

class Flight(BaseModel):
    id: str
    airline: str
    flight_number: str
    origin: str
    destination: str
    departure_time: str
    arrival_time: str
    price: float

@router.get("/search/flights", response_model=dict)
async def search_flights(
    origin: str = Query(..., min_length=3, max_length=3),
    destination: str = Query(..., min_length=3, max_length=3),
    date: Optional[str] = None
):
    """
    Mock search for flights
    """
    # Mock data generation
    airlines = ["Delta", "United", "British Airways", "Lufthansa", "Emirates"]
    
    flights = []
    for _ in range(random.randint(2, 5)):
        airline = random.choice(airlines)
        flights.append(Flight(
            id=str(uuid4()),
            airline=airline,
            flight_number=f"{airline[:2].upper()}{random.randint(100, 999)}",
            origin=origin.upper(),
            destination=destination.upper(),
            departure_time="2024-06-01T10:00:00Z",
            arrival_time="2024-06-01T18:00:00Z",
            price=random.uniform(300, 1200)
        ))
        
    return {"flights": flights}
