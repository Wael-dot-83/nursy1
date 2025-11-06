"""
Centralised error handling utilities to provide structured responses.
"""
from __future__ import annotations

import logging
from datetime import datetime
from typing import Any, Dict, Optional

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette import status
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger(__name__)


def _normalise_error_detail(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _normalise_error_detail(val) for key, val in value.items()}
    if isinstance(value, list):
        return [_normalise_error_detail(item) for item in value]
    if isinstance(value, Exception):
        return str(value)
    return value


def _build_error_payload(
    *,
    status_code: int,
    code: str,
    message: str,
    request_id: Optional[str],
    details: Optional[Any] = None,
) -> Dict[str, Any]:
    payload: Dict[str, Any] = {
        "error": {
            "code": code,
            "message": message,
        },
        "requestId": request_id,
    }
    if details:
        payload["error"]["details"] = _normalise_error_detail(details)
    return payload


def _extract_code_and_message(
    detail: Any,
    fallback_code: str,
    fallback_message: str,
) -> tuple[str, str, Optional[Any]]:
    if isinstance(detail, dict):
        code = detail.get("code") or detail.get("error_code") or fallback_code
        message = detail.get("message") or detail.get("detail") or fallback_message
        extra = detail.get("details") or detail.get("extra")
        return str(code), str(message), extra

    if isinstance(detail, list):
        return fallback_code, fallback_message, detail

    if isinstance(detail, str):
        return fallback_code, detail, None

    return fallback_code, fallback_message, detail


async def http_exception_handler(
    request: Request,
    exc: StarletteHTTPException,
) -> JSONResponse:
    """Convert HTTPException responses into structured errors."""
    request_id = getattr(request.state, "request_id", None)
    fallback_code = f"HTTP_{exc.status_code}"
    fallback_message = exc.detail if isinstance(exc.detail, str) else exc.__class__.__name__

    code, message, details = _extract_code_and_message(
        exc.detail,
        fallback_code,
        fallback_message,
    )

    logger.warning(
        "HTTP exception returned",
        extra={
            "status_code": exc.status_code,
            "error_code": code,
            "request_id": request_id,
        },
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=_build_error_payload(
            status_code=exc.status_code,
            code=code,
            message=message,
            request_id=request_id,
            details=details,
        ),
    )


async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
) -> JSONResponse:
    """Provide consistent validation error payloads."""
    request_id = getattr(request.state, "request_id", None)
    logger.debug("Request validation failed", extra={"request_id": request_id})

    details = exc.errors()
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=_build_error_payload(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            code="VALIDATION_ERROR",
            message="Request validation failed",
            request_id=request_id,
            details=details,
        ),
    )


async def generic_exception_handler(
    request: Request,
    exc: Exception,
) -> JSONResponse:
    """Catch-all handler to shield internal errors."""
    request_id = getattr(request.state, "request_id", None)
    logger.exception(
        "Unhandled server error",
        extra={"request_id": request_id},
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=_build_error_payload(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred",
            request_id=request_id,
        ),
    )


async def app_exception_handler(request: Request, exc: Exception):
    """Handler for custom AppException errors."""
    from .exceptions import AppException
    
    if isinstance(exc, AppException):
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "detail": exc.message,
                "errors": exc.details,
                "timestamp": datetime.utcnow().isoformat(),
                "path": str(request.url),
            }
        )
    raise exc


def register_exception_handlers(app: FastAPI) -> None:
    """Attach the structured error handlers to the FastAPI application."""
    from .exceptions import AppException
    
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, generic_exception_handler)
