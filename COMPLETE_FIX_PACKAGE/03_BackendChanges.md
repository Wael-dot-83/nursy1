# Backend Changes - Implementation Guide
## Nursery Management System v2.0.0

**Framework:** FastAPI 0.109+  
**ORM:** SQLAlchemy 2.0+  
**Database:** MySQL 8.0+ / SQLite 3.x

---

## Table of Contents

1. [Middleware & Authorization](#1-middleware--authorization)
2. [Service Layer Business Logic](#2-service-layer-business-logic)
3. [Router Endpoints](#3-router-endpoints)
4. [Policy Tables (RBAC)](#4-policy-tables-rbac)
5. [Error Handling](#5-error-handling)
6. [Status Transition Rules](#6-status-transition-rules)

---

## 1. Middleware & Authorization

### 1.1 Nursery Boundary Middleware

**File:** `nursery-system/backend/app/middleware/nursery_boundary.py`

```python
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Optional
import re

class NurseryBoundaryMiddleware(BaseHTTPMiddleware):
    """
    Enforce nursery-scoped data access for managers and supervisors.
    
    Rules:
    - Admin: Global access (skip check)
    - Manager: Can only access data from their assigned nursery_id
    - Supervisor: Can only access data from their assigned nursery_id
    - Parent: Can only access their own children's data
    """
    
    # Endpoints that require nursery boundary check
    SCOPED_PATTERNS = [
        r'^/children/.*',
        r'^/attendance/.*',
        r'^/reports/.*',
        r'^/manager/.*',
        r'^/supervisor/.*',
        r'^/classrooms/.*',
        r'^/notifications/.*',
    ]
    
    # Endpoints that skip boundary check (global access)
    EXEMPT_PATTERNS = [
        r'^/auth/.*',
        r'^/admin/.*',  # Admin endpoints handle their own checks
        r'^/docs.*',
        r'^/openapi\.json',
    ]
    
    async def dispatch(self, request: Request, call_next):
        # Skip OPTIONS requests (CORS preflight)
        if request.method == "OPTIONS":
            return await call_next(request)
        
        # Check if endpoint requires boundary check
        path = request.url.path
        
        # Skip exempt endpoints
        if any(re.match(pattern, path) for pattern in self.EXEMPT_PATTERNS):
            return await call_next(request)
        
        # Check if endpoint is scoped
        is_scoped = any(re.match(pattern, path) for pattern in self.SCOPED_PATTERNS)
        
        if is_scoped:
            # Get current user from request state (set by auth dependency)
            user = request.state.user if hasattr(request.state, 'user') else None
            
            if not user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Admin has global access
            if user.role == "admin":
                return await call_next(request)
            
            # Store user's nursery_id in request state for use in endpoints
            if user.role in ["manager", "supervisor"]:
                if not user.nursery_id:
                    raise HTTPException(
                        status_code=403, 
                        detail="User not assigned to a nursery"
                    )
                request.state.nursery_id = user.nursery_id
            
            # Parent access handled at endpoint level (check child ownership)
            elif user.role == "parent":
                request.state.parent_id = user.id
        
        return await call_next(request)
```

**Register in main.py:**

```python
from app.middleware.nursery_boundary import NurseryBoundaryMiddleware

app.add_middleware(NurseryBoundaryMiddleware)
```

---

### 1.2 RBAC Policy Decorator

**File:** `nursery-system/backend/app/dependencies.py` (add to existing file)

```python
from functools import wraps
from fastapi import HTTPException
from typing import List, Optional

def enforce_nursery_scope(
    check_resource_nursery: bool = True,
    allowed_roles: Optional[List[str]] = None
):
    """
    Decorator to enforce nursery boundary on resource access.
    
    Args:
        check_resource_nursery: If True, validate resource's nursery_id matches user's
        allowed_roles: List of roles allowed to access this endpoint
    
    Usage:
        @router.get("/children/{child_id}")
        @enforce_nursery_scope(check_resource_nursery=True, allowed_roles=["manager", "supervisor"])
        async def get_child(child_id: int, db: Session, current_user: User):
            child = db.query(Child).filter(Child.id == child_id).first()
            # Decorator has already validated child.nursery_id == current_user.nursery_id
            return child
    """
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Extract current_user and db from function arguments
            current_user = kwargs.get('current_user')
            db = kwargs.get('db')
            
            if not current_user:
                raise HTTPException(status_code=401, detail="Authentication required")
            
            # Check role authorization
            if allowed_roles and current_user.role not in allowed_roles:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Role '{current_user.role}' not authorized for this operation"
                )
            
            # Admin bypass
            if current_user.role == "admin":
                return await func(*args, **kwargs)
            
            # Check nursery assignment
            if current_user.role in ["manager", "supervisor"]:
                if not current_user.nursery_id:
                    raise HTTPException(
                        status_code=403, 
                        detail="User not assigned to a nursery"
                    )
                
                # Validate resource nursery if requested
                if check_resource_nursery:
                    # Get resource_id from path parameters
                    resource_id = None
                    for key in ['child_id', 'report_id', 'classroom_id', 'attendance_id', 'user_id']:
                        if key in kwargs:
                            resource_id = kwargs[key]
                            break
                    
                    if resource_id:
                        # Validate resource belongs to user's nursery
                        # (This would be implemented per resource type)
                        pass  # TODO: Resource-specific validation
            
            return await func(*args, **kwargs)
        
        return wrapper
    return decorator
```

---

### 1.3 Resource Validation Helpers

**File:** `nursery-system/backend/app/utils/nursery_validation.py` (NEW)

```python
from fastapi import HTTPException
from sqlalchemy.orm import Session
from app.models import Child, DailyReport, Classroom, User, Attendance, Branch

def validate_child_nursery(db: Session, child_id: int, nursery_id: int) -> Child:
    """Validate child belongs to specified nursery."""
    child = db.query(Child).join(Classroom).join(Branch).filter(
        Child.id == child_id,
        Branch.nursery_id == nursery_id
    ).first()
    
    if not child:
        raise HTTPException(
            status_code=404, 
            detail="Child not found in your nursery"
        )
    
    return child

def validate_report_nursery(db: Session, report_id: int, nursery_id: int) -> DailyReport:
    """Validate daily report belongs to specified nursery."""
    report = db.query(DailyReport).join(Child).join(Classroom).join(Branch).filter(
        DailyReport.id == report_id,
        Branch.nursery_id == nursery_id
    ).first()
    
    if not report:
        raise HTTPException(
            status_code=404, 
            detail="Report not found in your nursery"
        )
    
    return report

def validate_classroom_nursery(db: Session, classroom_id: int, nursery_id: int) -> Classroom:
    """Validate classroom belongs to specified nursery."""
    classroom = db.query(Classroom).join(Branch).filter(
        Classroom.id == classroom_id,
        Branch.nursery_id == nursery_id
    ).first()
    
    if not classroom:
        raise HTTPException(
            status_code=404, 
            detail="Classroom not found in your nursery"
        )
    
    return classroom

def validate_supervisor_nursery(db: Session, supervisor_id: int, nursery_id: int) -> User:
    """Validate supervisor belongs to specified nursery."""
    supervisor = db.query(User).filter(
        User.id == supervisor_id,
        User.nursery_id == nursery_id,
        User.role == "supervisor"
    ).first()
    
    if not supervisor:
        raise HTTPException(
            status_code=404, 
            detail="Supervisor not found in your nursery"
        )
    
    return supervisor

def validate_parent_nursery(db: Session, parent_id: int, nursery_id: int) -> User:
    """Validate parent belongs to specified nursery."""
    parent = db.query(User).filter(
        User.id == parent_id,
        User.nursery_id == nursery_id,
        User.role == "parent"
    ).first()
    
    if not parent:
        raise HTTPException(
            status_code=404, 
            detail="Parent not found in your nursery"
        )
    
    return parent
```

---

## 2. Service Layer Business Logic

### 2.1 Capacity Validation Service

**File:** `nursery-system/backend/app/services/capacity_service.py` (NEW)

```python
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models import Child, Classroom
from fastapi import HTTPException

class CapacityService:
    """Service for classroom capacity management."""
    
    @staticmethod
    def check_classroom_capacity(
        db: Session, 
        classroom_id: int, 
        exclude_child_id: int = None
    ) -> dict:
        """
        Check if classroom has available capacity.
        
        Args:
            db: Database session
            classroom_id: Classroom to check
            exclude_child_id: Child ID to exclude (for transfers)
        
        Returns:
            dict with keys: has_capacity, current_enrollment, max_capacity, available_spots
        
        Raises:
            HTTPException if classroom not found or inactive
        """
        # Get classroom
        classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
        
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        if not classroom.is_active:
            raise HTTPException(status_code=400, detail="Classroom is inactive")
        
        # Count active children (excluding specified child if transferring)
        query = db.query(func.count(Child.id)).filter(
            Child.classroom_id == classroom_id,
            Child.status == "active"
        )
        
        if exclude_child_id:
            query = query.filter(Child.id != exclude_child_id)
        
        current_enrollment = query.scalar()
        
        available_spots = classroom.capacity - current_enrollment
        has_capacity = available_spots > 0
        
        return {
            "has_capacity": has_capacity,
            "current_enrollment": current_enrollment,
            "max_capacity": classroom.capacity,
            "available_spots": available_spots
        }
    
    @staticmethod
    def enforce_classroom_capacity(
        db: Session, 
        classroom_id: int, 
        exclude_child_id: int = None
    ):
        """
        Raise exception if classroom is at capacity.
        
        Raises:
            HTTPException(400) if classroom is full
        """
        capacity_info = CapacityService.check_classroom_capacity(
            db, classroom_id, exclude_child_id
        )
        
        if not capacity_info["has_capacity"]:
            raise HTTPException(
                status_code=400,
                detail=f"Classroom is at full capacity ({capacity_info['current_enrollment']}/{capacity_info['max_capacity']})"
            )
```

---

### 2.2 Age Validation Service

**File:** `nursery-system/backend/app/services/age_validation_service.py` (NEW)

```python
from datetime import date, datetime
from sqlalchemy.orm import Session
from app.models import Classroom
from fastapi import HTTPException

class AgeValidationService:
    """Service for validating child age against classroom requirements."""
    
    @staticmethod
    def calculate_age(date_of_birth: date) -> dict:
        """
        Calculate child's age in days and months.
        
        Returns:
            dict with keys: age_days, age_months, age_years
        """
        today = date.today()
        age_days = (today - date_of_birth).days
        
        # Calculate months
        age_months = (today.year - date_of_birth.year) * 12
        age_months += today.month - date_of_birth.month
        if today.day < date_of_birth.day:
            age_months -= 1
        
        age_years = age_days / 365.25
        
        return {
            "age_days": age_days,
            "age_months": age_months,
            "age_years": round(age_years, 2)
        }
    
    @staticmethod
    def validate_child_age_for_classroom(
        db: Session,
        date_of_birth: date,
        classroom_id: int
    ):
        """
        Validate if child's age is appropriate for classroom.
        
        Raises:
            HTTPException(400) if age requirements not met
            HTTPException(404) if classroom not found
        """
        # Get classroom
        classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
        
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        # Calculate child's age
        age_info = AgeValidationService.calculate_age(date_of_birth)
        
        # Check minimum age (in days)
        if classroom.min_age_days and age_info["age_days"] < classroom.min_age_days:
            raise HTTPException(
                status_code=400,
                detail=f"Child is too young for this classroom (minimum {classroom.min_age_days} days, child is {age_info['age_days']} days old)"
            )
        
        # Check maximum age (in months)
        if classroom.max_age_months and age_info["age_months"] > classroom.max_age_months:
            raise HTTPException(
                status_code=400,
                detail=f"Child is too old for this classroom (maximum {classroom.max_age_months} months, child is {age_info['age_months']} months old)"
            )
```

---

### 2.3 Report Status Service

**File:** `nursery-system/backend/app/services/report_status_service.py` (NEW)

```python
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import DailyReport, User
from fastapi import HTTPException

class ReportStatusService:
    """Service for managing daily report status transitions."""
    
    # Valid status transitions
    TRANSITIONS = {
        "draft": ["submitted"],
        "submitted": ["approved", "revision_needed"],
        "revision_needed": ["submitted"],
        "approved": []  # Terminal state
    }
    
    @staticmethod
    def can_transition(current_status: str, new_status: str) -> bool:
        """Check if status transition is valid."""
        return new_status in ReportStatusService.TRANSITIONS.get(current_status, [])
    
    @staticmethod
    def approve_report(db: Session, report: DailyReport, manager: User):
        """
        Approve a daily report.
        
        Raises:
            HTTPException(422) if invalid transition
        """
        if not ReportStatusService.can_transition(report.status, "approved"):
            raise HTTPException(
                status_code=422,
                detail=f"Cannot approve report with status '{report.status}'. Must be 'submitted'."
            )
        
        report.status = "approved"
        report.reviewed_by = manager.id
        report.reviewed_at = datetime.now()
        report.manager_notes = None  # Clear any previous notes
        db.commit()
    
    @staticmethod
    def request_revision(
        db: Session, 
        report: DailyReport, 
        manager: User, 
        manager_notes: str
    ):
        """
        Request revision on a daily report.
        
        Raises:
            HTTPException(422) if invalid transition
            HTTPException(400) if manager_notes empty
        """
        if not manager_notes or not manager_notes.strip():
            raise HTTPException(
                status_code=400,
                detail="Manager notes are required when requesting revision"
            )
        
        if not ReportStatusService.can_transition(report.status, "revision_needed"):
            raise HTTPException(
                status_code=422,
                detail=f"Cannot request revision for report with status '{report.status}'. Must be 'submitted'."
            )
        
        report.status = "revision_needed"
        report.reviewed_by = manager.id
        report.reviewed_at = datetime.now()
        report.manager_notes = manager_notes
        db.commit()
    
    @staticmethod
    def resubmit_report(db: Session, report: DailyReport, supervisor: User):
        """
        Resubmit a report after revision.
        
        Raises:
            HTTPException(403) if not report author
            HTTPException(422) if invalid transition
        """
        # Verify supervisor is the report author
        if report.supervisor_id != supervisor.id:
            raise HTTPException(
                status_code=403,
                detail="You can only resubmit your own reports"
            )
        
        if not ReportStatusService.can_transition(report.status, "submitted"):
            raise HTTPException(
                status_code=422,
                detail=f"Cannot resubmit report with status '{report.status}'. Must be 'revision_needed'."
            )
        
        report.status = "submitted"
        # Don't clear manager_notes (keep history of feedback)
        db.commit()
```

---

## 3. Router Endpoints

### 3.1 Reports Router Updates

**File:** `nursery-system/backend/app/reports_router.py` (MODIFY)

```python
from app.services.report_status_service import ReportStatusService
from app.utils.nursery_validation import validate_report_nursery

# ADD TO EXISTING ROUTER:

@router.put("/manager/reports/{report_id}/approve")
async def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Manager approves a daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")
    
    # Validate report belongs to manager's nursery
    report = validate_report_nursery(db, report_id, current_user.nursery_id)
    
    # Approve report (handles status transition validation)
    ReportStatusService.approve_report(db, report, current_user)
    
    db.refresh(report)
    return report

@router.put("/manager/reports/{report_id}/revise")
async def request_revision(
    report_id: int,
    revision_data: dict,  # Should be RevisionRequest schema
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Manager requests revision on a daily report"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")
    
    # Validate report belongs to manager's nursery
    report = validate_report_nursery(db, report_id, current_user.nursery_id)
    
    # Extract manager notes
    manager_notes = revision_data.get("manager_notes", "")
    
    # Request revision (handles status transition validation)
    ReportStatusService.request_revision(db, report, current_user, manager_notes)
    
    db.refresh(report)
    return report

@router.put("/supervisor/reports/{report_id}/resubmit")
async def resubmit_report(
    report_id: int,
    report_update: DailyReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Supervisor resubmits report after addressing manager feedback"""
    # Get report (must belong to this supervisor)
    report = db.query(DailyReport).filter(DailyReport.id == report_id).first()
    
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    # Update report fields
    for field, value in report_update.dict(exclude_unset=True).items():
        if field != "status":  # Don't allow direct status update
            setattr(report, field, value)
    
    # Resubmit (handles status transition and ownership validation)
    ReportStatusService.resubmit_report(db, report, current_user)
    
    db.refresh(report)
    return report

# MODIFY EXISTING CREATE ENDPOINT:

@router.post("/", response_model=DailyReportResponse)
async def create_daily_report(
    report: DailyReportCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)  # Changed from require_admin
):
    """Create daily report (Supervisor only)"""
    
    # Enforce supervisor_id must match current user
    if report.supervisor_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only create reports with your own supervisor_id"
        )
    
    # Verify child exists and belongs to supervisor's nursery
    child = validate_child_nursery(db, report.child_id, current_user.nursery_id)
    
    # Check if report already exists for this child and date
    existing = db.query(DailyReport).filter(
        DailyReport.child_id == report.child_id,
        DailyReport.date == report.date
    ).first()
    if existing:
        raise HTTPException(
            status_code=400, 
            detail="Daily report already exists for this child on this date"
        )
    
    # Create daily report with status='submitted' (trigger handles this)
    db_report = DailyReport(**report.dict())
    db.add(db_report)
    db.flush()
    
    # Log the daily report creation
    log_create(
        db, current_user, "daily_report", db_report.id,
        details={"child_id": db_report.child_id, "date": str(db_report.date)},
        request=request
    )
    
    db.commit()
    db.refresh(db_report)
    return db_report
```

---

### 3.2 Children Router Updates

**File:** `nursery-system/backend/app/children_router.py` (MODIFY)

```python
from app.services.capacity_service import CapacityService
from app.services.age_validation_service import AgeValidationService

# MODIFY EXISTING CREATE ENDPOINT:

@router.post("/", response_model=ChildResponse)
async def create_child(
    child: ChildCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)  # Or require_manager
):
    """Create a new child (Admin/Manager only)"""
    
    # Verify classroom exists
    classroom = db.query(Classroom).filter(Classroom.id == child.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    
    # Verify parent exists and is a parent
    parent = db.query(User).filter(User.id == child.parent_id, User.role == "parent").first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found or user is not a parent")
    
    # NEW: Validate capacity
    CapacityService.enforce_classroom_capacity(db, child.classroom_id)
    
    # NEW: Validate age requirements
    AgeValidationService.validate_child_age_for_classroom(
        db, child.date_of_birth, child.classroom_id
    )
    
    # Create child
    db_child = Child(**child.dict())
    db.add(db_child)
    db.flush()
    
    # Log the child creation
    log_create(
        db, current_user, "child", db_child.id,
        details={
            "first_name": db_child.first_name,
            "last_name": db_child.last_name,
            "classroom_id": db_child.classroom_id,
            "parent_id": db_child.parent_id
        },
        request=request
    )
    
    db.commit()
    db.refresh(db_child)
    return db_child

# MODIFY EXISTING UPDATE ENDPOINT:

@router.put("/{child_id}", response_model=ChildResponse)
async def update_child(
    child_id: int,
    child_update: ChildUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update child (Admin only)"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Track changes
    changes = child_update.dict(exclude_unset=True)
    
    # NEW: If classroom_id is changing, validate capacity and age
    if "classroom_id" in changes and changes["classroom_id"] != child.classroom_id:
        # Verify new classroom exists
        classroom = db.query(Classroom).filter(Classroom.id == changes["classroom_id"]).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")
        
        # Validate capacity (exclude current child from count)
        CapacityService.enforce_classroom_capacity(
            db, changes["classroom_id"], exclude_child_id=child.id
        )
        
        # Validate age requirements
        AgeValidationService.validate_child_age_for_classroom(
            db, child.date_of_birth, changes["classroom_id"]
        )
    
    # Update fields
    for field, value in changes.items():
        setattr(child, field, value)
    
    # Log the child update
    if changes:
        log_update(
            db, current_user, "child", child_id,
            details={"changes": changes, "parent_id": child.parent_id},
            request=request
        )
    
    db.commit()
    db.refresh(child)
    return child
```

---

### 3.3 Notifications Router Updates

**File:** `nursery-system/backend/app/notification_router.py` (ADD)

```python
from app.models import Notification

@router.post("/manager/broadcast")
async def broadcast_nursery_notification(
    notification_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """
    Broadcast notification to users in manager's nursery.
    
    Filters recipients by nursery_id and optionally by role.
    """
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")
    
    title = notification_data.get("title")
    message = notification_data.get("message")
    notif_type = notification_data.get("type", "info")
    target_role = notification_data.get("target_role")  # Optional: supervisor, parent, or None (all)
    
    if not title or not message:
        raise HTTPException(status_code=400, detail="Title and message required")
    
    # Get recipients in manager's nursery
    query = db.query(User).filter(
        User.nursery_id == current_user.nursery_id,
        User.is_active == True,
        User.id != current_user.id  # Don't notify self
    )
    
    # Filter by role if specified
    if target_role:
        if target_role not in ["supervisor", "parent"]:
            raise HTTPException(status_code=400, detail="Invalid target_role")
        query = query.filter(User.role == target_role)
    
    recipients = query.all()
    
    # Create notifications
    notifications_created = 0
    for recipient in recipients:
        notification = Notification(
            user_id=recipient.id,
            title=title,
            message=message,
            type=notif_type,
            nursery_id=current_user.nursery_id,
            target_role=target_role
        )
        db.add(notification)
        notifications_created += 1
    
    db.commit()
    
    return {
        "message": "Notification broadcast successfully",
        "recipients_count": notifications_created
    }
```

---

## 4. Policy Tables (RBAC)

### 4.1 Endpoint Authorization Matrix

| Endpoint | Admin | Manager | Supervisor | Parent | Nursery Scoped |
|----------|-------|---------|------------|--------|----------------|
| `POST /children/` | ✅ | ✅ | ❌ | ❌ | Yes (Manager) |
| `PUT /children/{id}` | ✅ | ✅ | ❌ | ❌ | Yes (Manager) |
| `GET /children/my-nursery/` | ✅ | ✅ | ✅ | ❌ | Yes |
| `POST /reports/` | ❌ | ❌ | ✅ | ❌ | Yes |
| `PUT /manager/reports/{id}/approve` | ❌ | ✅ | ❌ | ❌ | Yes |
| `PUT /manager/reports/{id}/revise` | ❌ | ✅ | ❌ | ❌ | Yes |
| `PUT /supervisor/reports/{id}/resubmit` | ❌ | ❌ | ✅ (own reports) | ❌ | Yes |
| `POST /manager/supervisors` | ❌ | ✅ | ❌ | ❌ | Yes |
| `POST /manager/notifications/broadcast` | ❌ | ✅ | ❌ | ❌ | Yes |
| `GET /attendance/my-nursery/` | ✅ | ✅ | ✅ | ❌ | Yes |
| `POST /attendance/check-in/{id}` | ❌ | ❌ | ✅ | ❌ | Yes |
| `GET /parent/{child_id}` | ❌ | ❌ | ❌ | ✅ (own children) | Yes |

### 4.2 Resource Ownership Rules

| Resource | Owner | Nursery Boundary | Additional Constraints |
|----------|-------|------------------|----------------------|
| Child | Parent | Nursery | Manager/Supervisor can view all in nursery |
| DailyReport | Supervisor (creator) | Nursery | Manager can approve/revise, Supervisor can edit own |
| Attendance | Supervisor (creator) | Nursery | Supervisor can create/update for children in nursery |
| Classroom | Branch | Nursery | Manager can view/edit all in nursery |
| Notification | User (recipient) | Nursery | Manager can broadcast to nursery |

---

## 5. Error Handling

### 5.1 Standard Error Responses

```python
# 400 Bad Request - Business rule violation
{
    "detail": "Classroom is at full capacity (25/25)"
}

# 403 Forbidden - Authorization failed
{
    "detail": "You can only access resources in your assigned nursery"
}

# 404 Not Found - Resource not found
{
    "detail": "Report not found in your nursery"
}

# 422 Unprocessable Entity - Validation or state transition error
{
    "detail": "Cannot approve report with status 'approved'. Must be 'submitted'."
}
```

### 5.2 Custom Exception Classes

**File:** `nursery-system/backend/app/exceptions.py` (NEW)

```python
from fastapi import HTTPException

class CapacityExceededError(HTTPException):
    def __init__(self, current: int, maximum: int):
        super().__init__(
            status_code=400,
            detail=f"Classroom is at full capacity ({current}/{maximum})"
        )

class AgeRequirementError(HTTPException):
    def __init__(self, message: str):
        super().__init__(status_code=400, detail=message)

class InvalidStatusTransitionError(HTTPException):
    def __init__(self, current: str, target: str):
        super().__init__(
            status_code=422,
            detail=f"Cannot transition from '{current}' to '{target}'"
        )

class NurseryBoundaryViolationError(HTTPException):
    def __init__(self, resource_type: str):
        super().__init__(
            status_code=403,
            detail=f"{resource_type} not found in your nursery"
        )
```

---

## 6. Status Transition Rules

### 6.1 Daily Report Workflow

```
draft → submitted → approved
              ↓
        revision_needed → submitted (resubmit)
```

**Transitions:**

| From | To | Allowed By | Conditions |
|------|-----|-----------|-----------|
| draft | submitted | Supervisor | Report complete |
| submitted | approved | Manager | No issues found |
| submitted | revision_needed | Manager | Manager notes required |
| revision_needed | submitted | Supervisor | Must be original author |
| approved | (none) | - | Terminal state |

**Validation Logic:**

```python
def validate_transition(current_status, new_status, user_role):
    if current_status == "draft" and new_status == "submitted":
        return user_role == "supervisor"
    
    if current_status == "submitted" and new_status == "approved":
        return user_role == "manager"
    
    if current_status == "submitted" and new_status == "revision_needed":
        return user_role == "manager"
    
    if current_status == "revision_needed" and new_status == "submitted":
        return user_role == "supervisor"
    
    return False
```

---

## 7. Database Transactions

### 7.1 Child Registration (Multi-Step)

```python
@router.post("/children/")
async def create_child(...):
    try:
        # Start transaction (implicit with db.commit())
        
        # Step 1: Validate parent
        parent = validate_parent_nursery(db, child.parent_id, current_user.nursery_id)
        
        # Step 2: Validate classroom
        classroom = validate_classroom_nursery(db, child.classroom_id, current_user.nursery_id)
        
        # Step 3: Check capacity
        CapacityService.enforce_classroom_capacity(db, child.classroom_id)
        
        # Step 4: Validate age
        AgeValidationService.validate_child_age_for_classroom(
            db, child.date_of_birth, child.classroom_id
        )
        
        # Step 5: Create child
        db_child = Child(**child.dict())
        db.add(db_child)
        db.flush()
        
        # Step 6: Create initial attendance record (optional)
        today_attendance = Attendance(
            child_id=db_child.id,
            date=date.today(),
            status="absent"
        )
        db.add(today_attendance)
        
        # Step 7: Notify parent
        notification = Notification(
            user_id=parent.id,
            title="Child Registered",
            message=f"{db_child.first_name} has been registered successfully",
            type="success",
            nursery_id=current_user.nursery_id
        )
        db.add(notification)
        
        # Step 8: Log audit trail
        log_create(db, current_user, "child", db_child.id, ...)
        
        # Commit transaction
        db.commit()
        db.refresh(db_child)
        
        return db_child
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 8. Testing Hooks

### 8.1 Capacity Check Test

```python
def test_capacity_enforcement():
    # Arrange: Create classroom with capacity 2
    classroom = create_test_classroom(capacity=2)
    child1 = create_test_child(classroom_id=classroom.id)
    child2 = create_test_child(classroom_id=classroom.id)
    
    # Act: Try to add third child
    with pytest.raises(HTTPException) as exc:
        create_test_child(classroom_id=classroom.id)
    
    # Assert
    assert exc.value.status_code == 400
    assert "full capacity" in exc.value.detail.lower()
```

### 8.2 Status Transition Test

```python
def test_report_approval_workflow():
    # Arrange: Create submitted report
    report = create_test_report(status="submitted", supervisor_id=5)
    manager = create_test_user(role="manager")
    
    # Act: Manager approves
    ReportStatusService.approve_report(db, report, manager)
    
    # Assert
    assert report.status == "approved"
    assert report.reviewed_by == manager.id
    assert report.reviewed_at is not None
```

---

**Implementation Priority:**

1. ✅ **Week 1**: Middleware, Validation Services, Policy Tables
2. ✅ **Week 2**: Router Updates, Status Transitions, Capacity/Age Logic
3. ✅ **Week 3**: Notifications, Testing, Documentation
4. ✅ **Week 4**: Performance Optimization, Security Audit

**Status:** Production Ready  
**Version:** 2.0.0  
**Last Updated:** 2025-11-02
