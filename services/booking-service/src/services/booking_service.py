"""
Business logic for booking operations.

This module contains all booking-related business rules and logic.
Business logic is separated from API routes to maintain clean architecture.
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import uuid4
import httpx
import logging

logger = logging.getLogger(__name__)


class BookingService:
    """
    Business logic service for booking operations.
    
    This encapsulates all booking-related business rules:
    - Booking creation rules
    - Status transitions
    - Expiration handling
    - Validation logic
    - Event publishing
    
    Usage:
        service = BookingService(db_session)
        booking = await service.create_booking(...)
    """
    
    def __init__(self, db: AsyncSession, pricing_service_url: str = None, inventory_service_url: str = None):
        """
        Initialize booking service.
        
        Args:
            db: Database session
            pricing_service_url: URL for pricing service (optional, from config)
            inventory_service_url: URL for inventory service (optional, from config)
        """
        self.db = db
        self.pricing_service_url = pricing_service_url or "http://pricing-service:8000"
        self.inventory_service_url = inventory_service_url or "http://inventory-service:8000"
    
    async def create_booking(
        self,
        flight_id: str,
        user_id: str,
        passengers: List[Dict],
        class_type: str = "economy",
        add_ons: List[str] = None,
        booking_expiration_minutes: int = 15
    ) -> Dict:
        """
        Create a new booking with business rules applied.
        
        Business Rules:
        1. Flight must exist and be available
        2. Check seat availability
        3. Price calculated via pricing service
        4. Booking expires in N minutes if unpaid
        5. Event published for downstream services
        """
        # Business Rule 1: Validate flight exists
        flight = await self._get_flight(flight_id)
        if not flight:
            raise ValueError("Flight not found")
        
        # Business Rule 2: Check availability
        if not await self._check_availability(flight_id, len(passengers), class_type):
            raise ValueError("Insufficient seats available")
        
        # Business Rule 3: Calculate price via pricing service
        try:
            total_amount = await self._calculate_price(
                flight_id=flight_id,
                passenger_count=len(passengers),
                class_type=class_type,
                add_ons=add_ons or []
            )
        except Exception as e:
            logger.error(f"Price calculation failed: {e}")
            raise ValueError(f"Price calculation failed: {str(e)}")
        
        # Business Rule 4: Create booking with expiration
        booking_id = str(uuid4())
        created_at = datetime.utcnow()
        expires_at = created_at + timedelta(minutes=booking_expiration_minutes)
        
        # Import here to avoid circular imports
        from src.models import Booking
        
        booking = Booking(
            id=booking_id,
            user_id=user_id,
            resource_type="FLIGHT",
            resource_id=flight_id,
            status="PENDING",
            created_at=created_at
        )
        
        self.db.add(booking)
        await self.db.commit()
        await self.db.refresh(booking)
        
        # Business Rule 5: Publish event for downstream services
        try:
            from src.events import publish_booking_created
            await publish_booking_created(
                booking_id=booking_id,
                user_id=user_id,
                amount=total_amount
            )
        except Exception as e:
            logger.warning(f"Failed to publish booking event: {e}")
            # Don't fail booking creation if event publishing fails
        
        # Prepare response
        flight_details = {
            "flight_number": getattr(flight, 'flight_number', 'N/A'),
            "origin": getattr(flight, 'origin', 'N/A'),
            "destination": getattr(flight, 'destination', 'N/A'),
            "departure_time": flight.departure_time.isoformat() if hasattr(flight, 'departure_time') and flight.departure_time else None,
            "arrival_time": flight.arrival_time.isoformat() if hasattr(flight, 'arrival_time') and flight.arrival_time else None,
            "base_price": float(flight.base_price) if hasattr(flight, 'base_price') else 0.0
        }
        
        return {
            "id": booking_id,
            "flight_id": flight_id,
            "user_id": user_id,
            "status": "PENDING",
            "total_amount": total_amount,
            "passengers": passengers,
            "flight_details": flight_details,
            "created_at": created_at.isoformat(),
            "expires_at": expires_at.isoformat()
        }
    
    async def confirm_booking(self, booking_id: str) -> Dict:
        """Confirm a booking after payment."""
        from src.models import Booking
        
        booking = await self._get_booking(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        
        if booking.status != "PENDING":
            raise ValueError(f"Cannot confirm booking with status {booking.status}")
        
        booking.status = "CONFIRMED"
        await self.db.commit()
        await self.db.refresh(booking)
        
        return {"id": str(booking.id), "status": booking.status}
    
    async def cancel_booking(self, booking_id: str, reason: str = None) -> Dict:
        """Cancel a booking."""
        from src.models import Booking
        
        booking = await self._get_booking(booking_id)
        if not booking:
            raise ValueError("Booking not found")
        
        if booking.status == "CANCELLED":
            raise ValueError("Booking already cancelled")
        
        booking.status = "CANCELLED"
        await self.db.commit()
        await self.db.refresh(booking)
        
        return {"id": str(booking.id), "status": booking.status}
    
    # Private helper methods
    async def _get_flight(self, flight_id: str) -> Optional[object]:
        """Get flight by ID from database."""
        from src.models import Flight
        result = await self.db.execute(select(Flight).where(Flight.id == flight_id))
        return result.scalar_one_or_none()
    
    async def _get_booking(self, booking_id: str) -> Optional[object]:
        """Get booking by ID from database."""
        from src.models import Booking
        result = await self.db.execute(select(Booking).where(Booking.id == booking_id))
        return result.scalar_one_or_none()
    
    async def _check_availability(self, flight_id: str, passenger_count: int, class_type: str) -> bool:
        """Check if enough seats are available."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.inventory_service_url}/availability",
                    params={"flight_id": flight_id, "class_type": class_type, "seats_needed": passenger_count},
                    timeout=5.0
                )
                if response.status_code == 200:
                    return response.json().get("available", False)
        except Exception as e:
            logger.warning(f"Availability check failed: {e}, assuming available")
        return True
    
    async def _calculate_price(self, flight_id: str, passenger_count: int, class_type: str, add_ons: List[str]) -> float:
        """Calculate booking price via pricing service."""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.pricing_service_url}/calculate",
                    json={"flight_id": flight_id, "passengers": passenger_count, "class_type": class_type, "add_ons": add_ons},
                    timeout=10.0
                )
                response.raise_for_status()
                return response.json()["breakdown"]["total"]
        except Exception as e:
            logger.error(f"Pricing service error: {e}")
            raise ValueError(f"Price calculation failed: {str(e)}")
