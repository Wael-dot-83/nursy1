from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from .models import User, Nursery
from .schemas import (
    UserResponse, UserCreate, UserUpdate,
    BaseResponse
)
from .dependencies import require_admin
from .security import hash_password

router = APIRouter()

@router.get("/", response_model=List[dict])
async def get_users(
    skip: int = 0,
    limit: int = 100,
    nursery_id: Optional[int] = None,
    role: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all users with optional filtering (Admin only)"""
    query = db.query(User)

    if nursery_id:
        query = query.filter(User.nursery_id == nursery_id)
    if role:
        query = query.filter(User.role == role)

    users = query.offset(skip).limit(limit).all()

    # Format users with fullName field for frontend
    return [
        {
            "id": user.id,
            "email": user.email,
            "fullName": f"{user.first_name} {user.last_name}",
            "phone": user.phone,
            "role": user.role,
            "nurseryId": user.nursery_id,
            "branchId": None,
            "isActive": user.is_active,
            "lastLogin": None,  # TODO: Track last login
            "createdAt": user.created_at,
            "updatedAt": user.updated_at
        }
        for user in users
    ]

@router.post("/", response_model=dict)
async def create_user(
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new user (Admin only)"""
    import secrets
    import string

    # Extract and validate data
    email = user_data.get("email")
    full_name = user_data.get("full_name")
    phone = user_data.get("phone")
    role = user_data.get("role")
    nursery_id = user_data.get("nursery_id")

    if not email or not full_name or not role:
        raise HTTPException(status_code=400, detail="Missing required fields")

    # Check if email already exists
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Verify nursery exists if provided
    if nursery_id:
        nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
        if not nursery:
            raise HTTPException(status_code=404, detail="Nursery not found")

    # Split full_name into first_name and last_name
    name_parts = full_name.strip().split(maxsplit=1)
    first_name = name_parts[0] if len(name_parts) > 0 else ""
    last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Generate temporary password for manager users
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

    # Hash password
    hashed_password = hash_password(temp_password)

    # Create user
    db_user = User(
        email=email,
        hashed_password=hashed_password,
        first_name=first_name,
        last_name=last_name,
        phone=phone,
        role=role,
        nursery_id=nursery_id if nursery_id else None,
    )

    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Return user with temporary password
    return {
        "id": db_user.id,
        "email": db_user.email,
        "fullName": f"{db_user.first_name} {db_user.last_name}",
        "phone": db_user.phone,
        "role": db_user.role,
        "nurseryId": db_user.nursery_id,
        "branchId": None,
        "isActive": db_user.is_active,
        "createdAt": db_user.created_at,
        "updatedAt": db_user.updated_at,
        "ephemeral": {
            "temp_password": temp_password
        }
    }

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get user by ID (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@router.put("/{user_id}", response_model=dict)
async def update_user(
    user_id: int,
    user_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update user (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Extract data
    full_name = user_data.get("full_name")
    email = user_data.get("email")
    phone = user_data.get("phone")
    role = user_data.get("role")
    nursery_id = user_data.get("nursery_id")
    is_active = user_data.get("is_active")

    # Verify nursery exists if being updated
    if nursery_id is not None:
        nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
        if not nursery:
            raise HTTPException(status_code=404, detail="Nursery not found")

    # Update full_name if provided
    if full_name:
        name_parts = full_name.strip().split(maxsplit=1)
        user.first_name = name_parts[0] if len(name_parts) > 0 else ""
        user.last_name = name_parts[1] if len(name_parts) > 1 else ""

    # Update other fields
    if email is not None:
        user.email = email
    if phone is not None:
        user.phone = phone
    if role is not None:
        user.role = role
    if nursery_id is not None:
        user.nursery_id = nursery_id
    if is_active is not None:
        user.is_active = is_active

    db.commit()
    db.refresh(user)

    return {
        "id": user.id,
        "email": user.email,
        "fullName": f"{user.first_name} {user.last_name}",
        "phone": user.phone,
        "role": user.role,
        "nurseryId": user.nursery_id,
        "branchId": None,
        "isActive": user.is_active,
        "createdAt": user.created_at,
        "updatedAt": user.updated_at
    }

@router.delete("/{user_id}", response_model=BaseResponse)
async def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete user (Admin only)"""
    # Prevent deleting self
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return BaseResponse(message="User deleted successfully")

@router.patch("/{user_id}/activation", response_model=UserResponse)
async def toggle_user_activation(
    user_id: int,
    activation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Toggle user activation status (Admin only)"""
    # Prevent modifying self
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot modify your own account status")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Get the active status from the request
    active = activation_data.get("active", not user.is_active)
    user.is_active = active

    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/activate", response_model=UserResponse)
async def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Activate user account (Admin only)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = True
    db.commit()
    db.refresh(user)
    return user

@router.put("/{user_id}/deactivate", response_model=UserResponse)
async def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Deactivate user account (Admin only)"""
    # Prevent deactivating self
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate your own account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = False
    db.commit()
    db.refresh(user)
    return user
