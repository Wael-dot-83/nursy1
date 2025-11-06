
"""
Parent-specific API endpoints
Provides role-specific routes for parents to view their children's information
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, contains_eager
from sqlalchemy import func
from typing import List, Optional
from datetime import date, datetime

from .database import get_db
from .dependencies import require_parent
from .models import User, Child, DailyReport, Attendance, Notification, Classroom

router = APIRouter()


@router.get("/children")
async def get_parent_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """
    Get all children for the current parent.
    Uses eager loading to prevent N+1 query issues.
    """
    # Subquery to find the latest report for each child
    latest_report_sq = db.query(
        DailyReport.child_id,
        func.max(DailyReport.date).label('latest_date')
    ).group_by(DailyReport.child_id).subquery('latest_report_sq')

    # Optimized query to fetch children with their classroom, branch, nursery,
    # and the latest daily report in a single database call.
    children_with_reports = db.query(Child, DailyReport).options(
        joinedload(Child.classroom).joinedload(Classroom.branch),
        joinedload(Child.nursery)
    ).outerjoin(
        latest_report_sq, Child.id == latest_report_sq.c.child_id
    ).outerjoin(
        DailyReport,
        (Child.id == DailyReport.child_id) &
        (DailyReport.date == latest_report_sq.c.latest_date)
    ).filter(
        Child.parent_id == current_user.id
    ).all()

    if not children_with_reports:
        return []

    # Format response
    formatted_children = []
    for child, latest_report in children_with_reports:
        formatted_children.append({
            "id": child.id,
            "first_name": child.first_name,
            "last_name": child.last_name,
            "date_of_birth": child.date_of_birth.isoformat(),
            "gender": child.gender,
            "status": child.status.value if hasattr(child.status, 'value') else child.status,
            "classroom": {
                "id": child.classroom.id,
                "name": child.classroom.name,
                "branch_name": child.classroom.branch.name if child.classroom.branch else None
            } if child.classroom else None,
            "nursery": {
                "id": child.nursery.id,
                "name": child.nursery.name
            } if child.nursery else None,
            "last_report_date": latest_report.date.isoformat() if latest_report else None
        })

    return formatted_children
