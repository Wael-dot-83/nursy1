from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from .models import Child, User, Classroom, Branch
from .schemas import (
    ChildResponse, ChildCreate, ChildUpdate,
    BaseResponse
)
from .dependencies import require_admin, require_manager, require_supervisor, require_parent
from .audit_helper import log_create, log_update, log_delete

router = APIRouter()

@router.get("/", response_model=List[ChildResponse])
async def get_children(
    skip: int = 0,
    limit: int = 100,
    classroom_id: Optional[int] = None,
    parent_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all children with optional filtering (Admin only)"""
    query = db.query(Child)

    if classroom_id:
        query = query.filter(Child.classroom_id == classroom_id)
    if parent_id:
        query = query.filter(Child.parent_id == parent_id)
    if status:
        query = query.filter(Child.status == status)

    children = query.offset(skip).limit(limit).all()
    return children

@router.post("/", response_model=ChildResponse)
async def create_child(
    child: ChildCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new child (Admin only)"""
    # Verify classroom exists
    classroom = db.query(Classroom).filter(Classroom.id == child.classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    # Verify parent exists and is a parent
    parent = db.query(User).filter(User.id == child.parent_id, User.role == "parent").first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found or user is not a parent")

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

@router.get("/{child_id}", response_model=ChildResponse)
async def get_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get child by ID (Admin only)"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child

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

    # Verify classroom exists if being updated
    if child_update.classroom_id is not None:
        classroom = db.query(Classroom).filter(Classroom.id == child_update.classroom_id).first()
        if not classroom:
            raise HTTPException(status_code=404, detail="Classroom not found")

    # Track changes
    changes = child_update.dict(exclude_unset=True)

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

@router.delete("/{child_id}", response_model=BaseResponse)
async def delete_child(
    child_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete child (Admin only)"""
    child = db.query(Child).filter(Child.id == child_id).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Log the deletion before removing
    log_delete(
        db, current_user, "child", child_id,
        details={
            "first_name": child.first_name,
            "last_name": child.last_name,
            "classroom_id": child.classroom_id,
            "parent_id": child.parent_id
        },
        request=request
    )

    db.delete(child)
    db.commit()
    return BaseResponse(message="Child deleted successfully")

# Manager/Supervisor endpoints for their nursery
@router.get("/my-nursery/", response_model=List[ChildResponse])
async def get_my_nursery_children(
    skip: int = 0,
    limit: int = 100,
    classroom_id: Optional[int] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_manager)
):
    """Get children in manager's nursery (Manager/Supervisor only)"""
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    query = db.query(Child).join(Classroom).join(Branch).filter(Branch.nursery_id == current_user.nursery_id)

    if classroom_id:
        query = query.filter(Child.classroom_id == classroom_id)
    if status:
        query = query.filter(Child.status == status)

    children = query.offset(skip).limit(limit).all()
    return children

@router.get("/my-children/", response_model=List[ChildResponse])
async def get_my_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_supervisor)
):
    """Get children assigned to current supervisor (Supervisor only)"""
    # This would need additional logic to determine which children are assigned to this supervisor
    # For now, return children in supervisor's nursery
    if not current_user.nursery_id:
        raise HTTPException(status_code=400, detail="User not assigned to a nursery")

    children = db.query(Child).join(Classroom).join(Branch).filter(
        Branch.nursery_id == current_user.nursery_id
    ).all()
    return children

# Parent endpoints
@router.get("/parent/", response_model=List[ChildResponse])
async def get_parent_children(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get children for current parent (Parent only)"""
    children = db.query(Child).filter(Child.parent_id == current_user.id).all()
    return children

@router.get("/parent/{child_id}", response_model=ChildResponse)
async def get_parent_child(
    child_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_parent)
):
    """Get specific child for current parent (Parent only)"""
    child = db.query(Child).filter(
        Child.id == child_id,
        Child.parent_id == current_user.id
    ).first()
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    return child