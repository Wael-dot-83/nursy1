"""
Business logic validators and constraints
"""
from datetime import datetime, date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import and_
from fastapi import HTTPException, status

from .models import Child, Classroom, Nursery, Attendance, User


def validate_child_age_for_nursery(
    date_of_birth: date,
    nursery_id: int,
    db: Session
) -> None:
    """Validate that child's age is within nursery's accepted age range"""
    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()

    if not nursery:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Nursery not found"
        )

    # Calculate child's age in months
    today = date.today()
    age_in_months = (today.year - date_of_birth.year) * 12 + (today.month - date_of_birth.month)

    # Check if within range (assuming age_range has minAge in days and maxAge in months)
    if nursery.age_range:
        min_age_months = nursery.age_range.get('minAge', 0) // 30  # Convert days to months roughly
        max_age_months = nursery.age_range.get('maxAge', 999)

        if age_in_months < min_age_months or age_in_months > max_age_months:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Child age ({age_in_months} months) is outside nursery's accepted age range ({min_age_months}-{max_age_months} months)"
            )


def validate_classroom_capacity(
    classroom_id: int,
    db: Session,
    exclude_child_id: Optional[int] = None
) -> None:
    """Validate that classroom is not over capacity"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()

    if not classroom:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Classroom not found"
        )

    # Count current children in classroom
    query = db.query(Child).filter(
        Child.classroom_id == classroom_id,
        Child.status == "active"
    )

    if exclude_child_id:
        query = query.filter(Child.id != exclude_child_id)

    current_count = query.count()

    if current_count >= classroom.capacity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Classroom is at full capacity ({classroom.capacity}). Cannot add more children."
        )


def validate_attendance_date(attendance_date: date) -> None:
    """Validate that attendance date is not in the future"""
    if attendance_date > date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create attendance records for future dates"
        )


def validate_no_duplicate_attendance(
    child_id: int,
    attendance_date: date,
    db: Session,
    exclude_attendance_id: Optional[int] = None
) -> None:
    """Validate that no duplicate attendance record exists"""
    query = db.query(Attendance).filter(
        Attendance.child_id == child_id,
        Attendance.date == attendance_date
    )

    if exclude_attendance_id:
        query = query.filter(Attendance.id != exclude_attendance_id)

    existing = query.first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Attendance record already exists for this child on {attendance_date}"
        )


def validate_checkout_after_checkin(
    check_in_time: Optional[datetime],
    check_out_time: Optional[datetime]
) -> None:
    """Validate that checkout time is after checkin time"""
    if check_in_time and check_out_time:
        if check_out_time <= check_in_time:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Check-out time must be after check-in time"
            )


def validate_phone_number(phone: str) -> None:
    """Validate phone number format"""
    import re

    # Remove common separators
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)

    # Check if it's all digits and within valid length
    if not cleaned.isdigit() or len(cleaned) < 10 or len(cleaned) > 15:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid phone number format. Must be 10-15 digits."
        )


def validate_emergency_contact(emergency_contact: dict) -> None:
    """Validate emergency contact information"""
    required_fields = ['name', 'relationship', 'phone']

    for field in required_fields:
        if field not in emergency_contact or not emergency_contact[field]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Emergency contact must include {field}"
            )

    # Validate emergency contact phone
    validate_phone_number(emergency_contact['phone'])


def validate_user_nursery_assignment(
    user_id: int,
    nursery_id: int,
    db: Session
) -> None:
    """Validate that user is assigned to the correct nursery"""
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if user.role.value not in ['admin'] and user.nursery_id != nursery_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is not assigned to this nursery"
        )


def validate_password_strength(password: str) -> None:
    """Validate password strength"""
    if len(password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters long"
        )

    # Check for at least one number
    if not any(char.isdigit() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one number"
        )

    # Check for at least one uppercase letter
    if not any(char.isupper() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one uppercase letter"
        )

    # Check for at least one lowercase letter
    if not any(char.islower() for char in password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must contain at least one lowercase letter"
        )


def validate_date_range(
    start_date: Optional[date],
    end_date: Optional[date]
) -> None:
    """Validate date range"""
    if start_date and end_date:
        if end_date < start_date:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="End date must be after start date"
            )
