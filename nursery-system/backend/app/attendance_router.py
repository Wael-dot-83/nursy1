from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date, datetime, time
from .database import get_db
from .models import Attendance, Child, User, Classroom, Branch
from .schemas import (
    AttendanceResponse, AttendanceCreate, AttendanceUpdate,
    BaseResponse, AttendanceStats
)
from .dependencies import require_admin, require_manager, require_supervisor, require_parent
from .audit_helper import log_create, log_update, log_delete

router = APIRouter()

@router.get("/", response_model=List[AttendanceResponse])
async def get_attendance(
    skip: int = 0,
    limit: int = 100,
    child_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all attendance records with optional filtering (Admin only)"""
    query = db.query(Attendance)

    if child_id:
        query = query.filter(Attendance.child_id == child_id)
    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    if status:
        query = query.filter(Attendance.status == status)

    attendance = query.order_by(Attendance.date.desc()).offset(skip).limit(limit).all()
    return attendance

@router.post("/", response_model=AttendanceResponse)
async def create_attendance(
    attendance: AttendanceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create attendance record (Admin only)"""
    # Verify child exists
    child = db.query(Child).filter(Child.id == attendance.child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Check if attendance already exists for this child and date
    existing = db.query(Attendance).filter(
        Attendance.child_id == attendance.child_id,
        Attendance.date == attendance.date
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Attendance already recorded for this child on this date")

    # Create attendance record
    db_attendance = Attendance(**attendance.dict())
    db.add(db_attendance)
    db.flush()

    # Log the attendance creation
    log_create(
        db, current_user, "attendance", db_attendance.id,
        details={
            "child_id": db_attendance.child_id,
            "date": str(db_attendance.date),
            "status": db_attendance.status
        },
        request=request
    )

    db.commit()
    db.refresh(db_attendance)
    return db_attendance

@router.get("/{attendance_id}", response_model=AttendanceResponse)
async def get_attendance_record(
    attendance_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get attendance record by ID (Admin only)"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    return attendance

@router.put("/{attendance_id}", response_model=AttendanceResponse)
async def update_attendance(
    attendance_id: int,
    attendance_update: AttendanceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update attendance record (Admin only)"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Track changes
    changes = attendance_update.dict(exclude_unset=True)

    # Update fields
    for field, value in changes.items():
        setattr(attendance, field, value)

    # Log the attendance update
    if changes:
        log_update(
            db, current_user, "attendance", attendance_id,
            details={"changes": changes, "child_id": attendance.child_id},
            request=request
        )

    db.commit()
    db.refresh(attendance)
    return attendance

@router.delete("/{attendance_id}", response_model=BaseResponse)
async def delete_attendance(
    attendance_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete attendance record (Admin only)"""
    attendance = db.query(Attendance).filter(Attendance.id == attendance_id).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")

    # Log the deletion before removing
    log_delete(
        db, current_user, "attendance", attendance_id,
        details={
            "child_id": attendance.child_id,
            "date": str(attendance.date),
            "status": attendance.status
        },
        request=request
    )

    db.delete(attendance)
    db.commit()
    return BaseResponse(message="Attendance record deleted successfully")

# Manager/Supervisor endpoints for their nursery
@router.get("/my-nursery/", response_model=List[AttendanceResponse])
async def get_my_nursery_attendance(
    skip: int = 0,
    limit: int = 100,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get attendance records for manager's nursery (Manager/Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    query = db.query(Attendance).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    )

    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)
    if status:
        query = query.filter(Attendance.status == status)

    attendance = query.order_by(Attendance.date.desc()).offset(skip).limit(limit).all()
    return attendance

@router.post("/check-in/{child_id}")
async def check_in_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Check in a child (Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify child belongs to supervisor's nursery
    child = db.query(Child).join(Classroom).join(Branch).filter(
        Child.id == child_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found in your nursery")

    today = date.today()

    # Get or create attendance record
    attendance = db.query(Attendance).filter(
        Attendance.child_id == child_id,
        Attendance.date == today
    ).first()

    if attendance:
        if attendance.check_in_time:
            raise HTTPException(status_code=400, detail="Child already checked in today")
        attendance.check_in_time = datetime.now().time()
        attendance.status = "present"
    else:
        attendance = Attendance(
            child_id=child_id,
            date=today,
            check_in_time=datetime.now().time(),
            status="present"
        )
        db.add(attendance)

    db.commit()
    db.refresh(attendance)
    return {"message": "Child checked in successfully", "attendance": attendance}

@router.post("/check-out/{child_id}")
async def check_out_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Check out a child (Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify child belongs to supervisor's nursery
    child = db.query(Child).join(Classroom).join(Branch).filter(
        Child.id == child_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found in your nursery")

    today = date.today()

    # Get attendance record
    attendance = db.query(Attendance).filter(
        Attendance.child_id == child_id,
        Attendance.date == today
    ).first()

    if not attendance:
        raise HTTPException(status_code=400, detail="No attendance record found for today")

    if attendance.check_out_time:
        raise HTTPException(status_code=400, detail="Child already checked out today")

    attendance.check_out_time = datetime.now().time()
    db.commit()
    db.refresh(attendance)
    return {"message": "Child checked out successfully", "attendance": attendance}

# Parent endpoints
@router.get("/parent/{child_id}", response_model=List[AttendanceResponse])
async def get_child_attendance(
    child_id: int,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get attendance records for parent's child (Parent only)"""
    # Verify child belongs to parent
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    query = db.query(Attendance).filter(Attendance.child_id == child_id)

    if date_from:
        query = query.filter(Attendance.date >= date_from)
    if date_to:
        query = query.filter(Attendance.date <= date_to)

    attendance = query.order_by(Attendance.date.desc()).all()
    return attendance

# Statistics endpoints
@router.get("/stats/daily", response_model=AttendanceStats)
async def get_daily_attendance_stats(
    target_date: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get daily attendance statistics (Manager/Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    if not target_date:
        target_date = date.today()

    # Get attendance counts for the nursery
    attendance_counts = db.query(
        Attendance.status,
        db.func.count(Attendance.id)
    ).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        Attendance.date == target_date
    ).group_by(Attendance.status).all()

    stats = {"date": target_date, "present": 0, "absent": 0, "late": 0, "total": 0}

    for status_val, count in attendance_counts:
        if status_val == "present":
            stats["present"] = count
        elif status_val == "absent":
            stats["absent"] = count
        elif status_val == "late":
            stats["late"] = count
        stats["total"] += count

    return stats