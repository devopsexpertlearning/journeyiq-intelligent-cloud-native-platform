from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List, Optional
from pydantic import BaseModel
from decimal import Decimal
from src.database import get_db
from src.models import Flight
from src.config import settings

router = APIRouter(tags=["pricing"])

# Request/Response Models
class PricingRequest(BaseModel):
    flight_id: str
    passengers: int = 1
    class_type: str = "economy"  # economy, premium, business, first
    add_ons: List[str] = []  # baggage, seat_selection, priority_boarding, meal, wifi

class PriceBreakdown(BaseModel):
    base_price: float
    class_multiplier: float
    subtotal: float
    taxes: float
    fees: float
    add_ons_total: float
    total: float
    per_passenger: float

class PricingResponse(BaseModel):
    flight_id: str
    passengers: int
    class_type: str
    currency: str = "USD"
    breakdown: PriceBreakdown
    add_ons_detail: dict

@router.post("/calculate", response_model=PricingResponse)
async def calculate_pricing(
    request: PricingRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Calculate total price for a flight booking.
    Includes base price, class multiplier, taxes, fees, and add-ons.
    """
    # Get flight from database
    result = await db.execute(
        select(Flight).where(Flight.id == request.flight_id)
    )
    flight = result.scalar_one_or_none()
    
    if not flight:
        raise HTTPException(status_code=404, detail="Flight not found")
    
    # Base price from database
    base_price = float(flight.base_price)
    
    # Apply class multiplier
    class_multiplier = settings.CLASS_MULTIPLIERS.get(request.class_type.lower(), 1.0)
    subtotal = base_price * class_multiplier * request.passengers
    
    # Calculate taxes (15%)
    taxes = subtotal * settings.TAX_RATE
    
    # Calculate fees
    fees = settings.BASE_FEE_PER_PASSENGER * request.passengers
    
    # Calculate add-ons
    add_ons_detail = {}
    add_ons_total = 0.0
    for addon in request.add_ons:
        addon_price = settings.ADDON_PRICES.get(addon.lower(), 0.0)
        if addon_price > 0:
            addon_total = addon_price * request.passengers
            add_ons_detail[addon] = {
                "price_per_passenger": addon_price,
                "total": addon_total
            }
            add_ons_total += addon_total
    
    # Calculate total
    total = subtotal + taxes + fees + add_ons_total
    per_passenger = total / request.passengers
    
    breakdown = PriceBreakdown(
        base_price=round(base_price, 2),
        class_multiplier=class_multiplier,
        subtotal=round(subtotal, 2),
        taxes=round(taxes, 2),
        fees=round(fees, 2),
        add_ons_total=round(add_ons_total, 2),
        total=round(total, 2),
        per_passenger=round(per_passenger, 2)
    )
    
    return PricingResponse(
        flight_id=request.flight_id,
        passengers=request.passengers,
        class_type=request.class_type,
        currency="USD",
        breakdown=breakdown,
        add_ons_detail=add_ons_detail
    )

@router.get("/add-ons")
async def get_available_addons():
    """Get list of available add-ons and their prices."""
    return {
        "add_ons": [
            {"name": name, "price": price, "currency": "USD"}
            for name, price in settings.ADDON_PRICES.items()
        ]
    }

@router.get("/class-types")
async def get_class_types():
    """Get available class types and their multipliers."""
    return {
        "class_types": [
            {"name": name, "multiplier": multiplier}
            for name, multiplier in settings.CLASS_MULTIPLIERS.items()
        ]
    }
