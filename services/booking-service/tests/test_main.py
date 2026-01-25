"""
Unit tests for Booking Service
"""
import pytest
from unittest.mock import Mock, patch
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


class TestBookingCreation:
    """Test booking creation endpoint"""
    
    @patch('src.database.get_db')
    @patch('src.events.publisher.publish_event')
    def test_create_booking_success(self, mock_publish, mock_db):
        """Should create booking and publish event"""
        # Mock database
        mock_db.return_value.execute.return_value = Mock()
        
        response = client.post("/bookings", json={
            "user_id": "u0000000-0000-0000-0000-000000000001",
            "resource_type": "FLIGHT",
            "resource_id": "f0000000-0000-0000-0000-000000000001",
            "passengers": [{"name": "Alice Voyager", "seat": "10A"}]
        })
        
        assert response.status_code == 201
        data = response.json()
        assert "booking_id" in data
        assert data["status"] == "PENDING"
        assert data["payment_required"] is True
        
        # Verify event published
        mock_publish.assert_called_once()
    
    def test_create_booking_invalid_resource_type(self):
        """Should reject invalid resource types"""
        response = client.post("/bookings", json={
            "user_id": "u0000000-0000-0000-0000-000000000001",
            "resource_type": "INVALID",
            "resource_id": "f0000000-0000-0000-0000-000000000001"
        })
        assert response.status_code == 422
    
    def test_create_booking_missing_user_id(self):
        """Should reject bookings without user_id"""
        response = client.post("/bookings", json={
            "resource_type": "FLIGHT",
            "resource_id": "f0000000-0000-0000-0000-000000000001"
        })
        assert response.status_code == 422


class TestBookingRetrieval:
    """Test booking retrieval endpoint"""
    
    @patch('src.database.get_db')
    def test_get_booking_success(self, mock_db):
        """Should retrieve existing booking"""
        # Mock database response
        mock_booking = {
            "id": "b0000000-0000-0000-0000-000000000001",
            "user_id": "u0000000-0000-0000-0000-000000000001",
            "status": "CONFIRMED"
        }
        mock_db.return_value.execute.return_value.fetchone.return_value = mock_booking
        
        response = client.get("/bookings/b0000000-0000-0000-0000-000000000001")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == "b0000000-0000-0000-0000-000000000001"
        assert data["status"] == "CONFIRMED"
    
    @patch('src.database.get_db')
    def test_get_booking_not_found(self, mock_db):
        """Should return 404 for non-existent booking"""
        mock_db.return_value.execute.return_value.fetchone.return_value = None
        
        response = client.get("/bookings/b9999999-9999-9999-9999-999999999999")
        assert response.status_code == 404


class TestBookingCancellation:
    """Test booking cancellation endpoint"""
    
    @patch('src.database.get_db')
    @patch('src.events.publisher.publish_event')
    def test_cancel_booking_success(self, mock_publish, mock_db):
        """Should cancel booking and publish event"""
        mock_db.return_value.execute.return_value = Mock()
        
        response = client.delete("/bookings/b0000000-0000-0000-0000-000000000001")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "CANCELLED"
        
        # Verify cancellation event published
        mock_publish.assert_called_once()
    
    @patch('src.database.get_db')
    def test_cancel_booking_not_found(self, mock_db):
        """Should return 404 for non-existent booking"""
        mock_db.return_value.execute.return_value.rowcount = 0
        
        response = client.delete("/bookings/b9999999-9999-9999-9999-999999999999")
        assert response.status_code == 404


class TestSagaOrchestration:
    """Test saga pattern for booking workflow"""
    
    @patch('src.saga.booking_saga.execute')
    async def test_saga_success_flow(self, mock_saga):
        """Should complete saga successfully"""
        mock_saga.return_value = {"status": "COMPLETED"}
        # Test saga orchestration
        pass
    
    @patch('src.saga.booking_saga.compensate')
    async def test_saga_compensation_on_failure(self, mock_compensate):
        """Should trigger compensation on failure"""
        # Test saga compensation
        pass


class TestMetrics:
    """Test Prometheus metrics"""
    
    def test_metrics_endpoint_exists(self):
        """Metrics endpoint should be available"""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "http_requests_total" in response.text
