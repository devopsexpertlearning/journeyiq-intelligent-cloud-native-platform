from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, func
from typing import Optional, List, Union
from pydantic import BaseModel
from decimal import Decimal
from src.database import get_db
from src.models import Hotel

router = APIRouter(tags=["search"])

# Request/Response Models
class HotelSearchRequest(BaseModel):
    location: Optional[str] = None
    min_rating: Optional[float] = None
    amenities: Optional[List[str]] = None
    sort_by: str = "rating"  # rating, name
    sort_order: str = "desc"  # asc, desc

class HotelResponse(BaseModel):
    id: str
    name: str
    location: str
    rating: Optional[float]
    amenities: Optional[Union[List[str], dict]]  # Can be list or dict
    
    class Config:
        from_attributes = True

class HotelSearchResponse(BaseModel):
    results: List[HotelResponse]
    total_results: int
    page: int
    page_size: int

@router.post("/hotels", response_model=HotelSearchResponse)
async def search_hotels(
    search: HotelSearchRequest,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """
    Search hotels with filters and pagination.
    Uses real data from 20 seeded hotels.
    """
    # Build query
    query = select(Hotel)
    
    # Apply filters
    filters = []
    if search.location:
        # Case-insensitive partial match
        filters.append(Hotel.location.ilike(f"%{search.location}%"))
    if search.min_rating is not None:
        filters.append(Hotel.rating >= search.min_rating)
    
    # Amenities filter (JSONB contains)
    if search.amenities:
        for amenity in search.amenities:
            # Check if amenity exists in JSONB array
            filters.append(
                Hotel.amenities.op('@>')(f'["{amenity}"]')
            )
    
    if filters:
        query = query.where(and_(*filters))
    
    # Apply sorting
    if search.sort_by == "rating":
        sort_column = Hotel.rating
    elif search.sort_by == "name":
        sort_column = Hotel.name
    else:
        sort_column = Hotel.rating
    
    if search.sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())
    
    # Get total count
    count_query = select(func.count()).select_from(Hotel)
    if filters:
        count_query = count_query.where(and_(*filters))
    count_result = await db.execute(count_query)
    total_results = count_result.scalar()
    
    # Apply pagination
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)
    
    # Execute query
    result = await db.execute(query)
    hotels = result.scalars().all()
    
    # Convert to response format
    hotel_responses = []
    for hotel in hotels:
        hotel_responses.append(
            HotelResponse(
                id=str(hotel.id),
                name=hotel.name,
                location=hotel.location,
                rating=float(hotel.rating) if hotel.rating else None,
                amenities=hotel.amenities
            )
        )
    
    return HotelSearchResponse(
        results=hotel_responses,
        total_results=total_results,
        page=page,
        page_size=page_size
    )

@router.get("/hotels/{hotel_id}", response_model=HotelResponse)
async def get_hotel_details(
    hotel_id: str,
    db: AsyncSession = Depends(get_db)
):
    """Get detailed information about a specific hotel."""
    result = await db.execute(
        select(Hotel).where(Hotel.id == hotel_id)
    )
    hotel = result.scalar_one_or_none()
    
    if not hotel:
        raise HTTPException(status_code=404, detail="Hotel not found")
    
    return HotelResponse(
        id=str(hotel.id),
        name=hotel.name,
        location=hotel.location,
        rating=float(hotel.rating) if hotel.rating else None,
        amenities=hotel.amenities
    )
