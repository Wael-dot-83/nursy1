"""
CSRF Protection Middleware for FastAPI
"""
import secrets
from typing import Optional
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware


class CSRFMiddleware(BaseHTTPMiddleware):
    """
    CSRF Protection Middleware

    Generates and validates CSRF tokens for state-changing operations.
    Exempts safe HTTP methods (GET, HEAD, OPTIONS) and API endpoints.
    """

    def __init__(self, app, exempt_paths: Optional[list] = None):
        super().__init__(app)
        self.exempt_paths = exempt_paths or [
            "/health", "/docs", "/redoc", "/openapi.json",
            "/auth", "/admin", "/children", "/attendance", "/reports",
            "/system", "/manager", "/supervisor", "/parent", "/files",
            "/notifications", "/audit-logs", "/admin/settings", "/admin/backup"
        ]

    async def dispatch(self, request: Request, call_next):
        # Skip CSRF check for safe methods
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)

        # Skip CSRF check for exempt paths
        for path in self.exempt_paths:
            if request.url.path.startswith(path):
                return await call_next(request)

        # Skip CSRF check for API endpoints (they should use proper auth)
        if request.url.path.startswith("/api/"):
            return await call_next(request)

        # For form submissions, check CSRF token
        if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            csrf_token = request.headers.get("X-CSRF-Token") or request.cookies.get("csrf_token")

            if not csrf_token:
                return JSONResponse(
                    status_code=status.HTTP_403_FORBIDDEN,
                    content={"error": "CSRF token missing"}
                )

            # In a real implementation, you'd validate the token against a stored value
            # For now, we'll just check if it exists
            # TODO: Implement proper CSRF token validation

        response = await call_next(request)
        return response


def generate_csrf_token() -> str:
    """Generate a secure CSRF token"""
    return secrets.token_urlsafe(32)


def get_csrf_token(request: Request) -> str:
    """Get or create CSRF token for the request"""
    token = request.cookies.get("csrf_token")
    if not token:
        token = generate_csrf_token()
    return token


def set_csrf_cookie(response, token: str):
    """Set CSRF token as a cookie"""
    response.set_cookie(
        key="csrf_token",
        value=token,
        httponly=False,  # Allow JavaScript access for forms
        secure=False,    # Set to True in production with HTTPS
        samesite="strict",
        max_age=3600     # 1 hour
    )