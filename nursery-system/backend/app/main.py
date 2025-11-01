from __future__ import annotations

import logging
from datetime import datetime
from typing import Iterable, Tuple

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth_router import router as auth_router
from .attendance_router import router as attendance_router
from .backup_router import router as backup_router
from .children_router import router as children_router
from .errors import register_exception_handlers
from .file_router import router as file_router
from .logging_config import configure_logging
from .middleware import RequestIdMiddleware
from .notification_router import router as notification_router
from .nursery_router import router as nursery_router
from .reports_router import router as reports_router
from .settings import settings
from .settings_router import router as settings_router
from .admin_router import router as admin_router
from .user_router import router as user_router
from .audit_router import router as audit_router
from .manager_router import router as manager_router
from .parent_router import router as parent_router
from .supervisor_router import router as supervisor_router

# Initialise application logging before creating any loggers.
configure_logging()
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Nursery Management System API",
    description="A comprehensive API for managing nursery operations",
    version=settings.version,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
    debug=settings.debug,
)

# Middleware stack ---------------------------------------------------------
app.add_middleware(RequestIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins_list(),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Structured error handling ------------------------------------------------
register_exception_handlers(app)

# Router registration ------------------------------------------------------
_ROUTERS: Iterable[Tuple] = (
    (auth_router, "/auth", ["Authentication"]),
    (nursery_router, "/admin", ["Nurseries"]),
    (user_router, "/admin/users", ["Users"]),
    (manager_router, "/manager", ["Manager"]),
    (parent_router, "/parent", ["Parent"]),
    (supervisor_router, "/supervisor", ["Supervisor"]),
    (children_router, "/children", ["Children"]),
    (attendance_router, "/attendance", ["Attendance"]),
    (reports_router, "/reports", ["Reports"]),
    (admin_router, "/system", ["Admin"]),
    (file_router, "/files", ["Files"]),
    (notification_router, "/notifications", ["Notifications"]),
    (audit_router, "/audit-logs", ["Audit Logs"]),
    (settings_router, "/admin/settings", ["Settings"]),
    (backup_router, "/admin/backup", ["Backup"]),
)

for router, prefix, tags in _ROUTERS:
    try:
        app.include_router(router, prefix=prefix, tags=tags)
        logger.debug(
            "Router registered",
            extra={"router_prefix": prefix, "router_tags": tags},
        )
    except Exception:  # pragma: no cover - defensive guard
        logger.exception("Failed to register router", extra={"router_prefix": prefix})
        raise


@app.get("/")
async def root() -> dict[str, str]:
    """Basic readiness probe."""
    return {"message": "Nursery Management System API", "version": settings.version}


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Simple health endpoint for uptime checks."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
    }


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
    )
