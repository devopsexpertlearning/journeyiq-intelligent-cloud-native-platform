from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from datetime import datetime, date
from typing import Optional, List
from pydantic import BaseModel
from src.database import get_db
from src.models import Flight

router = APIRouter(tags=["search"])

# Request/Response Models
class FlightSearchRequest(BaseModel):
    origin: Optional[str] = None
    destination: Optional[str] = None
    departure_date: Optional[date] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    sort_by: str = "price"  # price, departure_time, duration
    sort_order: str = "asc"  # asc, desc

class FlightResponse(BaseModel):
    id: str
    flight_number: str
    origin: str
    destination: str
    departure_time: datetime
    arrival_time: datetime
    base_price: float
    status: str
    duration_minutes: int
    
    class Config:
        from_attributes = True

class FlightSearchResponse(BaseModel):
    results: List[FlightResponse]
    total_results: int
    page: int
    page_size: int

@router.post("/flights", response_model=FlightSearchResponse)
async def search_flights(
    search: FlightSearchRequest,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Search flights with filters and pagination.
    Uses real data from 50 seeded flights.
    """
    # Build query
    query = select(Flight)
    
    # Apply filters
    filters = []
    if search.origin:
        filters.append(Flight.origin == search.origin.upper())
    if search.destination:
        filters.append(Flight.destination == search.destination.upper())
    if search.departure_date:
        # Filter by date (ignoring time)
        filters.append(
            and_(
                Flight.departure_time >= datetime.combine(search.departure_date, datetime.min.time()),
                Flight.departure_time < datetime.combine(search.departure_date, datetime.max.time())
            )
        )
    if search.min_price is not None:
        filters.append(Flight.base_price >= search.min_price)
    if search.max_price is not None:
        filters.append(Flight.base_price <= search.max_price)
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if search.sort_by == "price":
        sort_column = Flight.base_price
    elif search.sort_by == "departure_time":
        sort_column = Flight.departure_time
    else:
        sort_column = Flight.base_price
    
    if search.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    count_query = select(Flight)
    if filters:
        count_query = count_query.where(and_(*filters))
    count_result = await db.execute(count_query)
    total_results = len(count_result.scalars().all())
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    flights = result.scalars().all()
    
    # Convert to response format
    flight_responses = []
    for flight in flights:
        duration = (flight.arrival_time - flight.departure_time).total_seconds() / 60
        flight_responses.append(
            FlightResponse(
                id=str(flight.id),
                flight_number=flight.flight_number,
                origin=flight.origin,
                destination=flight.destination,
                departure_time=flight.departure_time,
                arrival_time=flight.arrival_time,
                base_price=float(flight.base_price),
                status=flight.status,
                duration_minutes=int(duration)
            )
        )
    
    return FlightSearchResponse(
        results=flight_responses,
        total_results=total_results,
        page=page,
        page_size=page_size
    )

@router.get("/locations", response_model=List[dict])
async def get_locations(
    query: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get list of available airports/locations.
    Returns unique origins and destinations from scheduled flights.
    Enriched with static city/country data for MVP.
    """
    # 1. Get unique codes from DB
    stmt_origin = select(Flight.origin).distinct()
    stmt_dest = select(Flight.destination).distinct()
    
    result_origin = await db.execute(stmt_origin)
    result_dest = await db.execute(stmt_dest)
    
    origins = {r for r in result_origin.scalars().all()}
    destinations = {r for r in result_dest.scalars().all()}
    all_codes = origins.union(destinations)
    
    # 2. Static Data Map (simulating a proper Airports table)
    # This ensures we show "New York (JFK)" instead of just "JFK"
    AIRPORT_DATA = {
        "JFK": {"city": "New York", "country": "USA", "name": "John F. Kennedy International Airport"},
        "LHR": {"city": "London", "country": "UK", "name": "Heathrow Airport"},
        "DXB": {"city": "Dubai", "country": "UAE", "name": "Dubai International Airport"},
        "HND": {"city": "Tokyo", "country": "Japan", "name": "Haneda Airport"},
        "SFO": {"city": "San Francisco", "country": "USA", "name": "San Francisco International Airport"},
        "SIN": {"city": "Singapore", "country": "Singapore", "name": "Changi Airport"},
        "CDG": {"city": "Paris", "country": "France", "name": "Charles de Gaulle Airport"},
        "LAX": {"city": "Los Angeles", "country": "USA", "name": "Los Angeles International Airport"},
        "SYD": {"city": "Sydney", "country": "Australia", "name": "Kingsford Smith Airport"},
        "AMS": {"city": "Amsterdam", "country": "Netherlands", "name": "Schiphol Airport"},
        "FRA": {"city": "Frankfurt", "country": "Germany", "name": "Frankfurt Airport"},
        "MIA": {"city": "Miami", "country": "USA", "name": "Miami International Airport"},
        "ZRH": {"city": "Zurich", "country": "Switzerland", "name": "Zurich Airport"},
        "MUC": {"city": "Munich", "country": "Germany", "name": "Munich Airport"},
        "BOS": {"city": "Boston", "country": "USA", "name": "Logan International Airport"},
        "IST": {"city": "Istanbul", "country": "Turkey", "name": "Istanbul Airport"},
        "ORD": {"city": "Chicago", "country": "USA", "name": "O'Hare International Airport"},
        "YYZ": {"city": "Toronto", "country": "Canada", "name": "Pearson International Airport"},
        "YVR": {"city": "Vancouver", "country": "Canada", "name": "Vancouver International Airport"},
        "HKG": {"city": "Hong Kong", "country": "China", "name": "Hong Kong International Airport"},
        "PEK": {"city": "Beijing", "country": "China", "name": "Capital International Airport"},
        "DEL": {"city": "New Delhi", "country": "India", "name": "Indira Gandhi International Airport"},
        "BOM": {"city": "Mumbai", "country": "India", "name": "Chhatrapati Shivaji Maharaj International Airport"},
        "GRU": {"city": "Sao Paulo", "country": "Brazil", "name": "Guarulhos International Airport"},
        "EZE": {"city": "Buenos Aires", "country": "Argentina", "name": "Ezeiza International Airport"},
        "CAI": {"city": "Cairo", "country": "Egypt", "name": "Cairo International Airport"},
        "JNB": {"city": "Johannesburg", "country": "South Africa", "name": "O.R. Tambo International Airport"},
        "CPT": {"city": "Cape Town", "country": "South Africa", "name": "Cape Town International Airport"},
        "AKL": {"city": "Auckland", "country": "New Zealand", "name": "Auckland Airport"},
        "MEL": {"city": "Melbourne", "country": "Australia", "name": "Melbourne Airport"}
    }
    
    results = []
    for code in all_codes:
        data = AIRPORT_DATA.get(code, {"city": "Unknown", "country": "", "name": code})
        
        # Simple search filter if query is present
        if query:
            q = query.lower()
            if (q not in code.lower() and 
                q not in data["city"].lower() and 
                q not in data["name"].lower()):
                continue
                
        results.append({
            "code": code,
            "city": data["city"],
            "country": data["country"],
            "name": data["name"],
            "display_name": f"{data['city']} ({code})"
        })
    
    return sorted(results, key=lambda x: x["city"])


@router.get("/flights/{flight_id}", response_model=FlightResponse)
async def get_flight_details(
    flight_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific flight."""
    result = await db.execute(
        select(Flight).where(Flight.id == flight_id)
    )
    flight = result.scalar_one_or_none()
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    duration = (flight.arrival_time - flight.departure_time).total_seconds() / 60
    
    return FlightResponse(
        id=str(flight.id),
        flight_number=flight.flight_number,
        origin=flight.origin,
        destination=flight.destination,
        departure_time=flight.departure_time,
        arrival_time=flight.arrival_time,
        base_price=float(flight.base_price),
        status=flight.status,
        duration_minutes=int(duration)
    )
