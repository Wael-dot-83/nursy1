"""
Notifications router
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from .database import get_db
from .dependencies import get_current_user, require_admin
from .models import Notification, User
from .schemas import NotificationCreate, NotificationResponse, BaseResponse
from .audit_helper import log_create, log_audit
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    skip: int = 0,
    limit: int = 50,
    unread_only: bool = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get notifications for current user"""
    query = db.query(Notification).filter(Notification.user_id == current_user.id)

    if unread_only:
        query = query.filter(Notification.is_read == False)

    notifications = query.order_by(Notification.created_at.desc()).offset(skip).limit(limit).all()

    return [NotificationResponse.from_orm(n) for n in notifications]


@router.get("/unread-count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {"count": count}


@router.get("/{notification_id}", response_model=NotificationResponse)
async def get_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    return NotificationResponse.from_orm(notification)


@router.patch("/{notification_id}/read", response_model=BaseResponse)
async def mark_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    if not notification.is_read:
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        db.commit()

    return BaseResponse(message="Notification marked as read")


@router.patch("/read-all", response_model=BaseResponse)
async def mark_all_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read for current user"""
    db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({
        "is_read": True,
        "read_at": datetime.utcnow()
    }, synchronize_session=False)

    db.commit()

    return BaseResponse(message="All notifications marked as read")


@router.delete("/{notification_id}", response_model=BaseResponse)
async def delete_notification(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a notification"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )

    db.delete(notification)
    db.commit()

    return BaseResponse(message="Notification deleted")


@router.post("/", response_model=NotificationResponse)
async def create_notification(
    notification: NotificationCreate,
    request: Request,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new notification (Admin only)"""
    try:
        # Verify user exists
        user = db.query(User).filter(User.id == notification.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        db_notification = Notification(
            user_id=notification.user_id,
            title=notification.title,
            message=notification.message,
            type=notification.type,
            link=notification.link
        )

        db.add(db_notification)
        db.flush()

        # Log the notification creation
        log_create(
            db, current_user, "notification", db_notification.id,
            details={
                "user_id": notification.user_id,
                "type": notification.type,
                "title": notification.title
            },
            request=request
        )

        db.commit()
        db.refresh(db_notification)

        logger.info(f"Notification created: {db_notification.id} for user {notification.user_id}")

        return NotificationResponse.from_orm(db_notification)

    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )


@router.post("/broadcast", response_model=BaseResponse)
async def broadcast_notification(
    title: str,
    message: str,
    type: str = "info",
    link: Optional[str] = None,
    role: Optional[str] = None,
    request: Request = None,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Broadcast a notification to all users or specific role (Admin only)"""
    try:
        query = db.query(User).filter(User.is_active == True)

        if role:
            query = query.filter(User.role == role)

        users = query.all()

        notifications = []
        for user in users:
            notification = Notification(
                user_id=user.id,
                title=title,
                message=message,
                type=type,
                link=link
            )
            notifications.append(notification)

        db.bulk_save_objects(notifications)

        # Log the broadcast operation
        log_audit(
            db, current_user, "broadcast", "notification", None,
            details={
                "title": title,
                "type": type,
                "role": role,
                "recipients_count": len(notifications)
            },
            request=request
        )

        db.commit()

        logger.info(f"Broadcast notification sent to {len(notifications)} users")

        return BaseResponse(message=f"Notification sent to {len(notifications)} users")

    except Exception as e:
        db.rollback()
        logger.error(f"Error broadcasting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
