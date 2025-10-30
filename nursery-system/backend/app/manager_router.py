"""
Manager-specific API endpoints
Provides role-specific routes that wrap existing generic endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import List, Optional, Dict, Any
from datetime import date, datetime, timedelta

from .database import get_db
from .models import User, Nursery, Branch, Child, Classroom, DailyReport, Attendance, RoleEnum
from .schemas import UserResponse, BaseResponse
from .dependencies import require_manager

router = APIRouter()


@router.get("/dashboard")
async def get_manager_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get dashboard analytics for manager's nursery"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Get total children
    total_children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).count()

    # Get total supervisors
    total_supervisors = db.query(User).filter(
        User.nursery_id == current_user.nursery_id,
        User.role == RoleEnum.SUPERVISOR,
        User.is_active == True
    ).count()

    # Get pending reports (reports created in last 7 days)
    seven_days_ago = date.today() - timedelta(days=7)
    pending_reports = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id,
        DailyReport.date >= seven_days_ago
    ).count()

    # Get approved reports (for now, same as pending since we don't have status field yet)
    approved_reports = pending_reports  # TODO: Update when status field is added

    # Get recent reports (last 5)
    recent_reports = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).order_by(desc(DailyReport.date)).limit(5).all()

    # Format recent reports
    formatted_reports = []
    for report in recent_reports:
        formatted_reports.append({
            "id": report.id,
            "childName": f"{report.child.first_name} {report.child.last_name}",
            "date": report.date.isoformat(),
            "status": "submitted",  # Default status
            "supervisorName": "Supervisor"  # TODO: Add supervisor relationship
        })

    return {
        "totalChildren": total_children,
        "totalSupervisors": total_supervisors,
        "pendingReports": pending_reports,
        "approvedReports": approved_reports,
        "recentReports": formatted_reports
    }


@router.get("/nurseries")
async def get_manager_nursery(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get manager's nursery information"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    nursery = db.query(Nursery).filter(Nursery.id == current_user.nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    return {
        "id": nursery.id,
        "name": nursery.name,
        "phone": nursery.main_phone,
        "email": nursery.email,
        "address": {
            "street": nursery.main_street,
            "city": nursery.main_city,
            "governorate": nursery.main_governorate,
            "postalCode": nursery.main_postal_code
        }
    }


@router.put("/nurseries/{nursery_id}")
async def update_manager_nursery(
    nursery_id: int,
    nursery_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update manager's nursery information"""
    if not current_user.nursery_id or current_user.nursery_id != nursery_id:
        raise HTTPException(status_code=403, detail="Cannot update this nursery")

    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    # Update fields
    if "phone" in nursery_data:
        nursery.main_phone = nursery_data["phone"]
    if "email" in nursery_data:
        nursery.email = nursery_data["email"]
    if "address" in nursery_data:
        address = nursery_data["address"]
        nursery.main_street = address.get("street")
        nursery.main_city = address.get("city")
        nursery.main_governorate = address.get("governorate")
        nursery.main_postal_code = address.get("postalCode")

    db.commit()
    db.refresh(nursery)

    return {
        "id": nursery.id,
        "name": nursery.name,
        "phone": nursery.main_phone,
        "email": nursery.email,
        "address": {
            "street": nursery.main_street,
            "city": nursery.main_city,
            "governorate": nursery.main_governorate,
            "postalCode": nursery.main_postal_code
        }
    }


@router.get("/children")
async def get_manager_children(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get all children in manager's nursery"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).offset(skip).limit(limit).all()

    # Format response
    formatted_children = []
    for child in children:
        formatted_children.append({
            "id": child.id,
            "fullName": f"{child.first_name} {child.last_name}",
            "dateOfBirth": child.date_of_birth.isoformat(),
            "isActive": child.status == "active",
            "parentName": f"{child.parent.first_name} {child.parent.last_name}" if child.parent else "",
            "parentEmail": child.parent.email if child.parent else "",
            "documents": []  # TODO: Add document management
        })

    return formatted_children


@router.post("/parents")
async def create_parent(
    parent_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new parent user"""
    from .security import hash_password
    import secrets
    import string

    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Validate required fields
    full_name = parent_data.get("fullName", "")
    email = parent_data.get("email")
    phone = parent_data.get("phone")

    if not email or not full_name:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Check if email already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Split name
    name_parts = full_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Generate temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

    # Create user
    new_parent = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=RoleEnum.PARENT,
        hashed_password=hash_password(temp_password),
        nursery_id=current_user.nursery_id,
        is_active=True
    )

    db.add(new_parent)
    db.commit()
    db.refresh(new_parent)

    return {
        "id": new_parent.id,
        "email": new_parent.email,
        "fullName": f"{new_parent.first_name} {new_parent.last_name}",
        "phone": new_parent.phone,
        "tempPassword": temp_password
    }


@router.post("/children")
async def create_child(
    child_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new child"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Validate required fields
    full_name = child_data.get("fullName", "")
    dob = child_data.get("dateOfBirth")
    parent_id = child_data.get("parentId")

    if not full_name or not dob or not parent_id:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Verify parent exists and belongs to nursery
    parent = db.query(User).filter(
        User.id == parent_id,
        User.nursery_id == current_user.nursery_id,
        User.role == RoleEnum.PARENT
    ).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found in your nursery")

    # Get first available classroom in nursery
    classroom = db.query(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).first()
    if not classroom:
        raise HTTPException(status_code=400, detail="No classrooms available in nursery")

    # Split name
    name_parts = full_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Parse date
    try:
        date_of_birth = datetime.fromisoformat(dob.replace('Z', '+00:00')).date()
    except:
        date_of_birth = datetime.strptime(dob, "%Y-%m-%d").date()

    # Create child
    new_child = Child(
        first_name=first_name,
        last_name=last_name,
        date_of_birth=date_of_birth,
        gender=child_data.get("gender", "unknown"),
        medical_info=child_data.get("healthNotes"),
        emergency_contact=child_data.get("emergencyContact", parent.first_name),
        emergency_phone=child_data.get("emergencyPhone", parent.phone or ""),
        classroom_id=classroom.id,
        parent_id=parent_id,
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
        "parentId": new_child.parent_id
    }


@router.get("/supervisors")
async def get_supervisors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get all supervisors in manager's nursery"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    supervisors = db.query(User).filter(
        User.nursery_id == current_user.nursery_id,
        User.role == RoleEnum.SUPERVISOR
    ).all()

    # Get report counts for each supervisor
    formatted_supervisors = []
    for supervisor in supervisors:
        # Count reports (TODO: Add supervisor_id to DailyReport)
        total_reports = 0  # Placeholder
        approved_reports = 0  # Placeholder
        pending_reports = 0  # Placeholder

        formatted_supervisors.append({
            "id": supervisor.id,
            "fullName": f"{supervisor.first_name} {supervisor.last_name}",
            "email": supervisor.email,
            "phone": supervisor.phone,
            "lastLogin": None,  # TODO: Track last login
            "totalReports": total_reports,
            "approvedReports": approved_reports,
            "pendingReports": pending_reports,
            "isActive": supervisor.is_active
        })

    return formatted_supervisors


@router.post("/supervisors")
async def create_supervisor(
    supervisor_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Create a new supervisor"""
    from .security import hash_password
    import secrets
    import string

    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Validate required fields
    full_name = supervisor_data.get("fullName", "")
    email = supervisor_data.get("email")
    phone = supervisor_data.get("phone")

    if not email or not full_name:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Check if email already exists
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Split name
    name_parts = full_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Generate temporary password
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

    # Create user
    new_supervisor = User(
        email=email,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=RoleEnum.SUPERVISOR,
        hashed_password=hash_password(temp_password),
        nursery_id=current_user.nursery_id,
        is_active=True
    )

    db.add(new_supervisor)
    db.commit()
    db.refresh(new_supervisor)

    return {
        "id": new_supervisor.id,
        "email": new_supervisor.email,
        "fullName": f"{new_supervisor.first_name} {new_supervisor.last_name}",
        "phone": new_supervisor.phone,
        "tempPassword": temp_password
    }


@router.put("/supervisors/{supervisor_id}")
async def update_supervisor(
    supervisor_id: int,
    supervisor_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update supervisor information"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    supervisor = db.query(User).filter(
        User.id == supervisor_id,
        User.nursery_id == current_user.nursery_id,
        User.role == RoleEnum.SUPERVISOR
    ).first()

    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    # Update fields
    if "fullName" in supervisor_data:
        name_parts = supervisor_data["fullName"].strip().split(maxsplit=1)
        supervisor.first_name = name_parts[0] if len(name_parts) > 0 else ""
        supervisor.last_name = name_parts[1] if len(name_parts) > 1 else ""

    if "email" in supervisor_data:
        supervisor.email = supervisor_data["email"]
    if "phone" in supervisor_data:
        supervisor.phone = supervisor_data["phone"]

    db.commit()
    db.refresh(supervisor)

    return {
        "id": supervisor.id,
        "email": supervisor.email,
        "fullName": f"{supervisor.first_name} {supervisor.last_name}",
        "phone": supervisor.phone
    }


@router.delete("/supervisors/{supervisor_id}")
async def delete_supervisor(
    supervisor_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Delete supervisor"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    supervisor = db.query(User).filter(
        User.id == supervisor_id,
        User.nursery_id == current_user.nursery_id,
        User.role == RoleEnum.SUPERVISOR
    ).first()

    if not supervisor:
        raise HTTPException(status_code=404, detail="Supervisor not found")

    db.delete(supervisor)
    db.commit()

    return {"message": "Supervisor deleted successfully"}


@router.get("/reports")
async def get_manager_reports(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get all reports for manager's nursery with optional status filter"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    query = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    )

    # TODO: Add status filter when status field is added to model
    # if status:
    #     query = query.filter(DailyReport.status == status)

    reports = query.order_by(desc(DailyReport.date)).offset(skip).limit(limit).all()

    # Format response
    formatted_reports = []
    for report in reports:
        formatted_reports.append({
            "id": report.id,
            "childName": f"{report.child.first_name} {report.child.last_name}",
            "supervisorName": "Supervisor",  # TODO: Add supervisor relationship
            "date": report.date.isoformat(),
            "status": "submitted",  # Default status
            "activities": report.activities.split("\n") if report.activities else [],
            "healthObservations": report.notes or "",
            "behaviorNotes": report.mood or "",
            "managerNotes": ""  # TODO: Add manager_notes field
        })

    return formatted_reports


@router.put("/reports/{report_id}/approve")
async def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Approve a daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify report belongs to manager's nursery
    report = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        DailyReport.id == report_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # TODO: Set status to approved when field is added
    # report.status = "approved"

    db.commit()
    db.refresh(report)

    return {"message": "Report approved successfully"}


@router.put("/reports/{report_id}/revise")
async def request_revision(
    report_id: int,
    revision_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Request revision on a daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify report belongs to manager's nursery
    report = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        DailyReport.id == report_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # TODO: Set status to revision_needed and add manager notes when fields are added
    # report.status = "revision_needed"
    # report.manager_notes = revision_data.get("managerNotes")

    db.commit()
    db.refresh(report)

    return {"message": "Revision requested successfully"}


@router.put("/reports/{report_id}")
async def update_report(
    report_id: int,
    report_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Update a daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    # Verify report belongs to manager's nursery
    report = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        DailyReport.id == report_id,
        Branch.nursery_id == current_user.nursery_id
    ).first()

    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    # Update fields
    if "activities" in report_data:
        activities = report_data["activities"]
        if isinstance(activities, list):
            report.activities = "\n".join(activities)
        else:
            report.activities = activities

    if "healthObservations" in report_data:
        report.notes = report_data["healthObservations"]

    if "behaviorNotes" in report_data:
        report.mood = report_data["behaviorNotes"]

    db.commit()
    db.refresh(report)

    return {"message": "Report updated successfully"}
