"""
Application logging configuration utilities.
"""
from __future__ import annotations

import logging
import os
import sys
from contextvars import ContextVar
from logging.handlers import RotatingFileHandler
from pathlib import Path
from typing import Optional

from .settings import settings

# Context variable used to store the active request identifier.
request_id_ctx_var: ContextVar[Optional[str]] = ContextVar(
    "request_id", default=None
)


class RequestIdFilter(logging.Filter):
    """Inject the active request ID into log records."""

    def filter(self, record: logging.LogRecord) -> bool:  # noqa: D401
        record.request_id = request_id_ctx_var.get() or "-"
        return True


def _create_formatter() -> logging.Formatter:
    """Create a consistent formatter for all handlers."""
    return logging.Formatter(
        "%(asctime)s | %(levelname)s | %(name)s | %(request_id)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


def configure_logging() -> None:
    """
    Configure root logging handlers and formatters.

    Ensures both console and rotating file handlers are registered and that
    each log record contains the active request identifier.
    """
    if os.environ.get("APP_DISABLE_LOGGING") == "1":
        return

    if "pytest" in sys.modules:
        return
    # Ensure log directory exists
    log_path = Path(settings.log_file).expanduser()
    log_path.parent.mkdir(parents=True, exist_ok=True)

    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    root_logger = logging.getLogger()
    if getattr(root_logger, "_app_logging_configured", False):
        return

    formatter = _create_formatter()
    request_filter = RequestIdFilter()

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(log_level)
    stream_handler.setFormatter(formatter)
    stream_handler.addFilter(request_filter)

    file_handler = RotatingFileHandler(
        log_path,
        maxBytes=5 * 1024 * 1024,  # 5MB
        backupCount=5,
    )
    file_handler.setLevel(log_level)
    file_handler.setFormatter(formatter)
    file_handler.addFilter(request_filter)

    root_logger.setLevel(log_level)
    root_logger.addHandler(stream_handler)
    root_logger.addHandler(file_handler)
    setattr(root_logger, "_app_logging_configured", True)


def set_request_id(request_id: Optional[str]) -> None:
    """Store the active request ID in the logging context."""
    request_id_ctx_var.set(request_id)
