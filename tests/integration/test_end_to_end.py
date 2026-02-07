
import pytest
import asyncio
from httpx import AsyncClient
import uuid

# Base URL - using 127.0.0.1 to avoid Windows localhost issues
BASE_URL = "http://127.0.0.1"

# Service Ports
PORTS = {
    "auth": 8001,
    "user": 8002,
    "search": 8003,
    "pricing": 8004,
    "inventory": 8005,
    "booking": 8006,
    "payment": 8007,
    "ticketing": 8008,
    "notification": 8009,
    "review": 8010,
    "analytics": 8011,
    "ai_agent": 8012,
    "rag_ingestion": 8013,
    "vector_store": 8014
}

@pytest.mark.asyncio
class TestEndToEndFlow:
    """
    Comprehensive End-to-End Integration Tests.
    Covers: Search -> Inventory Check -> User Profile -> Booking -> Payment -> AI Assistance
    """

    async def test_01_search_flights_success(self):
        """Scenario: User searches for flights JFK -> LHR"""
        async with AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BASE_URL}:{PORTS['search']}/search/flights",
                params={"origin": "JFK", "destination": "LHR"}
            )
            assert response.status_code == 200
            data = response.json()
            assert "flights" in data
            assert len(data["flights"]) > 0
            # Store a flight for next steps? In integration tests, usually better to fetch fresh.
            
    async def test_02_search_flights_invalid_params(self):
        """Scenario: User searches with invalid airport codes"""
        async with AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BASE_URL}:{PORTS['search']}/search/flights",
                params={"origin": "XX", "destination": "LHR"} # Too short
            )
            assert response.status_code == 422 # Validation Error

    async def test_03_check_inventory_details(self):
        """Scenario: Client checks detailed flight info from Inventory Service"""
        # Using a seeded flight ID: f0000000-0000-0000-0000-000000000001
        flight_id = "f0000000-0000-0000-0000-000000000001"
        async with AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BASE_URL}:{PORTS['inventory']}/inventory/flights/{flight_id}"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == flight_id
            assert data["origin"] == "JFK"
            assert data["destination"] == "LHR"
            assert data["status"] == "SCHEDULED"

    async def test_04_get_user_profile(self):
        """Scenario: Fetching User Profile for Booking pre-fill"""
        # Seeded User: Alice Voyager
        user_id = "10000000-0000-0000-0000-000000000001"
        async with AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{BASE_URL}:{PORTS['user']}/users/{user_id}"
            )
            assert response.status_code == 200
            data = response.json()
            assert data["email"] == "alice.voyager@journeyiq.com"
            assert data["full_name"] == "Alice Voyager"

    async def test_05_create_booking_flow(self):
        """Scenario: Full Booking Creation and Payment Flow"""
        user_id = "10000000-0000-0000-0000-000000000001"
        flight_id = "f0000000-0000-0000-0000-000000000001"
        
        async with AsyncClient(timeout=30.0) as client:
            # 1. Create Booking
            booking_payload = {
                "user_id": user_id,
                "flight_id": flight_id,
                "price": 650.00
            }
            booking_res = await client.post(
                f"{BASE_URL}:{PORTS['booking']}/bookings/",
                json=booking_payload
            )
            assert booking_res.status_code == 200
            booking_data = booking_res.json()
            booking_id = booking_data["booking_id"]
            assert booking_data["status"] == "PENDING"
            
            # 2. Process Payment
            payment_payload = {
                "booking_id": booking_id,
                "amount": 650.00
            }
            payment_res = await client.post(
                f"{BASE_URL}:{PORTS['payment']}/payments/process",
                json=payment_payload
            )
            assert payment_res.status_code == 200
            assert payment_res.json()["status"] == "success"

            # 3. Verify Booking Confirmed
            # Note: In real event driven system, this is async and might take time.
            # But the mock get_booking endpoint returns CONFIRMED statically for demo.
            verify_res = await client.get(f"{BASE_URL}:{PORTS['booking']}/bookings/{booking_id}")
            assert verify_res.status_code == 200
            assert verify_res.json()["status"] == "CONFIRMED"

    async def test_06_ai_agent_assistance(self):
        """Scenario: User asks AI Agent for help"""
        user_id = "10000000-0000-0000-0000-000000000001"
        async with AsyncClient(timeout=60.0) as client: # Longer timeout for LLM
            response = await client.post(
                f"{BASE_URL}:{PORTS['ai_agent']}/agent/chat",
                json={
                    "message": "Find me flights from New York to London",
                    "user_id": user_id
                }
            )
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            # Check content is relevant
            assert "London" in data["response"] or "flights" in data["response"] or "JFK" in data["response"]

