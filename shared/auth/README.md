# Shared Authentication Utilities

Reusable authentication components for all JourneyIQ microservices.

## Overview

This package provides JWT token management, password hashing, and FastAPI middleware for authentication across all services.

## Components

### 1. JWT Token Management (`jwt.py`)

**Functions:**
- `create_access_token(data, expires_delta)` - Generate JWT access token
- `create_refresh_token(data)` - Generate refresh token (30 days)
- `verify_access_token(token)` - Verify and decode access token
- `verify_refresh_token(token)` - Verify and decode refresh token
- `is_token_expired(token)` - Check if token is expired
- `get_token_expiration(token)` - Get token expiration datetime

**Usage:**
```python
from shared.auth import create_access_token, verify_access_token

# Create token
token = create_access_token({"user_id": "u123", "email": "user@example.com"})

# Verify token
payload = verify_access_token(token)
user_id = payload["user_id"]
```

### 2. Password Hashing (`passwords.py`)

**Functions:**
- `hash_password(password)` - Hash password with bcrypt
- `verify_password(plain, hashed)` - Verify password
- `validate_password_strength(password)` - Check password requirements

**Usage:**
```python
from shared.auth import hash_password, verify_password

# Hash password
hashed = hash_password("SecurePass123!")

# Verify password
is_valid = verify_password("SecurePass123!", hashed)
```

### 3. FastAPI Middleware (`middleware.py`)

**Components:**
- `JWTAuthMiddleware` - Middleware for automatic token validation
- `get_current_user` - Dependency to extract user from token
- `get_current_user_id` - Dependency to get just user ID
- `require_role(role)` - Decorator for role-based access

**Usage:**
```python
from fastapi import FastAPI, Depends
from shared.auth import JWTAuthMiddleware, get_current_user

app = FastAPI()

# Add middleware
app.add_middleware(
    JWTAuthMiddleware,
    exclude_paths=["/health", "/docs", "/openapi.json"]
)

# Use dependency
@app.get("/users/me")
async def read_users_me(current_user: dict = Depends(get_current_user)):
    return current_user
```

## Configuration

Set environment variables:

```bash
JWT_SECRET=your-secret-key-change-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440  # 24 hours
```

## Security Best Practices

✅ **Use strong JWT secrets** - Generate with `openssl rand -hex 32`  
✅ **HTTPS only** - Never send tokens over HTTP  
✅ **Short expiration** - 15-60 minutes for access tokens  
✅ **Refresh tokens** - Use for long-lived sessions  
✅ **Password requirements** - Enforced by `validate_password_strength`  

## Dependencies

```bash
pip install PyJWT bcrypt fastapi
```

## Testing

```python
# Test JWT
from shared.auth import create_access_token, verify_access_token

token = create_access_token({"user_id": "test"})
payload = verify_access_token(token)
assert payload["user_id"] == "test"

# Test passwords
from shared.auth import hash_password, verify_password

hashed = hash_password("Test123!")
assert verify_password("Test123!", hashed)
assert not verify_password("Wrong", hashed)
```

## Integration with Services

### Auth Service
```python
from shared.auth import create_access_token, hash_password

# Registration
hashed_password = hash_password(user.password)
# Save to database

# Login
token = create_access_token({
    "user_id": user.id,
    "email": user.email
})
return {"access_token": token}
```

### Protected Services
```python
from shared.auth import get_current_user

@app.get("/bookings")
async def get_bookings(current_user: dict = Depends(get_current_user)):
    user_id = current_user["user_id"]
    # Fetch bookings for user
```

## Token Payload Structure

**Access Token:**
```json
{
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "email": "user@example.com",
  "role": "user",
  "exp": 1642521600,
  "iat": 1642435200,
  "type": "access"
}
```

**Refresh Token:**
```json
{
  "user_id": "u0000000-0000-0000-0000-000000000001",
  "exp": 1645027200,
  "iat": 1642435200,
  "type": "refresh"
}
```

## Error Handling

```python
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

try:
    payload = verify_access_token(token)
except ExpiredSignatureError:
    # Token expired - refresh needed
    pass
except InvalidTokenError:
    # Invalid token - re-authenticate
    pass
```

## Files

- `jwt.py` - JWT token utilities
- `passwords.py` - Password hashing utilities
- `middleware.py` - FastAPI authentication middleware
- `__init__.py` - Package exports
- `README.md` - This file
