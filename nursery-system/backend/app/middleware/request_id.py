"""
Middleware for attaching a request ID to every inbound request.
"""
from __future__ import annotations

import uuid
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from starlette.types import ASGIApp

from ..logging_config import request_id_ctx_var


class RequestIdMiddleware(BaseHTTPMiddleware):
    """Assign and propagate a unique request identifier."""

    header_name = "X-Request-ID"

    def __init__(self, app: ASGIApp) -> None:
        super().__init__(app)

    async def dispatch(  # type: ignore[override]
        self,
        request: Request,
        call_next: Callable[[Request], Response],
    ) -> Response:
        request_id = request.headers.get(self.header_name) or str(uuid.uuid4())
        token = request_id_ctx_var.set(request_id)
        request.state.request_id = request_id

        try:
            response = await call_next(request)
        finally:
            request_id_ctx_var.reset(token)

        response.headers[self.header_name] = request_id
        return response
