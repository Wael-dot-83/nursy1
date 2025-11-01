from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime
from .database import get_db
from .models import DailyReport, Child, User, Classroom, Branch, Attendance
from .schemas import (
    DailyReportResponse, DailyReportCreate, DailyReportUpdate,
    BaseResponse, ChildStats, NurseryStats
)
from .dependencies import require_admin, require_manager, require_supervisor, require_parent
from .audit_helper import log_create, log_update, log_delete

router = APIRouter()

@router.get("/", response_model=List[DailyReportResponse])
async def get_daily_reports(
    skip: int = 0,
    limit: int = 100,
    child_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all daily reports with optional filtering (Admin only)"""
    query = db.query(DailyReport)

    if child_id:
        query = query.filter(DailyReport.child_id == child_id)
    if date_from:
        query = query.filter(DailyReport.date >= date_from)
    if date_to:
        query = query.filter(DailyReport.date <= date_to)

    reports = query.order_by(DailyReport.date.desc()).offset(skip).limit(limit).all()
    return reports

@router.post("/", response_model=DailyReportResponse)
async def create_daily_report(
    report: DailyReportCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create daily report (Admin only)"""
    # Verify child exists
    child = db.query(Child).filter(Child.id == report.child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Check if report already exists for this child and date
    existing = db.query(DailyReport).filter(
        DailyReport.child_id == report.child_id,
        DailyReport.date == report.date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Daily report already exists for this child on this date")

    # Create daily report
    db_report = DailyReport(**report.dict())
    db.add(db_report)
    db.flush()

    # Log the daily report creation
    log_create(
        db, current_user, "daily_report", db_report.id,
        details={
            "child_id": db_report.child_id,
            "date": str(db_report.date)
        },
        request=request
    )

    db.commit()
    db.refresh(db_report)
    return db_report

@router.get("/{report_id}", response_model=DailyReportResponse)
async def get_daily_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get daily report by ID (Admin only)"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")
    return report

@router.put("/{report_id}", response_model=DailyReportResponse)
async def update_daily_report(
    report_id: int,
    report_update: DailyReportUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update daily report (Admin only)"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")

    # Track changes
    changes = report_update.dict(exclude_unset=True)

    # Update fields
    for field, value in changes.items():
        setattr(report, field, value)

    # Log the daily report update
    if changes:
        log_update(
            db, current_user, "daily_report", report_id,
            details={"changes": changes, "child_id": report.child_id},
            request=request
        )

    db.commit()
    db.refresh(report)
    return report

@router.delete("/{report_id}", response_model=BaseResponse)
async def delete_daily_report(
    report_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete daily report (Admin only)"""
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")

    # Log the deletion before removing
    log_delete(
        db, current_user, "daily_report", report_id,
        details={
            "child_id": report.child_id,
            "date": str(report.date)
        },
        request=request
    )

    db.delete(report)
    db.commit()
    return BaseResponse(message="Daily report deleted successfully")

# Supervisor endpoints for their nursery
@router.get("/my-nursery/", response_model=List[DailyReportResponse])
async def get_my_nursery_reports(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Get daily reports for supervisor's nursery (Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    query = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    )

    if date_from:
        query = query.filter(DailyReport.date >= date_from)
    if date_to:
        query = query.filter(DailyReport.date <= date_to)

    reports = query.order_by(DailyReport.date.desc()).offset(skip).limit(limit).all()
    return reports

@router.post("/child/{child_id}")
async def create_child_report(
    child_id: int,
    report: DailyReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Create daily report for a child (Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify child belongs to supervisor's nursery
    child = db.query(Child).join(Classroom).join(Branch).filter(
        Child.id == child_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found in your nursery")

    # Ensure report is for the correct child
    if report.child_id != child_id:
        raise HTTPException(status_code=400, detail="Report child_id does not match URL parameter")

    # Check if report already exists
    existing = db.query(DailyReport).filter(
        DailyReport.child_id == child_id,
        DailyReport.date == report.date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Daily report already exists for this child on this date")

    # Create daily report
    db_report = DailyReport(**report.dict())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report

@router.put("/child/{child_id}/date/{report_date}")
async def update_child_report(
    child_id: int,
    report_date: date,
    report_update: DailyReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Update daily report for a child (Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify child belongs to supervisor's nursery
    child = db.query(Child).join(Classroom).join(Branch).filter(
        Child.id == child_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found in your nursery")

    # Get existing report
    report = db.query(DailyReport).filter(
        DailyReport.child_id == child_id,
        DailyReport.date == report_date
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Daily report not found")

    # Update fields
    for field, value in report_update.dict(exclude_unset=True).items():
        setattr(report, field, value)

    db.commit()
    db.refresh(report)
    return report

# Parent endpoints
@router.get("/parent/{child_id}", response_model=List[DailyReportResponse])
async def get_child_reports(
    child_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get daily reports for parent's child (Parent only)"""
    # Verify child belongs to parent
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    query = db.query(DailyReport).filter(DailyReport.child_id == child_id)

    if date_from:
        query = query.filter(DailyReport.date >= date_from)
    if date_to:
        query = query.filter(DailyReport.date <= date_to)

    reports = query.order_by(DailyReport.date.desc()).all()
    return reports

# Statistics and analytics endpoints
@router.get("/stats/nursery", response_model=NurseryStats)
async def get_nursery_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get nursery statistics (Manager only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Get basic counts
    total_children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).count()

    total_staff = db.query(User).filter(
        User.nursery_id == current_user.nursery_id,
        User.role.in_(["manager", "supervisor"])
    ).count()

    total_classrooms = db.query(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).count()

    # Get today's attendance
    today = date.today()
    present_today = db.query(Attendance).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Attendance.date == today,
        Attendance.status == "present"
    ).count()

    absent_today = db.query(Attendance).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Attendance.date == today,
        Attendance.status == "absent"
    ).count()

    return {
        "total_children": total_children,
        "total_staff": total_staff,
        "total_classrooms": total_classrooms,
        "present_today": present_today,
        "absent_today": absent_today
    }

@router.get("/stats/children", response_model=ChildStats)
async def get_children_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get children statistics (Manager only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Get basic counts
    total_children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).count()

    active_children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Child.status == "active"
    ).count()

    # Get children by classroom
    classroom_counts = db.query(
        Classroom.name,
        db.func.count(Child.id)
    ).join(Child).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).group_by(Classroom.name).all()

    by_classroom = {name: count for name, count in classroom_counts}

    # Calculate attendance rate (last 30 days)
    thirty_days_ago = date.today().replace(day=date.today().day - 30) if date.today().day > 30 else date.today().replace(month=date.today().month - 1, day=1)

    total_attendance_records = db.query(Attendance).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Attendance.date >= thirty_days_ago
    ).count()

    present_records = db.query(Attendance).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Attendance.date >= thirty_days_ago,
        Attendance.status == "present"
    ).count()

    attendance_rate = (present_records / total_attendance_records * 100) if total_attendance_records > 0 else 0.0

    return {
        "total_children": total_children,
        "active_children": active_children,
        "by_classroom": by_classroom,
        "attendance_rate": round(attendance_rate, 2)
    }