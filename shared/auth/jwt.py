"""
JWT Authentication Utilities

Shared JWT token generation and verification for all services.
"""
import os
from datetime import datetime, timedelta
from typing import Dict, Optional
import jwt
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError


# Configuration from environment
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))  # 24 hours


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload data to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
        
    Example:
        >>> token = create_access_token({"user_id": "u123", "email": "user@example.com"})
        >>> print(token)
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRATION_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "access"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: Dict) -> str:
    """
    Create a JWT refresh token with longer expiration.
    
    Args:
        data: Payload data to encode in the token
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=30)  # 30 days for refresh
    
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
        "type": "refresh"
    })
    
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def verify_access_token(token: str) -> Dict:
    """
    Verify and decode a JWT access token.
    
    Args:
        token: JWT token string to verify
        
    Returns:
        Decoded token payload
        
    Raises:
        InvalidTokenError: If token is invalid
        ExpiredSignatureError: If token has expired
        
    Example:
        >>> payload = verify_access_token(token)
        >>> user_id = payload["user_id"]
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "access":
            raise InvalidTokenError("Invalid token type")
        
        return payload
    except ExpiredSignatureError:
        raise ExpiredSignatureError("Token has expired")
    except InvalidTokenError as e:
        raise InvalidTokenError(f"Invalid token: {str(e)}")


def verify_refresh_token(token: str) -> Dict:
    """
    Verify and decode a JWT refresh token.
    
    Args:
        token: JWT refresh token string to verify
        
    Returns:
        Decoded token payload
        
    Raises:
        InvalidTokenError: If token is invalid
        ExpiredSignatureError: If token has expired
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        
        # Verify token type
        if payload.get("type") != "refresh":
            raise InvalidTokenError("Invalid token type")
        
        return payload
    except ExpiredSignatureError:
        raise ExpiredSignatureError("Refresh token has expired")
    except InvalidTokenError as e:
        raise InvalidTokenError(f"Invalid refresh token: {str(e)}")


def decode_token_without_verification(token: str) -> Dict:
    """
    Decode token without verification (for debugging only).
    
    WARNING: Do not use in production for authentication!
    
    Args:
        token: JWT token string
        
    Returns:
        Decoded token payload (unverified)
    """
    return jwt.decode(token, options={"verify_signature": False})


def get_token_expiration(token: str) -> datetime:
    """
    Get the expiration time of a token.
    
    Args:
        token: JWT token string
        
    Returns:
        Expiration datetime
    """
    payload = decode_token_without_verification(token)
    exp_timestamp = payload.get("exp")
    
    if exp_timestamp:
        return datetime.fromtimestamp(exp_timestamp)
    
    raise ValueError("Token does not have expiration")


def is_token_expired(token: str) -> bool:
    """
    Check if a token is expired without raising an exception.
    
    Args:
        token: JWT token string
        
    Returns:
        True if expired, False otherwise
    """
    try:
        verify_access_token(token)
        return False
    except ExpiredSignatureError:
        return True
    except InvalidTokenError:
        return True
