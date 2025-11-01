from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case, and_
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from .database import get_db
from .models import User, Nursery, Child, Attendance, DailyReport, RoleEnum, ChildStatus
from .dependencies import require_admin
from .schemas import UserResponse

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/analytics")
async def get_admin_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get comprehensive analytics data for admin dashboard"""

    try:
        # Basic counts
        total_nurseries = db.query(Nursery).count()
        total_users = db.query(User).count()
        total_children = db.query(Child).filter(Child.status == ChildStatus.ACTIVE).count()

        # Active nurseries (nurseries with active children)
        active_nurseries = db.query(Nursery).join(Child).filter(Child.status == ChildStatus.ACTIVE).distinct().count()

        # Pending reports (daily reports from last 7 days that might need review)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        pending_reports = db.query(DailyReport).filter(DailyReport.created_at >= seven_days_ago).count()

        # Users by role
        users_by_role = db.query(
            User.role,
            func.count(User.id).label('count')
        ).group_by(User.role).all()

        users_by_role_data = [
            {"role": role.value if hasattr(role, 'value') else str(role), "count": count}
            for role, count in users_by_role
        ]

        today = datetime.utcnow().date()
        one_year_ago = today - timedelta(days=365)
        three_years_ago = today - timedelta(days=365 * 3)
        five_years_ago = today - timedelta(days=365 * 5)

        age_bucket_query = db.query(
            func.coalesce(
                func.sum(
                    case((Child.date_of_birth >= one_year_ago, 1), else_=0)
                ),
                0,
            ).label("age_0_1"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                Child.date_of_birth < one_year_ago,
                                Child.date_of_birth >= three_years_ago,
                            ),
                            1,
                        ),
                    ),
                    else_=0,
                ),
                0,
            ).label("age_1_3"),
            func.coalesce(
                func.sum(
                    case(
                        (
                            and_(
                                Child.date_of_birth < three_years_ago,
                                Child.date_of_birth >= five_years_ago,
                            ),
                            1,
                        ),
                    ),
                    else_=0,
                ),
                0,
            ).label("age_3_5"),
            func.coalesce(
                func.sum(
                    case(
                        (Child.date_of_birth < five_years_ago, 1),
                    ),
                    else_=0,
                ),
                0,
            ).label("age_5_plus"),
        ).filter(Child.status == ChildStatus.ACTIVE)

        age_counts = age_bucket_query.one()
        children_by_age_group = [
            {"age_group": "0-1 years", "count": int(age_counts.age_0_1 or 0)},
            {"age_group": "1-3 years", "count": int(age_counts.age_1_3 or 0)},
            {"age_group": "3-5 years", "count": int(age_counts.age_3_5 or 0)},
            {"age_group": "5+ years", "count": int(age_counts.age_5_plus or 0)},
        ]

        governorate_rows = (
            db.query(
                func.coalesce(
                    func.nullif(func.trim(Nursery.main_governorate), ""),
                    "Unspecified",
                ).label("governorate"),
                func.count(Nursery.id).label("count"),
            )
            .group_by("governorate")
            .all()
        )
        nurseries_by_governorate = [
            {"governorate": row.governorate, "count": row.count}
            for row in governorate_rows
        ]

        # Recent logins (users who have logged in recently)
        recent_logins = db.query(User).filter(
            User.updated_at >= (datetime.utcnow() - timedelta(days=30))
        ).limit(10).all()

        recent_logins_data = [
            {
                "id": user.id,
                "fullName": f"{user.first_name} {user.last_name}",
                "email": user.email,
                "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
                "lastLogin": user.updated_at.isoformat() if user.updated_at else None
            }
            for user in recent_logins
        ]

        response = {
            "totalNurseries": total_nurseries,
            "activeNurseries": active_nurseries,
            "totalUsers": total_users,
            "totalChildren": total_children,
            "pendingReports": pending_reports,
            "usersByRole": users_by_role_data,
            "childrenByAgeGroup": children_by_age_group,
            "nurseriesByGovernorate": nurseries_by_governorate,
            "recentLogins": recent_logins_data
        }
        return response
    except Exception as e:
        logger.exception("Failed to compute admin analytics")
        raise HTTPException(
            status_code=500,
            detail={
                "code": "ANALYTICS_ERROR",
                "message": "Failed to compute analytics summary",
            },
        )

@router.get("/system-health")
async def get_system_health(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get system health metrics"""

    # Database connection check
    try:
        db.execute("SELECT 1")
        db_health = "healthy"
    except Exception as e:
        db_health = f"unhealthy: {str(e)}"

    # User statistics
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()

    # Nursery statistics
    total_nurseries = db.query(Nursery).count()

    # Children statistics
    total_children = db.query(Child).count()
    active_children = db.query(Child).filter(Child.status == ChildStatus.ACTIVE).count()

    # Recent activity (last 24 hours)
    yesterday = datetime.utcnow() - timedelta(days=1)
    recent_attendance = db.query(Attendance).filter(Attendance.created_at >= yesterday).count()
    recent_reports = db.query(DailyReport).filter(DailyReport.created_at >= yesterday).count()

    return {
        "database": db_health,
        "timestamp": datetime.utcnow().isoformat(),
        "metrics": {
            "users": {
                "total": total_users,
                "active": active_users,
                "inactive": total_users - active_users
            },
            "nurseries": {
                "total": total_nurseries
            },
            "children": {
                "total": total_children,
                "active": active_children,
                "inactive": total_children - active_children
            },
            "activity_24h": {
                "attendance_records": recent_attendance,
                "daily_reports": recent_reports
            }
        }
    }
