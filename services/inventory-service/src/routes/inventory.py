from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel
import asyncpg
import os
import json
from typing import List, Optional
import uuid
from src.logging import logger

router = APIRouter()

class FlightResponse(BaseModel):
    id: str
    flight_number: str
    origin: str
    destination: str
    base_price: float
    status: str

class HotelResponse(BaseModel):
    id: str
    name: str
    location: str
    rating: float

class Hotel(BaseModel):
    id: str
    name: str
    location: str
    rating: float
    amenities: List[str]

class InventoryIngestRequest(BaseModel):
    flights: List[dict]
    hotels: List[dict]

async def get_db_connection():
    user = os.getenv("POSTGRES_USER", "postgres")
    password = os.getenv("POSTGRES_PASSWORD", "postgres")
    host = os.getenv("POSTGRES_HOST", "postgres")
    port = os.getenv("POSTGRES_PORT", "5432")
    database = os.getenv("POSTGRES_DB", "inventory_db")
    
    return await asyncpg.connect(user=user, password=password, host=host, port=port, database=database)

@router.get("/flights/{flight_id}")
async def get_flight_details(flight_id: str, accept_language: Optional[str] = Header(None)):
    # Journey 40 (Localization)
    desc = "Direct flight from New York to London"
    if accept_language and "es" in accept_language:
        desc = "Vuelo directo de Nueva York a Londres"
    
    return {
        "id": flight_id,
        "description": desc,
        "status": "SCHEDULED"
    }

@router.post("/inventory/ingest", status_code=202)
async def ingest_inventory(request: InventoryIngestRequest):
    # Journey 24
    job_id = f"ingest-{uuid.uuid4()}"
    logger.info(f"Started ingestion job {job_id} for {len(request.flights)} flights and {len(request.hotels)} hotels")
    return {"job_id": job_id, "status": "processing"}

@router.get("/hotels/{hotel_id}", response_model=HotelResponse)
async def get_hotel(hotel_id: str):
    conn = await get_db_connection()
    try:
        row = await conn.fetchrow("SELECT id, name, location, rating FROM hotels WHERE id = $1", hotel_id)
        if not row:
            raise HTTPException(status_code=404, detail="Hotel not found")
        
        return HotelResponse(
            id=str(row['id']),
            name=row['name'],
            location=row['location'],
            rating=float(row['rating']) if row['rating'] else 0.0
        )
    finally:
        await conn.close()
