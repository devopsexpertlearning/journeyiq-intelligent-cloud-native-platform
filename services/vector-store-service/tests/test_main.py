"""
Unit tests for Vector Store Service
"""
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


class TestIndexing:
    """Test document indexing"""
    
    @patch('src.vector_db.db_instance.add_documents')
    def test_index_documents_success(self, mock_add):
        """Should index documents successfully"""
        mock_add.return_value = None
        
        response = client.post("/index", json=[
            {
                "content": "Flight cancellation policy document",
                "metadata": {"doc_id": "doc_001", "title": "Cancellation Policy"}
            },
            {
                "content": "Baggage allowance information",
                "metadata": {"doc_id": "doc_002", "title": "Baggage Policy"}
            }
        ])
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "indexed"
        assert data["count"] == 2
        mock_add.assert_called_once()
    
    def test_index_empty_documents(self):
        """Should reject empty document list"""
        response = client.post("/index", json=[])
        assert response.status_code == 200
        data = response.json()
        assert data["count"] == 0


class TestSearch:
    """Test vector similarity search"""
    
    @patch('src.vector_db.db_instance.search')
    def test_search_returns_results(self, mock_search):
        """Should return relevant search results"""
        mock_search.return_value = [
            {
                "content": "Cancellation policy details...",
                "score": 0.95,
                "metadata": {"doc_id": "doc_001"}
            },
            {
                "content": "Refund information...",
                "score": 0.87,
                "metadata": {"doc_id": "doc_003"}
            }
        ]
        
        response = client.post("/search", json={
            "query": "cancellation policy",
            "k": 2
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "results" in data
        assert len(data["results"]) == 2
        assert data["results"][0]["score"] > data["results"][1]["score"]
    
    @patch('src.vector_db.db_instance.search')
    def test_search_no_results(self, mock_search):
        """Should handle queries with no results"""
        mock_search.return_value = []
        
        response = client.post("/search", json={
            "query": "nonexistent topic",
            "k": 3
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["results"] == []
    
    def test_search_invalid_k(self):
        """Should reject invalid k parameter"""
        response = client.post("/search", json={
            "query": "test query",
            "k": -1
        })
        assert response.status_code == 422
    
    def test_search_missing_query(self):
        """Should reject requests without query"""
        response = client.post("/search", json={"k": 3})
        assert response.status_code == 422


class TestIndexReset:
    """Test index reset functionality"""
    
    @patch('src.vector_db.db_instance.reset')
    def test_reset_index_success(self, mock_reset):
        """Should reset index successfully"""
        mock_reset.return_value = None
        
        response = client.post("/reset")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "index_cleared"
        mock_reset.assert_called_once()


class TestMetrics:
    """Test Prometheus metrics"""
    
    def test_metrics_endpoint_exists(self):
        """Metrics endpoint should be available"""
        response = client.get("/metrics")
        assert response.status_code == 200
        assert "vector_index_size_documents" in response.text


class TestFAISSIntegration:
    """Integration tests for FAISS vector store"""
    
    @pytest.mark.integration
    def test_faiss_index_creation(self):
        """Should create FAISS index"""
        from src.vector_db import VectorDB
        db = VectorDB()
        assert db.index is not None
    
    @pytest.mark.integration
    def test_faiss_add_and_search(self):
        """Should add documents and search"""
        from src.vector_db import VectorDB
        db = VectorDB()
        
        # Add documents
        texts = ["Flight cancellation policy", "Baggage allowance"]
        metadata = [{"id": "1"}, {"id": "2"}]
        db.add_documents(texts, metadata)
        
        # Search
        results = db.search("cancellation", k=1)
        assert len(results) > 0
        assert "cancellation" in results[0]["content"].lower()
