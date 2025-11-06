"""
Audit Logging Helper
Provides easy-to-use functions for logging user actions across all routers
"""
from sqlalchemy.orm import Session
from fastapi import Request
from typing import Optional, Dict, Any
from datetime import datetime
import logging
from .models import AuditLog, User

logger = logging.getLogger(__name__)


def log_audit(
    db: Session,
    user: User,
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    request: Optional[Request] = None
):
    """
    Create an audit log entry

    Args:
        db: Database session
        user: Current user performing the action
        action: Action type (create, update, delete, login, logout, etc.)
        resource_type: Type of resource (user, nursery, child, etc.)
        resource_id: ID of the resource being acted upon
        details: Additional details about the action
        request: FastAPI request object (for IP and user agent)
    """
    try:
        # Extract request details if available
        ip_address = None
        user_agent = None

        if request:
            # Get client IP
            if hasattr(request, 'client') and request.client:
                ip_address = request.client.host

            # Get user agent
            if hasattr(request, 'headers'):
                user_agent = request.headers.get('user-agent', '')[:500]  # Limit length

        # Create audit log
        audit_log = AuditLog(
            user_id=user.id if user else None,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow()
        )

        db.add(audit_log)
        db.flush()  # Don't commit yet, let the main operation commit

        return audit_log

    except Exception:
        # Don't let audit logging failures break the main operation
        logger.exception("Failed to create audit log")
        return None


# Convenience functions for common actions

def log_create(db: Session, user: User, resource_type: str, resource_id: int,
               details: Optional[Dict] = None, request: Optional[Request] = None):
    """Log a CREATE action"""
    return log_audit(db, user, "create", resource_type, resource_id, details, request)


def log_update(db: Session, user: User, resource_type: str, resource_id: int,
               details: Optional[Dict] = None, request: Optional[Request] = None):
    """Log an UPDATE action"""
    return log_audit(db, user, "update", resource_type, resource_id, details, request)


def log_delete(db: Session, user: User, resource_type: str, resource_id: int,
               details: Optional[Dict] = None, request: Optional[Request] = None):
    """Log a DELETE action"""
    return log_audit(db, user, "delete", resource_type, resource_id, details, request)


def log_login(db: Session, user: User, details: Optional[Dict] = None,
              request: Optional[Request] = None):
    """Log a LOGIN action"""
    return log_audit(db, user, "login", "auth", user.id if user else None, details, request)


def log_logout(db: Session, user: User, details: Optional[Dict] = None,
               request: Optional[Request] = None):
    """Log a LOGOUT action"""
    return log_audit(db, user, "logout", "auth", user.id if user else None, details, request)


def log_settings_change(db: Session, user: User, setting_key: str,
                       details: Optional[Dict] = None, request: Optional[Request] = None):
    """Log a settings change"""
    return log_audit(db, user, "update", "settings", None,
                    {**(details or {}), "setting_key": setting_key}, request)


def log_security_event(
    db: Session,
    action: str,
    details: Optional[Dict] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    *,
    user: Optional[User] = None,
    request: Optional[Request] = None,
):
    """Log a security-related event. Supports optional user context."""
    try:
        if user:
            return log_audit(
                db=db,
                user=user,
                action=action,
                resource_type="security",
                resource_id=user.id,
                details={**(details or {}), "ip_address": ip_address, "user_agent": user_agent},
                request=request,
            )

        audit_log = AuditLog(
            user_id=None,
            action=action,
            resource_type="security",
            resource_id=None,
            details=details or {},
            ip_address=ip_address,
            user_agent=user_agent,
            created_at=datetime.utcnow(),
        )

        db.add(audit_log)
        db.flush()
        return audit_log

    except Exception:
        logger.exception("Failed to create security audit log")
        return None


# Example usage in a router:
"""
from fastapi import APIRouter, Depends, Request
from .audit_helper import log_create, log_update, log_delete

@router.post("/users")
async def create_user(
    user_data: UserCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    # Create user
    new_user = User(**user_data.dict())
    db.add(new_user)
    db.flush()

    # Log the action
    log_create(
        db, current_user, "user", new_user.id,
        details={"email": new_user.email, "role": new_user.role},
        request=request
    )

    db.commit()
    return new_user
"""
