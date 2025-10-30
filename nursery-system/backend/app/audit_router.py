"""
Audit logs router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
from datetime import datetime, timedelta

from .database import get_db
from .dependencies import require_admin
from .models import AuditLog, User
from .schemas import AuditLogResponse
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def create_audit_log(
    db: Session,
    request: Request,
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[int] = None,
    details: Optional[dict] = None
):
    """Helper function to create audit log entries"""
    try:
        audit_log = AuditLog(
            user_id=user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            details=details,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent")
        )

        db.add(audit_log)
        db.commit()

        logger.debug(f"Audit log created: {action} on {resource_type} by user {user_id}")

    except Exception as e:
        logger.error(f"Error creating audit log: {e}")
        # Don't fail the main operation if audit logging fails
        db.rollback()


@router.get("/", response_model=List[AuditLogResponse])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    user_id: Optional[int] = None,
    action: Optional[str] = None,
    resource_type: Optional[str] = None,
    days: int = 30,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs (Admin only)"""
    query = db.query(AuditLog)

    # Filter by date range
    start_date = datetime.utcnow() - timedelta(days=days)
    query = query.filter(AuditLog.created_at >= start_date)

    # Apply filters
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)

    if action:
        query = query.filter(AuditLog.action == action)

    if resource_type:
        query = query.filter(AuditLog.resource_type == resource_type)

    # Order by most recent first
    logs = query.order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    return [AuditLogResponse.from_orm(log) for log in logs]


@router.get("/stats")
async def get_audit_stats(
    days: int = 7,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get audit log statistics (Admin only)"""
    start_date = datetime.utcnow() - timedelta(days=days)

    # Total actions
    total_actions = db.query(AuditLog).filter(
        AuditLog.created_at >= start_date
    ).count()

    # Actions by type
    actions_by_type = {}
    for action in ["create", "update", "delete", "login", "logout"]:
        count = db.query(AuditLog).filter(
            AuditLog.created_at >= start_date,
            AuditLog.action == action
        ).count()
        actions_by_type[action] = count

    # Most active users
    from sqlalchemy import func
    most_active_users = db.query(
        User.id,
        User.first_name,
        User.last_name,
        func.count(AuditLog.id).label("action_count")
    ).join(
        AuditLog, User.id == AuditLog.user_id
    ).filter(
        AuditLog.created_at >= start_date
    ).group_by(
        User.id, User.first_name, User.last_name
    ).order_by(
        desc("action_count")
    ).limit(10).all()

    active_users = [
        {
            "user_id": user.id,
            "name": f"{user.first_name} {user.last_name}",
            "actions": user.action_count
        }
        for user in most_active_users
    ]

    return {
        "total_actions": total_actions,
        "actions_by_type": actions_by_type,
        "most_active_users": active_users,
        "period_days": days
    }


@router.get("/{log_id}", response_model=AuditLogResponse)
async def get_audit_log(
    log_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a specific audit log entry (Admin only)"""
    log = db.query(AuditLog).filter(AuditLog.id == log_id).first()

    if not log:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Audit log not found"
        )

    return AuditLogResponse.from_orm(log)


@router.get("/user/{user_id}", response_model=List[AuditLogResponse])
async def get_user_audit_logs(
    user_id: int,
    skip: int = 0,
    limit: int = 100,
    days: int = 30,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get audit logs for a specific user (Admin only)"""
    start_date = datetime.utcnow() - timedelta(days=days)

    logs = db.query(AuditLog).filter(
        AuditLog.user_id == user_id,
        AuditLog.created_at >= start_date
    ).order_by(desc(AuditLog.created_at)).offset(skip).limit(limit).all()

    return [AuditLogResponse.from_orm(log) for log in logs]
