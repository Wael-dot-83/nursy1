"""
Supervisor-specific API endpoints
Provides role-specific routes for supervisors
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional, Dict, Any
from datetime import date, datetime

from .database import get_db
from .models import User, Child, Classroom, Branch, DailyReport, Attendance
from .dependencies import require_supervisor

router = APIRouter()


@router.get("/children")
async def get_supervisor_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Get children assigned to supervisor (currently all children in nursery)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).all()

    # Format response
    formatted_children = []
    for child in children:
        formatted_children.append({
            "id": child.id,
            "fullName": f"{child.first_name} {child.last_name}",
            "dateOfBirth": child.date_of_birth.isoformat(),
            "parentNames": f"{child.parent.first_name} {child.parent.last_name}" if child.parent else "",
            "classroom": child.classroom.name if child.classroom else "",
            "branch": child.classroom.branch.name if child.classroom and child.classroom.branch else ""
        })

    return formatted_children


@router.get("/reports")
async def get_supervisor_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Get all reports created in supervisor's nursery"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    reports = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).order_by(desc(DailyReport.date)).all()

    # Format response
    formatted_reports = []
    for report in reports:
        # Parse activities if stored as text
        activities = []
        if report.activities:
            activities = report.activities.split("\n") if "\n" in report.activities else [report.activities]

        formatted_reports.append({
            "id": report.id,
            "childName": f"{report.child.first_name} {report.child.last_name}",
            "childId": report.child_id,
            "date": report.date.isoformat(),
            "status": "submitted",  # Default status
            "activities": activities,
            "managerNotes": "",  # TODO: Add manager_notes field
            "mood": report.mood
        })

    return formatted_reports


@router.post("/reports")
async def create_supervisor_report(
    report_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Create a new daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    child_id = report_data.get("childId")
    report_date = report_data.get("date")

    if not child_id or not report_date:
        raise HTTPException(status_code=400, detail="Missing required fields: childId and date")

    # Verify child belongs to supervisor's nursery
    child = db.query(Child).join(Classroom).join(Branch).filter(
        Child.id == child_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found in your nursery")

    # Parse date
    try:
        parsed_date = datetime.fromisoformat(report_date.replace('Z', '+00:00')).date()
    except:
        try:
            parsed_date = datetime.strptime(report_date, "%Y-%m-%d").date()
        except:
            raise HTTPException(status_code=400, detail="Invalid date format")

    # Check if report already exists for this child and date
    existing = db.query(DailyReport).filter(
        DailyReport.child_id == child_id,
        DailyReport.date == parsed_date
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="Report already exists for this child on this date")

    # Process attendance data if provided
    attendance_data = report_data.get("attendance", {})
    if attendance_data and (attendance_data.get("checkInTime") or attendance_data.get("status")):
        # Create or update attendance record
        attendance = db.query(Attendance).filter(
            Attendance.child_id == child_id,
            Attendance.date == parsed_date
        ).first()

        if not attendance:
            attendance = Attendance(
                child_id=child_id,
                date=parsed_date,
                status=attendance_data.get("status", "present")
            )
            db.add(attendance)

        # Set check-in time if provided
        if attendance_data.get("checkInTime"):
            try:
                check_in_str = attendance_data["checkInTime"]
                attendance.check_in_time = datetime.strptime(check_in_str, "%H:%M").time()
            except:
                pass

        # Set check-out time if provided
        if attendance_data.get("checkOutTime"):
            try:
                check_out_str = attendance_data["checkOutTime"]
                attendance.check_out_time = datetime.strptime(check_out_str, "%H:%M").time()
            except:
                pass

    # Process meals data
    meals_text = ""
    meals = report_data.get("meals", {})
    if meals:
        meal_parts = []
        if meals.get("breakfast"):
            meal_parts.append(f"Breakfast: {meals['breakfast']}")
        if meals.get("lunch"):
            meal_parts.append(f"Lunch: {meals['lunch']}")
        if meals.get("snacks") and isinstance(meals["snacks"], list):
            for snack in meals["snacks"]:
                meal_parts.append(f"Snack: {snack}")
        meals_text = "\n".join(meal_parts)

    # Process sleep periods
    naps_text = ""
    sleep_periods = report_data.get("sleepPeriods", [])
    if sleep_periods and isinstance(sleep_periods, list):
        nap_parts = []
        for sleep in sleep_periods:
            quality = sleep.get("quality", "good")
            start = sleep.get("startTime", "")
            end = sleep.get("endTime", "")
            nap_parts.append(f"{start}-{end} ({quality})")
        naps_text = "\n".join(nap_parts)

    # Process activities
    activities_text = ""
    activities = report_data.get("activities", [])
    if activities and isinstance(activities, list):
        activity_parts = []
        for activity in activities:
            if isinstance(activity, dict):
                title = activity.get("title", "")
                desc = activity.get("description", "")
                activity_parts.append(f"{title}: {desc}" if desc else title)
            else:
                activity_parts.append(str(activity))
        activities_text = "\n".join(activity_parts)

    # Create daily report
    new_report = DailyReport(
        child_id=child_id,
        date=parsed_date,
        activities=activities_text,
        meals=meals_text,
        naps=naps_text,
        mood=report_data.get("behaviorNotes", ""),
        notes=report_data.get("healthObservations", "")
    )

    db.add(new_report)
    db.commit()
    db.refresh(new_report)

    return {
        "id": new_report.id,
        "childId": new_report.child_id,
        "date": new_report.date.isoformat(),
        "message": "Report created successfully"
    }


@router.put("/reports/{report_id}")
async def update_supervisor_report(
    report_id: int,
    report_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Update an existing daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify report belongs to supervisor's nursery
    report = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        DailyReport.id == report_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update meals if provided
    if "meals" in report_data:
        meals = report_data["meals"]
        meal_parts = []
        if meals.get("breakfast"):
            meal_parts.append(f"Breakfast: {meals['breakfast']}")
        if meals.get("lunch"):
            meal_parts.append(f"Lunch: {meals['lunch']}")
        if meals.get("snacks") and isinstance(meals["snacks"], list):
            for snack in meals["snacks"]:
                meal_parts.append(f"Snack: {snack}")
        report.meals = "\n".join(meal_parts)

    # Update sleep periods if provided
    if "sleepPeriods" in report_data:
        sleep_periods = report_data["sleepPeriods"]
        if isinstance(sleep_periods, list):
            nap_parts = []
            for sleep in sleep_periods:
                quality = sleep.get("quality", "good")
                start = sleep.get("startTime", "")
                end = sleep.get("endTime", "")
                nap_parts.append(f"{start}-{end} ({quality})")
            report.naps = "\n".join(nap_parts)

    # Update activities if provided
    if "activities" in report_data:
        activities = report_data["activities"]
        if isinstance(activities, list):
            activity_parts = []
            for activity in activities:
                if isinstance(activity, dict):
                    title = activity.get("title", "")
                    desc = activity.get("description", "")
                    activity_parts.append(f"{title}: {desc}" if desc else title)
                else:
                    activity_parts.append(str(activity))
            report.activities = "\n".join(activity_parts)

    # Update health observations
    if "healthObservations" in report_data:
        report.notes = report_data["healthObservations"]

    # Update behavior notes
    if "behaviorNotes" in report_data:
        report.mood = report_data["behaviorNotes"]

    db.commit()
    db.refresh(report)

    return {
        "id": report.id,
        "message": "Report updated successfully"
    }


@router.get("/dashboard")
async def get_supervisor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Get dashboard data for supervisor"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Get total children in nursery
    total_children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).count()

    # Get today's attendance count
    today = date.today()
    present_today = db.query(Attendance).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Attendance.date == today,
        Attendance.status == "present"
    ).count()

    # Get reports created this week
    from datetime import timedelta
    week_ago = today - timedelta(days=7)
    reports_this_week = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        DailyReport.date >= week_ago
    ).count()

    return {
        "totalChildren": total_children,
        "presentToday": present_today,
        "reportsThisWeek": reports_this_week
    }
