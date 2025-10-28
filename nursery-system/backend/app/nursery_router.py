from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from .database import get_db
from .models import Nursery, Branch, Classroom, User, RoleEnum
from .schemas import (
    NurseryResponse, NurseryCreate, NurseryUpdate,
    BranchResponse, BranchCreate, BranchUpdate,
    ClassroomResponse, ClassroomCreate, ClassroomUpdate,
    BaseResponse
)
from .dependencies import require_admin, require_manager

router = APIRouter()

# Nursery endpoints
@router.get("/")
async def get_nurseries(
    skip: int = 0,
    limit: int = 100
):
    """Get all nurseries (Admin only)"""
    return {"message": "Nurseries endpoint working", "skip": skip, "limit": limit}

@router.post("/")
async def create_nursery(
    nursery: NurseryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new nursery (Admin only)"""
    import secrets
    import string
    from .security import hash_password

    # Create nursery
    db_nursery = Nursery(
        name=nursery.name,
        main_street=nursery.main_address.get('street'),
        main_city=nursery.main_address.get('city'),
        main_governorate=nursery.main_address.get('governorate'),
        main_postal_code=nursery.main_address.get('postalCode'),
        main_phone=nursery.main_phone,
        email=nursery.email,
        min_age_days=nursery.age_range.get('minAge', 70),
        max_age_months=nursery.age_range.get('maxAge', 52),
        notes=nursery.notes,
        is_active=True
    )

    db.add(db_nursery)
    db.commit()
    db.refresh(db_nursery)

    # Create branches if provided
    branches_data = []
    if nursery.branches:
        for branch_data in nursery.branches:
            db_branch = Branch(
                nursery_id=db_nursery.id,
                name=branch_data.get('name', ''),
                address_street=branch_data.get('address', {}).get('street'),
                address_city=branch_data.get('address', {}).get('city'),
                address_governorate=branch_data.get('address', {}).get('governorate'),
                address_postal_code=branch_data.get('address', {}).get('postalCode'),
                phone=branch_data.get('phone')
            )
            db.add(db_branch)
            db.commit()
            db.refresh(db_branch)
            branches_data.append(db_branch)

    # Generate manager credentials
    manager_username = f"manager_{db_nursery.id}"
    manager_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    manager_email = nursery.email or f"manager{nursery.id}@nursery.com"

    # Create manager user
    hashed_password = hash_password(manager_password)
    db_manager = User(
        email=manager_email,
        hashed_password=hashed_password,
        first_name=f"Manager",
        last_name=f"Nursery {db_nursery.id}",
        phone=nursery.main_phone,
        role=RoleEnum.MANAGER,
        nursery_id=db_nursery.id,
        is_active=True
    )

    db.add(db_manager)
    db.commit()
    db.refresh(db_manager)

    # Return nursery with manager credentials
    return {
        **db_nursery.__dict__,
        "branches": branches_data,
        "manager": {
            "username": manager_username,
            "temporaryPassword": manager_password,
            "fullName": f"{db_manager.first_name} {db_manager.last_name}",
            "email": db_manager.email
        }
    }

@router.get("/{nursery_id}")
async def get_nursery(
    nursery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get nursery by ID (Admin only)"""
    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    # Format nursery for frontend
    formatted_nursery = {
        "id": nursery.id,
        "name": nursery.name,
        "mainPhone": nursery.main_phone,
        "email": nursery.email,
        "mainStreet": nursery.main_street,
        "mainCity": nursery.main_city,
        "mainGovernorate": nursery.main_governorate,
        "mainPostalCode": nursery.main_postal_code,
        "minAgeDays": nursery.min_age_days,
        "maxAgeMonths": nursery.max_age_months,
        "notes": nursery.notes,
        "isActive": nursery.is_active,
        "createdAt": nursery.created_at,
        "updatedAt": nursery.updated_at,
        "branches": []
    }

    # Add branches
    branches = db.query(Branch).filter(Branch.nursery_id == nursery.id).all()
    for branch in branches:
        formatted_branch = {
            "id": branch.id,
            "name": branch.name,
            "address": {
                "street": branch.address_street,
                "city": branch.address_city,
                "governorate": branch.address_governorate,
                "postalCode": branch.address_postal_code,
            },
            "phone": branch.phone,
            "nurseryId": branch.nursery_id,
            "createdAt": branch.created_at,
            "updatedAt": branch.updated_at,
        }
        formatted_nursery["branches"].append(formatted_branch)

    return formatted_nursery

@router.put("/{nursery_id}")
async def update_nursery(
    nursery_id: int,
    nursery_update: NurseryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update nursery (Admin only)"""
    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    # Update nursery fields
    if nursery_update.name is not None:
        nursery.name = nursery_update.name
    if nursery_update.main_phone is not None:
        nursery.main_phone = nursery_update.main_phone
    if nursery_update.email is not None:
        nursery.email = nursery_update.email
    if nursery_update.main_address is not None:
        nursery.main_street = nursery_update.main_address.get('street')
        nursery.main_city = nursery_update.main_address.get('city')
        nursery.main_governorate = nursery_update.main_address.get('governorate')
        nursery.main_postal_code = nursery_update.main_address.get('postalCode')
    if nursery_update.age_range is not None:
        nursery.min_age_days = nursery_update.age_range.get('minAge', nursery.min_age_days)
        nursery.max_age_months = nursery_update.age_range.get('maxAge', nursery.max_age_months)
    if nursery_update.notes is not None:
        nursery.notes = nursery_update.notes

    db.commit()
    db.refresh(nursery)

    # Format and return updated nursery
    formatted_nursery = {
        "id": nursery.id,
        "name": nursery.name,
        "mainPhone": nursery.main_phone,
        "email": nursery.email,
        "mainStreet": nursery.main_street,
        "mainCity": nursery.main_city,
        "mainGovernorate": nursery.main_governorate,
        "mainPostalCode": nursery.main_postal_code,
        "minAgeDays": nursery.min_age_days,
        "maxAgeMonths": nursery.max_age_months,
        "notes": nursery.notes,
        "isActive": nursery.is_active,
        "createdAt": nursery.created_at,
        "updatedAt": nursery.updated_at,
        "branches": []
    }

    # Add branches
    branches = db.query(Branch).filter(Branch.nursery_id == nursery.id).all()
    for branch in branches:
        formatted_branch = {
            "id": branch.id,
            "name": branch.name,
            "address": {
                "street": branch.address_street,
                "city": branch.address_city,
                "governorate": branch.address_governorate,
                "postalCode": branch.address_postal_code,
            },
            "phone": branch.phone,
            "nurseryId": branch.nursery_id,
            "createdAt": branch.created_at,
            "updatedAt": branch.updated_at,
        }
        formatted_nursery["branches"].append(formatted_branch)

    return formatted_nursery

@router.delete("/{nursery_id}")
async def delete_nursery(
    nursery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete nursery (Admin only)"""
    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    db.delete(nursery)
    db.commit()
    return BaseResponse(message="Nursery deleted successfully")

# Branch endpoints
@router.get("/{nursery_id}/branches")
async def get_nursery_branches(
    nursery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all branches for a nursery (Admin only)"""
    branches = db.query(Branch).filter(Branch.nursery_id == nursery_id).all()

    # Format branches for response
    formatted_branches = []
    for branch in branches:
        formatted_branch = {
            "id": branch.id,
            "name": branch.name,
            "address": {
                "street": branch.address_street,
                "city": branch.address_city,
                "governorate": branch.address_governorate,
                "postalCode": branch.address_postal_code,
            },
            "phone": branch.phone,
            "nurseryId": branch.nursery_id,
            "createdAt": branch.created_at,
            "updatedAt": branch.updated_at,
        }
        formatted_branches.append(formatted_branch)

    return formatted_branches

@router.post("/{nursery_id}/branches")
async def create_branch(
    nursery_id: int,
    branch: BranchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new branch for a nursery (Admin only)"""
    # Verify nursery exists
    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    db_branch = Branch(
        nursery_id=nursery_id,
        name=branch.name,
        address_street=branch.address.get('street'),
        address_city=branch.address.get('city'),
        address_governorate=branch.address.get('governorate'),
        address_postal_code=branch.address.get('postalCode'),
        phone=branch.phone
    )
    db.add(db_branch)
    db.commit()
    db.refresh(db_branch)

    # Format branch for response
    return {
        "id": db_branch.id,
        "name": db_branch.name,
        "address": {
            "street": db_branch.address_street,
            "city": db_branch.address_city,
            "governorate": db_branch.address_governorate,
            "postalCode": db_branch.address_postal_code,
        },
        "phone": db_branch.phone,
        "nurseryId": db_branch.nursery_id,
        "createdAt": db_branch.created_at,
        "updatedAt": db_branch.updated_at,
    }

@router.get("/branches/{branch_id}")
async def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get branch by ID (Admin only)"""
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Format branch for response
    return {
        "id": branch.id,
        "name": branch.name,
        "address": {
            "street": branch.address_street,
            "city": branch.address_city,
            "governorate": branch.address_governorate,
            "postalCode": branch.address_postal_code,
        },
        "phone": branch.phone,
        "nurseryId": branch.nursery_id,
        "createdAt": branch.created_at,
        "updatedAt": branch.updated_at,
    }

@router.put("/branches/{branch_id}")
async def update_branch(
    branch_id: int,
    branch_update: BranchUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update branch (Admin only)"""
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Update branch fields
    if branch_update.name is not None:
        branch.name = branch_update.name
    if branch_update.address is not None:
        branch.address_street = branch_update.address.get('street')
        branch.address_city = branch_update.address.get('city')
        branch.address_governorate = branch_update.address.get('governorate')
        branch.address_postal_code = branch_update.address.get('postalCode')
    if branch_update.phone is not None:
        branch.phone = branch_update.phone

    db.commit()
    db.refresh(branch)

    # Format branch for response
    return {
        "id": branch.id,
        "name": branch.name,
        "address": {
            "street": branch.address_street,
            "city": branch.address_city,
            "governorate": branch.address_governorate,
            "postalCode": branch.address_postal_code,
        },
        "phone": branch.phone,
        "nurseryId": branch.nursery_id,
        "createdAt": branch.created_at,
        "updatedAt": branch.updated_at,
    }

@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete branch (Admin only)"""
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    db.delete(branch)
    db.commit()
    return BaseResponse(message="Branch deleted successfully")

# Classroom endpoints
@router.get("/branches/{branch_id}/classrooms")
async def get_branch_classrooms(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get all classrooms for a branch (Admin only)"""
    classrooms = db.query(Classroom).filter(Classroom.branch_id == branch_id).all()
    return classrooms

@router.post("/branches/{branch_id}/classrooms")
async def create_classroom(
    branch_id: int,
    classroom: ClassroomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Create a new classroom for a branch (Admin only)"""
    # Verify branch exists
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    db_classroom = Classroom(**classroom.dict(), branch_id=branch_id)
    db.add(db_classroom)
    db.commit()
    db.refresh(db_classroom)
    return db_classroom

@router.get("/classrooms/{classroom_id}")
async def get_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Get classroom by ID (Admin only)"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom

@router.put("/classrooms/{classroom_id}")
async def update_classroom(
    classroom_id: int,
    classroom_update: ClassroomUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update classroom (Admin only)"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    for field, value in classroom_update.dict(exclude_unset=True).items():
        setattr(classroom, field, value)

    db.commit()
    db.refresh(classroom)
    return classroom

@router.delete("/classrooms/{classroom_id}")
async def delete_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete classroom (Admin only)"""
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    db.delete(classroom)
    db.commit()
    return BaseResponse(message="Classroom deleted successfully")