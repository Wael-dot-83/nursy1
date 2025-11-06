"""
Custom exception classes for structured error handling.
"""
from typing import Any, Optional


class AppException(Exception):
    """Base exception for application errors."""
    
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        details: Optional[Any] = None,
    ):
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(self.message)


class AuthenticationError(AppException):
    """Raised when authentication fails."""
    
    def __init__(self, message: str = "Authentication failed", details: Optional[Any] = None):
        super().__init__(message, status_code=401, details=details)


class AuthorizationError(AppException):
    """Raised when user lacks required permissions."""
    
    def __init__(self, message: str = "Permission denied", details: Optional[Any] = None):
        super().__init__(message, status_code=403, details=details)


class NotFoundError(AppException):
    """Raised when requested resource is not found."""
    
    def __init__(self, message: str = "Resource not found", details: Optional[Any] = None):
        super().__init__(message, status_code=404, details=details)


class ValidationError(AppException):
    """Raised when input validation fails."""
    
    def __init__(self, message: str = "Validation error", details: Optional[Any] = None):
        super().__init__(message, status_code=422, details=details)


class ConflictError(AppException):
    """Raised when operation conflicts with existing data."""
    
    def __init__(self, message: str = "Resource conflict", details: Optional[Any] = None):
        super().__init__(message, status_code=409, details=details)


class RateLimitError(AppException):
    """Raised when rate limit is exceeded."""
    
    def __init__(self, message: str = "Rate limit exceeded", details: Optional[Any] = None):
        super().__init__(message, status_code=429, details=details)


class DatabaseError(AppException):
    """Raised when database operation fails."""
    
    def __init__(self, message: str = "Database error occurred", details: Optional[Any] = None):
        super().__init__(message, status_code=500, details=details)


class ExternalServiceError(AppException):
    """Raised when external service (SMS, email, etc.) fails."""
    
    def __init__(self, message: str = "External service error", details: Optional[Any] = None):
        super().__init__(message, status_code=503, details=details)
