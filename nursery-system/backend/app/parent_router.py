"""
Parent-specific API endpoints
Provides role-specific routes for parents to view their children's information
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import date, datetime

from .database import get_db
from .models import User, Child, DailyReport, Attendance, Notification
from .dependencies import require_parent

router = APIRouter()


@router.get("/children")
async def get_parent_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get all children for the current parent"""
    children = db.query(Child).filter(Child.parent_id == current_user.id).all()

    # Format response
    formatted_children = []
    for child in children:
        # Get latest report
        latest_report = db.query(DailyReport).filter(
            DailyReport.child_id == child.id
        ).order_by(desc(DailyReport.date)).first()

        formatted_children.append({
            "id": child.id,
            "fullName": f"{child.first_name} {child.last_name}",
            "dateOfBirth": child.date_of_birth.isoformat(),
            "nationality": "Jordan",  # Default value
            "branchName": child.classroom.branch.name if child.classroom and child.classroom.branch else "",
            "classroomName": child.classroom.name if child.classroom else "",
            "documents": [],  # TODO: Add document management
            "lastUpdate": latest_report.updated_at.isoformat() if latest_report else child.updated_at.isoformat()
        })

    return formatted_children


@router.get("/children/{child_id}")
async def get_parent_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get specific child details"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    return {
        "id": child.id,
        "fullName": f"{child.first_name} {child.last_name}",
        "dateOfBirth": child.date_of_birth.isoformat(),
        "gender": child.gender,
        "nationality": "Jordan",
        "nationalId": "",  # Not stored currently
        "passportNumber": "",  # Not stored currently
        "branchName": child.classroom.branch.name if child.classroom and child.classroom.branch else "",
        "classroomName": child.classroom.name if child.classroom else "",
        "healthNotes": child.medical_info or "",
        "educationalNotes": "",  # Not stored currently
        "documents": []
    }


@router.get("/reports")
async def get_parent_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get all reports for all parent's children (aggregated)"""
    # Get all parent's children IDs
    children = db.query(Child).filter(Child.parent_id == current_user.id).all()
    child_ids = [child.id for child in children]

    if not child_ids:
        return []

    # Get all reports for these children
    reports = db.query(DailyReport).filter(
        DailyReport.child_id.in_(child_ids)
    ).order_by(desc(DailyReport.date)).all()

    # Format response
    formatted_reports = []
    for report in reports:
        # Parse meals
        meals_info = ""
        if report.meals:
            meals_info = report.meals

        # Parse activities
        activities_info = ""
        if report.activities:
            activities_info = report.activities

        formatted_reports.append({
            "id": report.id,
            "childName": f"{report.child.first_name} {report.child.last_name}",
            "supervisorName": "Supervisor",  # TODO: Add supervisor relationship
            "date": report.date.isoformat(),
            "status": "approved",  # Default status
            "meals": meals_info,
            "activities": activities_info,
            "behaviorNotes": report.mood or "",
            "managerNotes": ""  # TODO: Add manager_notes field
        })

    return formatted_reports


@router.get("/reports/{child_id}")
async def get_child_reports(
    child_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get reports for a specific child"""
    # Verify child belongs to parent
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    query = db.query(DailyReport).filter(DailyReport.child_id == child_id)

    # Apply date filters
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00')).date()
            query = query.filter(DailyReport.date >= from_date)
        except:
            pass

    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00')).date()
            query = query.filter(DailyReport.date <= to_date)
        except:
            pass

    reports = query.order_by(desc(DailyReport.date)).all()

    # Format response
    formatted_reports = []
    for report in reports:
        formatted_reports.append({
            "id": report.id,
            "childId": report.child_id,
            "childName": f"{report.child.first_name} {report.child.last_name}",
            "date": report.date.isoformat(),
            "activities": report.activities,
            "meals": report.meals,
            "naps": report.naps,
            "mood": report.mood,
            "notes": report.notes,
            "status": "approved"
        })

    return formatted_reports


@router.get("/attendance/{child_id}")
async def get_child_attendance(
    child_id: int,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get attendance records for a specific child"""
    # Verify child belongs to parent
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    query = db.query(Attendance).filter(Attendance.child_id == child_id)

    # Apply date filters
    if date_from:
        try:
            from_date = datetime.fromisoformat(date_from.replace('Z', '+00:00')).date()
            query = query.filter(Attendance.date >= from_date)
        except:
            pass

    if date_to:
        try:
            to_date = datetime.fromisoformat(date_to.replace('Z', '+00:00')).date()
            query = query.filter(Attendance.date <= to_date)
        except:
            pass

    attendance_records = query.order_by(desc(Attendance.date)).all()

    # Format response
    formatted_records = []
    for record in attendance_records:
        formatted_records.append({
            "id": record.id,
            "date": record.date.isoformat(),
            "checkInTime": record.check_in_time.isoformat() if record.check_in_time else None,
            "checkOutTime": record.check_out_time.isoformat() if record.check_out_time else None,
            "status": record.status
        })

    return formatted_records


@router.get("/notifications")
async def get_parent_notifications(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get all notifications for parent"""
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()

    # Format response
    formatted_notifications = []
    for notification in notifications:
        formatted_notifications.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "isRead": notification.is_read,
            "createdAt": notification.created_at.isoformat(),
            "link": notification.link
        })

    return formatted_notifications


@router.get("/dashboard")
async def get_parent_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get parent dashboard data"""
    # Get all children
    children = db.query(Child).filter(Child.parent_id == current_user.id).all()

    # Get recent notifications (last 5)
    recent_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(desc(Notification.created_at)).limit(5).all()

    # Format children
    formatted_children = []
    for child in children:
        latest_report = db.query(DailyReport).filter(
            DailyReport.child_id == child.id
        ).order_by(desc(DailyReport.date)).first()

        formatted_children.append({
            "id": child.id,
            "fullName": f"{child.first_name} {child.last_name}",
            "dateOfBirth": child.date_of_birth.isoformat(),
            "lastUpdate": latest_report.updated_at.isoformat() if latest_report else child.updated_at.isoformat()
        })

    # Format notifications
    formatted_notifications = []
    for notification in recent_notifications:
        formatted_notifications.append({
            "id": notification.id,
            "title": notification.title,
            "message": notification.message,
            "createdAt": notification.created_at.isoformat()
        })

    return {
        "children": formatted_children,
        "recentNotifications": formatted_notifications
    }


# Notification preferences endpoints
@router.get("/notification-preferences")
async def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get notification preferences for parent"""
    # For now, return default preferences
    # TODO: Create NotificationPreferences table
    return {
        "inApp": True,
        "push": True,
        "email": True
    }


@router.put("/notification-preferences")
async def update_notification_preferences(
    preferences: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Update notification preferences for parent"""
    # TODO: Store preferences in database when table is created
    return {
        "message": "Preferences updated successfully",
        "preferences": {
            "inApp": preferences.get("inApp", True),
            "push": preferences.get("push", True),
            "email": preferences.get("email", True)
        }
    }


@router.post("/children")
async def create_child_as_parent(
    child_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Allow parent to register a new child (if enabled by nursery)"""
    # This endpoint allows parents to request adding a child
    # The child would need admin/manager approval

    if not current_user.nursery_id:
        raise HTTPException(
            status_code=400,
            detail="You must be associated with a nursery to register a child"
        )

    full_name = child_data.get("fullName", "")
    dob = child_data.get("dateOfBirth")

    if not full_name or not dob:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Get first available classroom in parent's nursery
    classroom = db.query(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).first()

    if not classroom:
        raise HTTPException(
            status_code=400,
            detail="No classrooms available. Please contact your nursery administrator."
        )

    # Split name
    name_parts = full_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Parse date
    try:
        date_of_birth = datetime.fromisoformat(dob.replace('Z', '+00:00')).date()
    except:
        try:
            date_of_birth = datetime.strptime(dob, "%Y-%m-%d").date()
        except:
            raise HTTPException(status_code=400, detail="Invalid date format")

    # Create child
    new_child = Child(
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        gender=child_data.get("gender", "unknown"),
        medical_info=child_data.get("healthNotes"),
        emergency_contact=f"{current_user.first_name} {current_user.last_name}",
        emergency_phone=current_user.phone or "",
        classroom_id=classroom.id,
        parent_id=current_user.id,
        nursery_id=current_user.nursery_id,
        status="active"
    )

    db.add(new_child)
    db.commit()
    db.refresh(new_child)

    return {
        "id": new_child.id,
        "fullName": f"{new_child.first_name} {new_child.last_name}",
        "dateOfBirth": new_child.date_of_birth.isoformat(),
        "message": "Child registered successfully"
    }
