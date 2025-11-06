"""
Rate limiting middleware using slowapi
"""
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from fastapi import Request
from app.settings import settings

# Create limiter instance with enhanced configuration
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.rate_limit_per_minute}/minute"],
    storage_uri="memory://",  # Use memory storage for development
    strategy="fixed-window",  # Use fixed window strategy for consistency
    application_limits=[f"{settings.rate_limit_per_minute * 10}/minute"],  # Global limit
)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom handler for rate limit exceeded"""
    return {
        "error": "rate_limit_exceeded",
        "detail": f"Too many requests. Please try again later.",
        "retry_after": exc.retry_after if hasattr(exc, "retry_after") else 60,
        "limit": exc.limit if hasattr(exc, "limit") else None,
        "remaining": exc.remaining if hasattr(exc, "remaining") else None,
        "reset_time": exc.reset_time if hasattr(exc, "reset_time") else None
    }

# Additional rate limiters for specific endpoints
auth_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=[f"{settings.auth_rate_limit_per_minute}/minute"],
    storage_uri="memory://",
    strategy="fixed-window",
)

# Stricter limiter for password reset endpoints
password_reset_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["2/minute", "5/hour"],  # Very restrictive for password reset
    storage_uri="memory://",
    strategy="fixed-window",
)

# Limiter for file uploads
file_upload_limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["10/minute", "50/hour"],  # Reasonable limits for file uploads
    storage_uri="memory://",
    strategy="fixed-window",
)
