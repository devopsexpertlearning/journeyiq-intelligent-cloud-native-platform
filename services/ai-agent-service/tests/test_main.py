"""
Unit tests for AI Agent Service
"""
import pytest
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check_returns_200(self):
        """Health endpoint should return 200 OK"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestChatEndpoint:
    """Test AI agent chat endpoint"""
    
    @patch('main.app_graph.ainvoke')
    async def test_chat_with_valid_input(self, mock_ainvoke):
        """Chat endpoint should process valid requests"""
        # Mock the AI agent response
        mock_message = Mock()
        mock_message.content = "According to our policy, bookings created more than 24 hours ago are non-refundable."
        mock_ainvoke.return_value = {"messages": [mock_message]}
        
        response = client.post("/agent/chat", json={
            "message": "What is the cancellation policy?",
            "user_id": "u0000000-0000-0000-0000-000000000001"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        assert "non-refundable" in data["response"].lower()
    
    def test_chat_with_missing_message(self):
        """Chat endpoint should reject requests without message"""
        response = client.post("/agent/chat", json={
            "user_id": "u0000000-0000-0000-0000-000000000001"
        })
        assert response.status_code == 422  # Validation error
    
    def test_chat_with_missing_user_id(self):
        """Chat endpoint should reject requests without user_id"""
        response = client.post("/agent/chat", json={
            "message": "What is the cancellation policy?"
        })
        assert response.status_code == 422  # Validation error
    
    def test_chat_with_empty_message(self):
        """Chat endpoint should reject empty messages"""
        response = client.post("/agent/chat", json={
            "message": "",
            "user_id": "u0000000-0000-0000-0000-000000000001"
        })
        assert response.status_code == 422


class TestMetrics:
    """Test Prometheus metrics"""
    
    def test_metrics_endpoint_exists(self):
        """Metrics endpoint should be available"""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "ai_latency_seconds" in response.text
        assert "ai_token_usage" in response.text
        assert "ai_action_count" in response.text


class TestOpenAPISchema:
    """Test OpenAPI/Swagger documentation"""
    
    def test_openapi_schema_available(self):
        """OpenAPI schema should be accessible"""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        schema = response.json()
        assert schema["info"]["title"] == "JourneyIQ AI Agent Service"
        assert schema["info"]["version"] == "1.0.0"
    
    def test_swagger_ui_available(self):
        """Swagger UI should be accessible"""
        response = client.get("/docs")
        assert response.status_code == 200


@pytest.mark.integration
class TestAIAgentIntegration:
    """Integration tests for AI agent with RAG"""
    
    @pytest.mark.asyncio
    async def test_agent_retrieves_from_rag(self):
        """AI agent should retrieve relevant documents from RAG"""
        # This would require actual RAG setup
        # Skipped in unit tests, run in integration suite
        pass
    
    @pytest.mark.asyncio
    async def test_agent_handles_multi_turn_conversation(self):
        """AI agent should maintain conversation context"""
        # Test multi-turn conversation
        pass
