"""
Shared Authentication Utilities

JWT token management, password hashing, and authentication middleware.
"""

from .jwt import (
    create_access_token,
    create_refresh_token,
    verify_access_token,
    verify_refresh_token,
    is_token_expired,
    get_token_expiration,
)

from .passwords import (
    hash_password,
    verify_password,
    validate_password_strength,
)

from .middleware import (
    JWTAuthMiddleware,
    get_current_user,
    get_current_user_id,
    require_role,
)

__all__ = [
    # JWT functions
    "create_access_token",
    "create_refresh_token",
    "verify_access_token",
    "verify_refresh_token",
    "is_token_expired",
    "get_token_expiration",
    # Password functions
    "hash_password",
    "verify_password",
    "validate_password_strength",
    # Middleware
    "JWTAuthMiddleware",
    "get_current_user",
    "get_current_user_id",
    "require_role",
]
