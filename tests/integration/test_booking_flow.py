"""
Integration tests for end-to-end booking flow
"""
import pytest
import asyncio
from httpx import AsyncClient


@pytest.mark.integration
@pytest.mark.asyncio
class TestBookingFlowIntegration:
    """Test complete booking flow across multiple services"""
    
    async def test_complete_booking_flow(self):
        """Test end-to-end booking from search to confirmation"""
        base_url = "http://127.0.0.1"
        
        async with AsyncClient(timeout=30.0) as client:
            # Step 1: Search for flights
            search_response = await client.get(
                f"{base_url}:8003/search/flights",
                params={"origin": "JFK", "destination": "LHR"}
            )
            assert search_response.status_code == 200
            flights = search_response.json()["flights"]
            assert len(flights) > 0
            flight_id = flights[0]["id"]
            
            # Step 2: Get user profile
            user_id = "10000000-0000-0000-0000-000000000001"
            user_response = await client.get(f"{base_url}:8002/users/{user_id}")
            assert user_response.status_code == 200
            user = user_response.json()
            assert user["email"] == "alice.voyager@journeyiq.com"
            
            # Step 3: Create booking
            booking_response = await client.post(
                f"{base_url}:8006/bookings",
                json={
                    "user_id": user_id,
                    "resource_type": "FLIGHT",
                    "resource_id": flight_id,
                    "passengers": [{"name": "Alice Voyager", "seat": "10A"}]
                }
            )
            assert booking_response.status_code == 201
            booking = booking_response.json()
            booking_id = booking["booking_id"]
            assert booking["status"] == "PENDING"
            
            # Step 4: Process payment
            payment_response = await client.post(
                f"{base_url}:8007/payments",
                json={
                    "booking_id": booking_id,
                    "amount": booking["amount"],
                    "currency": "USD",
                    "payment_method": {
                        "type": "CARD",
                        "card_number": "4111111111111111",
                        "expiry": "12/25",
                        "cvv": "123"
                    }
                }
            )
            assert payment_response.status_code == 200
            payment = payment_response.json()
            assert payment["status"] == "SUCCEEDED"
            
            # Step 5: Verify booking confirmed
            verify_response = await client.get(f"{base_url}:8006/bookings/{booking_id}")
            assert verify_response.status_code == 200
            final_booking = verify_response.json()
            assert final_booking["status"] == "CONFIRMED"


@pytest.mark.integration
@pytest.mark.asyncio
class TestAIAgentRAGIntegration:
    """Test AI agent with RAG retrieval"""
    
    async def test_ai_agent_retrieves_policy(self):
        """Test AI agent retrieves and uses RAG documents"""
        base_url = "http://127.0.0.1"
        
        async with AsyncClient(timeout=30.0) as client:
            # Query AI agent
            response = await client.post(
                f"{base_url}:8012/agent/chat",
                json={
                    "message": "What is the flight cancellation policy?",
                    "user_id": "10000000-0000-0000-0000-000000000001"
                }
            )
            
            assert response.status_code == 200
            data = response.json()
            assert "response" in data
            
            # Verify response contains policy information
            response_text = data["response"].lower()
            assert any(keyword in response_text for keyword in [
                "cancellation", "refund", "24 hours", "flexi-fare"
            ])


@pytest.mark.integration
@pytest.mark.asyncio
class TestEventDrivenFlow:
    """Test event publishing and consumption"""
    
    async def test_booking_event_triggers_notification(self):
        """Test booking.created event triggers notification"""
        # This would require actual Pub/Sub setup
        # Placeholder for integration test
        pass
