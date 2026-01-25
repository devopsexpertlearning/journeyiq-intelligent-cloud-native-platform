"""
FastAPI Authentication Middleware

Shared middleware for JWT authentication across all services.
"""
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Callable
from .jwt import verify_access_token
from jwt.exceptions import InvalidTokenError, ExpiredSignatureError


security = HTTPBearer()


class JWTAuthMiddleware:
    """
    Middleware to validate JWT tokens on protected endpoints.
    
    Usage:
        from shared.auth.middleware import JWTAuthMiddleware
        
        app = FastAPI()
        app.add_middleware(JWTAuthMiddleware, exclude_paths=["/health", "/docs"])
    """
    
    def __init__(self, app, exclude_paths: list = None):
        self.app = app
        self.exclude_paths = exclude_paths or ["/health", "/metrics", "/docs", "/openapi.json", "/redoc"]
    
    async def __call__(self, request: Request, call_next):
        # Skip authentication for excluded paths
        if any(request.url.path.startswith(path) for path in self.exclude_paths):
            return await call_next(request)
        
        # Extract token from Authorization header
        auth_header = request.headers.get("Authorization")
        
        if not auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing authorization header",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        try:
            # Verify Bearer scheme
            scheme, token = auth_header.split()
            if scheme.lower() != "bearer":
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid authentication scheme",
                    headers={"WWW-Authenticate": "Bearer"},
                )
            
            # Verify token
            payload = verify_access_token(token)
            
            # Add user info to request state
            request.state.user_id = payload.get("user_id")
            request.state.email = payload.get("email")
            request.state.token_payload = payload
            
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"},
            )
        except InvalidTokenError as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token: {str(e)}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        response = await call_next(request)
        return response


async def get_current_user(credentials: HTTPAuthorizationCredentials = security) -> dict:
    """
    Dependency to get current authenticated user from JWT token.
    
    Usage:
        from shared.auth.middleware import get_current_user
        
        @app.get("/users/me")
        async def read_users_me(current_user: dict = Depends(get_current_user)):
            return current_user
    """
    try:
        payload = verify_access_token(credentials.credentials)
        return payload
    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


async def get_current_user_id(current_user: dict = get_current_user) -> str:
    """
    Dependency to get just the user ID from JWT token.
    
    Usage:
        @app.get("/bookings")
        async def get_my_bookings(user_id: str = Depends(get_current_user_id)):
            return {"user_id": user_id}
    """
    user_id = current_user.get("user_id")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User ID not found in token"
        )
    return user_id


def require_role(required_role: str) -> Callable:
    """
    Decorator to require specific role for endpoint access.
    
    Usage:
        @app.delete("/admin/users/{user_id}")
        @require_role("admin")
        async def delete_user(user_id: str, current_user: dict = Depends(get_current_user)):
            # Only admins can access this
            pass
    """
    def decorator(func):
        async def wrapper(*args, current_user: dict = get_current_user, **kwargs):
            user_role = current_user.get("role")
            if user_role != required_role:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Requires {required_role} role"
                )
            return await func(*args, current_user=current_user, **kwargs)
        return wrapper
    return decorator
