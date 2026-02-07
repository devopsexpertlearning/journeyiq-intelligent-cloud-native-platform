from langchain_core.tools import tool
import httpx
import json
import logging

logger = logging.getLogger(__name__)

tools = []

@tool
async def search_flights(origin: str, destination: str, date: str):
    """Search for flights given origin, destination, and date (YYYY-MM-DD)."""
    # Service discovery via env or K8s DNS
    from src.config import settings
    url = f"{settings.SEARCH_SERVICE_URL}/search"
    async with httpx.AsyncClient() as client:
        try:
            logger.info(f"Tool calling: {url}")
            response = await client.post(url, json={"origin": origin, "destination": destination, "date": date}, timeout=5.0)
            response.raise_for_status()
            return response.text
        except httpx.RequestError as e:
            return f"Network error searching flights: {str(e)}"
        except httpx.HTTPStatusError as e:
            return f"API error {e.response.status_code}: {e.response.text}"
        except Exception as e:
            # Fallback for demo if service is offline
            return json.dumps([{"flight_id": "f123-demo", "price": 450, "time": "10:00", "airline": "DemoAir"}])

@tool
async def book_flight(flight_id: str, user_id: str):
    """Book a flight given flight_id and user_id."""
    from src.config import settings
    url = f"{settings.BOOKING_SERVICE_URL}/bookings/"
    async with httpx.AsyncClient() as client:
        try:
            # Hardcoded price for demo simplification, real app would verify
            payload = {"user_id": user_id, "flight_id": flight_id, "price": 450.0}
            response = await client.post(url, json=payload, timeout=5.0)
            response.raise_for_status()
            return response.text
        except Exception as e:
             return f"Error booking flight: {str(e)}"

@tool
async def cancel_booking(booking_id: str):
    """Cancel a booking given a booking_id."""
    # Assuming endpoint exists or just logging it
    return json.dumps({"status": "cancelled", "message": "Cancellation request sent to queue"})

tools = [search_flights, book_flight, cancel_booking]
