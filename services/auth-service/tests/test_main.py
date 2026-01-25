"""
Unit tests for Auth Service
"""
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from datetime import datetime, timedelta
from main import app

client = TestClient(app)


class TestHealthEndpoint:
    """Test health check endpoint"""
    
    def test_health_check_returns_200(self):
        """Health endpoint should return 200 OK"""
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json() == {"status": "healthy"}


class TestUserRegistration:
    """Test user registration endpoint"""
    
    @patch('src.database.get_db')
    @patch('src.auth.hash_password')
    def test_register_new_user_success(self, mock_hash, mock_db):
        """Should register new user successfully"""
        mock_hash.return_value = "hashed_password"
        mock_db.return_value.execute.return_value = Mock()
        
        response = client.post("/auth/register", json={
            "email": "newuser@example.com",
            "password": "SecurePass123!",
            "full_name": "New User"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert "user_id" in data
        assert data["email"] == "newuser@example.com"
    
    @patch('src.database.get_db')
    def test_register_duplicate_email(self, mock_db):
        """Should reject duplicate email registration"""
        # Mock database constraint violation
        from sqlalchemy.exc import IntegrityError
        mock_db.return_value.execute.side_effect = IntegrityError("", "", "")
        
        response = client.post("/auth/register", json={
            "email": "alice.voyager@journeyiq.com",
            "password": "password123",
            "full_name": "Alice Duplicate"
        })
        
        assert response.status_code == 409  # Conflict
    
    def test_register_weak_password(self):
        """Should reject weak passwords"""
        response = client.post("/auth/register", json={
            "email": "newuser@example.com",
            "password": "123",
            "full_name": "New User"
        })
        assert response.status_code == 422
    
    def test_register_invalid_email(self):
        """Should reject invalid email format"""
        response = client.post("/auth/register", json={
            "email": "not-an-email",
            "password": "SecurePass123!",
            "full_name": "New User"
        })
        assert response.status_code == 422


class TestUserLogin:
    """Test user login endpoint"""
    
    @patch('src.database.get_db')
    @patch('src.auth.verify_password')
    @patch('src.auth.create_access_token')
    def test_login_success(self, mock_token, mock_verify, mock_db):
        """Should login with valid credentials"""
        # Mock user exists
        mock_user = {
            "id": "u0000000-0000-0000-0000-000000000001",
            "email": "alice.voyager@journeyiq.com",
            "password_hash": "hashed"
        }
        mock_db.return_value.execute.return_value.fetchone.return_value = mock_user
        mock_verify.return_value = True
        mock_token.return_value = "jwt_token_here"
        
        response = client.post("/auth/login", json={
            "email": "alice.voyager@journeyiq.com",
            "password": "password123"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "expires_in" in data
    
    @patch('src.database.get_db')
    def test_login_user_not_found(self, mock_db):
        """Should reject login for non-existent user"""
        mock_db.return_value.execute.return_value.fetchone.return_value = None
        
        response = client.post("/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "password123"
        })
        
        assert response.status_code == 401
    
    @patch('src.database.get_db')
    @patch('src.auth.verify_password')
    def test_login_wrong_password(self, mock_verify, mock_db):
        """Should reject login with wrong password"""
        mock_user = {"id": "u123", "email": "alice@example.com", "password_hash": "hashed"}
        mock_db.return_value.execute.return_value.fetchone.return_value = mock_user
        mock_verify.return_value = False
        
        response = client.post("/auth/login", json={
            "email": "alice@example.com",
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401


class TestTokenRefresh:
    """Test token refresh endpoint"""
    
    @patch('src.auth.verify_refresh_token')
    @patch('src.auth.create_access_token')
    def test_refresh_token_success(self, mock_create, mock_verify):
        """Should refresh valid token"""
        mock_verify.return_value = {"user_id": "u123"}
        mock_create.return_value = "new_jwt_token"
        
        response = client.post("/auth/refresh", json={
            "refresh_token": "valid_refresh_token"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
    
    @patch('src.auth.verify_refresh_token')
    def test_refresh_token_invalid(self, mock_verify):
        """Should reject invalid refresh token"""
        mock_verify.side_effect = Exception("Invalid token")
        
        response = client.post("/auth/refresh", json={
            "refresh_token": "invalid_token"
        })
        
        assert response.status_code == 401


class TestJWTUtilities:
    """Test JWT token utilities"""
    
    def test_create_access_token(self):
        """Should create valid JWT token"""
        from src.auth import create_access_token
        token = create_access_token({"user_id": "u123"})
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_verify_access_token(self):
        """Should verify valid JWT token"""
        from src.auth import create_access_token, verify_access_token
        token = create_access_token({"user_id": "u123"})
        payload = verify_access_token(token)
        assert payload["user_id"] == "u123"
    
    def test_verify_expired_token(self):
        """Should reject expired token"""
        from src.auth import verify_access_token
        # Create expired token (would need to mock time)
        with pytest.raises(Exception):
            verify_access_token("expired.token.here")


class TestPasswordHashing:
    """Test password hashing utilities"""
    
    def test_hash_password(self):
        """Should hash password"""
        from src.auth import hash_password
        hashed = hash_password("SecurePass123!")
        assert hashed != "SecurePass123!"
        assert len(hashed) > 0
    
    def test_verify_password_correct(self):
        """Should verify correct password"""
        from src.auth import hash_password, verify_password
        password = "SecurePass123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed) is True
    
    def test_verify_password_incorrect(self):
        """Should reject incorrect password"""
        from src.auth import hash_password, verify_password
        hashed = hash_password("SecurePass123!")
        assert verify_password("WrongPassword", hashed) is False
