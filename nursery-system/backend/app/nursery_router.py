from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Dict, Any

from .database import get_db
from .models import Nursery, Branch, Classroom, User, RoleEnum
from .schemas import (
    NurseryCreateRequest,
    NurseryUpdate,
    BranchCreate,
    BranchUpdate,
    ClassroomCreate,
    ClassroomUpdate,
    BaseResponse,
)
from .nursery_service import create_nursery_with_director
from .dependencies import require_admin
from .security import hash_password
from .audit_helper import log_create, log_update, log_delete
from .nursery_helpers import to_e164_jordan

router = APIRouter()


def _format_branch(branch: Branch) -> Dict[str, Any]:
    if branch is None:
        return {}

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


def _format_nursery(nursery: Nursery, branches: Optional[List[Branch]] = None) -> Dict[str, Any]:
    if nursery is None:
        return {}

    branch_list = branches if branches is not None else list(getattr(nursery, "branches", []))

    return {
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
        "branches": [_format_branch(branch) for branch in branch_list],
    }


def _get_nursery_or_404(nursery_id: int, db: Session) -> Nursery:
    nursery = db.query(Nursery).filter(Nursery.id == nursery_id).first()
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")
    return nursery


def _apply_branch_updates(
    nursery: Nursery,
    branches_payload: Optional[List[Dict[str, Any]]],
    db: Session,
    enforce_name: Optional[str] = None,
) -> None:
    if branches_payload is None:
        return

    existing_branches = {
        branch.id: branch
        for branch in db.query(Branch).filter(Branch.nursery_id == nursery.id)
    }
    retained_branch_ids = set()

    enforced_name = enforce_name or nursery.name

    for branch_data in branches_payload:
        branch_id = branch_data.get("id")
        address = branch_data.get("address") or {}

        if branch_id:
            branch = existing_branches.get(branch_id)
            if not branch:
                raise HTTPException(
                    status_code=404,
                    detail=f"Branch {branch_id} not found for nursery {nursery.id}",
                )
            branch.name = enforced_name
            if branch_data.get("phone") is not None:
                branch.phone = branch_data.get("phone")
            if address:
                branch.address_street = address.get("street")
                branch.address_city = address.get("city")
                branch.address_governorate = address.get("governorate")
                branch.address_postal_code = address.get("postalCode")
            retained_branch_ids.add(branch.id)
        else:
            new_branch = Branch(
                nursery_id=nursery.id,
                name=enforced_name,
                address_street=address.get("street"),
                address_city=address.get("city"),
                address_governorate=address.get("governorate"),
                address_postal_code=address.get("postalCode"),
                phone=branch_data.get("phone"),
            )
            db.add(new_branch)
            db.flush()
            retained_branch_ids.add(new_branch.id)

    # Remove branches omitted from payload
    for existing_id, branch in existing_branches.items():
        if existing_id not in retained_branch_ids:
            db.delete(branch)


# Nursery endpoints
@router.get("/nurseries")
async def get_nurseries(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    nurseries = (
        db.query(Nursery)
        .options(selectinload(Nursery.branches))
        .order_by(Nursery.created_at.desc())  # Sort newest first
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_format_nursery(nursery) for nursery in nurseries]


@router.post("/nurseries", status_code=status.HTTP_201_CREATED)
async def create_nursery(
    payload: NurseryCreateRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a nursery with optional branches and auto-provision director/manager accounts."""
    from .models import Governorate, Branch
    from .nursery_helpers import normalize_text, to_e164_jordan
    from .nursery_service import generate_temp_password, _generate_unique_manager_email
    from .security import hash_password
    from sqlalchemy.exc import IntegrityError
    
    # Validate governorate if provided
    governorate_id = payload.governorate_id
    if governorate_id:
        gov = db.query(Governorate).filter(Governorate.id == governorate_id).first()
        if not gov:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"code": "INVALID_GOVERNORATE", "message": "المحافظة المحددة غير موجودة"}
            )
    
    # Normalize and validate
    name_normalized = normalize_text(payload.name.strip())
    phone_normalized = to_e164_jordan(payload.main_phone.strip())
    
    # Check for duplicates
    existing_by_name = db.query(Nursery).filter(
        Nursery.name_normalized == name_normalized,
        Nursery.branch_normalized == ""
    ).first()
    if existing_by_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "NURSERY_NAME_TAKEN", "message": "اسم الحضانة مستخدم بالفعل."}
        )
    
    existing_by_phone = db.query(Nursery).filter(
        Nursery.phone_normalized == phone_normalized
    ).first()
    if existing_by_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "NURSERY_PHONE_TAKEN", "message": "رقم الهاتف الرئيسي مستخدم بالفعل."}
        )
    
    try:
        # Create main nursery
        nursery = Nursery(
            name=payload.name.strip(),
            name_normalized=name_normalized,
            is_branch=False,
            branch_name=None,
            branch_normalized="",
            main_phone=payload.main_phone.strip(),
            phone_normalized=phone_normalized,
            email=payload.email.strip() if payload.email else None,
            governorate_id=governorate_id,
            main_governorate=payload.governorate.strip() if payload.governorate else None,
            main_city=payload.city.strip() if payload.city else None,
            main_postal_code=payload.postal_code.strip() if payload.postal_code else None,
            main_street=payload.address_line.strip() if payload.address_line else None,
            min_age_days=payload.min_age_days,
            max_age_months=payload.max_age_months,
            notes=payload.notes.strip() if payload.notes else None,
            is_active=True,
        )
        db.add(nursery)
        db.flush()
        
        # Create director account
        director_email = _generate_unique_manager_email(db, payload.name.strip(), None)
        temp_password = generate_temp_password()
        
        director = User(
            email=director_email,
            email_normalized=director_email.lower(),
            hashed_password=hash_password(temp_password),
            temp_password=temp_password,
            must_reset_password=True,
            first_name="Director",
            last_name=payload.name.strip(),
            phone=payload.main_phone.strip(),
            role=RoleEnum.DIRECTOR,
            nursery_id=nursery.id,
            branch_id=None,
            is_active=True,
        )
        db.add(director)
        
        # Create branches and managers if requested
        managers = []
        if payload.has_branches and payload.number_of_branches > 0:
            for i in range(payload.number_of_branches):
                # Get branch name from payload or use default
                branch_name = f"فرع {i + 1}"
                if i < len(payload.branches) and payload.branches[i].get("name"):
                    branch_name = payload.branches[i]["name"].strip()
                
                # Create Branch record
                branch = Branch(
                    nursery_id=nursery.id,
                    name=branch_name,
                    address_street=payload.branches[i].get("address", {}).get("street") if i < len(payload.branches) else None,
                    address_city=payload.branches[i].get("address", {}).get("city") if i < len(payload.branches) else None,
                    address_governorate=payload.branches[i].get("address", {}).get("governorate") if i < len(payload.branches) else None,
                    address_postal_code=payload.branches[i].get("address", {}).get("postalCode") if i < len(payload.branches) else None,
                    phone=payload.branches[i].get("phone") if i < len(payload.branches) else None,
                )
                db.add(branch)
                db.flush()
                
                # Create Manager account if enabled
                if payload.branch_managers_enabled:
                    manager_email = _generate_unique_manager_email(db, payload.name.strip(), branch_name)
                    manager_temp_password = generate_temp_password()
                    
                    manager = User(
                        email=manager_email,
                        email_normalized=manager_email.lower(),
                        hashed_password=hash_password(manager_temp_password),
                        temp_password=manager_temp_password,
                        must_reset_password=True,
                        first_name="Manager",
                        last_name=f"{payload.name.strip()} - {branch_name}",
                        phone=payload.main_phone.strip(),
                        role=RoleEnum.MANAGER,
                        nursery_id=nursery.id,
                        branch_id=branch.id,
                        is_active=True,
                    )
                    db.add(manager)
                    
                    managers.append({
                        "email": manager_email,
                        "temporaryPassword": manager_temp_password,
                        "branchName": branch_name
                    })
        
        db.commit()
        
        # Log creation
        log_create(
            db,
            current_user,
            "nursery",
            nursery.id,
            details={
                "name": payload.name.strip(),
                "has_branches": payload.has_branches,
                "number_of_branches": payload.number_of_branches if payload.has_branches else 0,
                "phone_normalized": phone_normalized,
            },
            request=request,
        )
        
        # Return response with nursery and managers
        response = {
            "nursery": {
                "id": nursery.id,
                "name": nursery.name,
                "mainPhone": nursery.main_phone,
                "email": nursery.email,
                "governorateId": nursery.governorate_id,
            },
            "director": {
                "email": director_email,
                "temporaryPassword": temp_password
            },
            "managers": managers
        }
        
        return response
        
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DATABASE_ERROR", "message": "تعذّر حفظ البيانات، حاول مرة أخرى لاحقًا."}
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": "حدث خطأ غير متوقع، حاول لاحقًا."}
        ) from exc

@router.get("/nurseries/{nursery_id}")
async def get_nursery(
    nursery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    nursery = (
        db.query(Nursery)
        .options(selectinload(Nursery.branches))
        .filter(Nursery.id == nursery_id)
        .first()
    )
    if not nursery:
        raise HTTPException(status_code=404, detail="Nursery not found")

    return _format_nursery(nursery)


@router.put("/nurseries/{nursery_id}")
async def update_nursery(
    nursery_id: int,
    nursery_update: NurseryUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    import secrets
    import string

    nursery = _get_nursery_or_404(nursery_id, db)

    # Track existing branch IDs before update
    existing_branch_ids = {branch.id for branch in db.query(Branch).filter(Branch.nursery_id == nursery_id).all()}

    if nursery_update.name is not None:
        nursery.name = nursery_update.name
    if nursery_update.main_phone is not None:
        nursery.main_phone = nursery_update.main_phone
    if nursery_update.email is not None:
        nursery.email = nursery_update.email
    if nursery_update.main_address is not None:
        nursery.main_street = nursery_update.main_address.get("street")
        nursery.main_city = nursery_update.main_address.get("city")
        nursery.main_governorate = nursery_update.main_address.get("governorate")
        nursery.main_postal_code = nursery_update.main_address.get("postalCode")
    if nursery_update.age_range is not None:
        nursery.min_age_days = nursery_update.age_range.get("minAge", nursery.min_age_days)
        nursery.max_age_months = nursery_update.age_range.get("maxAge", nursery.max_age_months)
    if nursery_update.notes is not None:
        nursery.notes = nursery_update.notes

    _apply_branch_updates(nursery, nursery_update.branches, db, enforce_name=nursery.name)

    # Find new branches after update
    db.flush()
    current_branches = db.query(Branch).filter(Branch.nursery_id == nursery_id).all()
    new_branches = [b for b in current_branches if b.id not in existing_branch_ids]

    # Generate manager accounts for new branches
    manager_credentials = []
    if new_branches:
        def generate_password() -> str:
            return "".join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))

        def unique_email(preferred: Optional[str], fallback_prefix: str) -> str:
            if preferred:
                candidate = preferred.strip().lower()
                if candidate and not db.query(User).filter(User.email == candidate).first():
                    return candidate
            base_candidate = f"{fallback_prefix}@nursery.com"
            if not db.query(User).filter(User.email == base_candidate).first():
                return base_candidate
            counter = 1
            while True:
                candidate = f"{fallback_prefix}_{counter}@nursery.com"
                if not db.query(User).filter(User.email == candidate).first():
                    return candidate
                counter += 1

        # Count existing managers for this nursery
        existing_managers_count = db.query(User).filter(
            User.nursery_id == nursery_id,
            User.role == RoleEnum.MANAGER
        ).count()

        for idx, branch in enumerate(new_branches, start=existing_managers_count + 1):
            branch_password = generate_password()
            branch_email = unique_email(
                None,
                f"manager_{nursery_id}_branch_{idx}"
            )
            user = User(
                email=branch_email,
                hashed_password=hash_password(branch_password),
                first_name="Manager",
                last_name=nursery.name,
                phone=branch.phone or nursery.main_phone,
                role=RoleEnum.MANAGER,
                nursery_id=nursery_id,
                is_active=True,
            )
            db.add(user)
            db.flush()
            manager_credentials.append({
                "scope": f"Branch {idx}",
                "username": branch_email,
                "email": branch_email,
                "tempPassword": branch_password,
                "temporaryPassword": branch_password,
                "fullName": f"Manager {nursery.name}",
                "branchId": branch.id,
                "branchName": branch.name,
                "nurseryId": nursery_id,
            })

    # Log the nursery update
    changes = {}
    if nursery_update.name is not None:
        changes["name"] = nursery_update.name
    if nursery_update.email is not None:
        changes["email"] = nursery_update.email
    if new_branches:
        changes["new_branches"] = len(new_branches)

    log_update(
        db, current_user, "nursery", nursery_id,
        details={
            "changes": changes,
            "new_managers": len(manager_credentials)
        },
        request=request
    )

    db.commit()
    db.refresh(nursery)

    response = _format_nursery(nursery)
    if manager_credentials:
        response["managers"] = manager_credentials
        response["message"] = f"Nursery updated successfully. {len(manager_credentials)} new manager account(s) created."
    return response


@router.delete("/nurseries/{nursery_id}")
async def delete_nursery(
    nursery_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    nursery = _get_nursery_or_404(nursery_id, db)

    # Log the deletion before removing
    log_delete(
        db, current_user, "nursery", nursery_id,
        details={
            "name": nursery.name,
            "email": nursery.email,
            "main_city": nursery.main_city
        },
        request=request
    )

    db.delete(nursery)
    db.commit()
    return BaseResponse(message="Nursery deleted successfully")


# Branch endpoints
@router.get("/nurseries/{nursery_id}/branches")
async def get_nursery_branches(
    nursery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    branches = db.query(Branch).filter(Branch.nursery_id == nursery_id).all()
    return [_format_branch(branch) for branch in branches]


@router.post("/nurseries/{nursery_id}/branches")
async def create_branch(
    nursery_id: int,
    branch: BranchCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    _get_nursery_or_404(nursery_id, db)

    db_branch = Branch(
        nursery_id=nursery_id,
        name=branch.name,
        address_street=branch.address.get("street"),
        address_city=branch.address.get("city"),
        address_governorate=branch.address.get("governorate"),
        address_postal_code=branch.address.get("postalCode"),
        phone=branch.phone,
    )
    db.add(db_branch)
    db.flush()

    # Log the branch creation
    log_create(
        db, current_user, "branch", db_branch.id,
        details={
            "name": db_branch.name,
            "nursery_id": nursery_id,
            "city": branch.address.get("city")
        },
        request=request
    )

    db.commit()
    db.refresh(db_branch)
    return _format_branch(db_branch)


@router.get("/branches/{branch_id}")
async def get_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")
    return _format_branch(branch)


@router.put("/branches/{branch_id}")
async def update_branch(
    branch_id: int,
    branch_update: BranchUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Track changes
    changes = {}
    if branch_update.name is not None:
        changes["name"] = branch_update.name
        branch.name = branch_update.name
    if branch_update.address is not None:
        changes["address"] = branch_update.address
        branch.address_street = branch_update.address.get("street")
        branch.address_city = branch_update.address.get("city")
        branch.address_governorate = branch_update.address.get("governorate")
        branch.address_postal_code = branch_update.address.get("postalCode")
    if branch_update.phone is not None:
        changes["phone"] = branch_update.phone
        branch.phone = branch_update.phone

    # Log the branch update
    if changes:
        log_update(
            db, current_user, "branch", branch_id,
            details={"changes": changes, "nursery_id": branch.nursery_id},
            request=request
        )

    db.commit()
    db.refresh(branch)
    return _format_branch(branch)


@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    # Log the deletion before removing
    log_delete(
        db, current_user, "branch", branch_id,
        details={
            "name": branch.name,
            "nursery_id": branch.nursery_id,
            "city": branch.address_city
        },
        request=request
    )

    db.delete(branch)
    db.commit()
    return BaseResponse(message="Branch deleted successfully")


# Classroom endpoints
@router.get("/branches/{branch_id}/classrooms")
async def get_branch_classrooms(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    classrooms = db.query(Classroom).filter(Classroom.branch_id == branch_id).all()
    return classrooms


@router.post("/branches/{branch_id}/classrooms")
async def create_classroom(
    branch_id: int,
    classroom: ClassroomCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    classroom_data = classroom.dict()
    classroom_data["branch_id"] = branch_id
    db_classroom = Classroom(**classroom_data)
    db.add(db_classroom)
    db.flush()

    # Log the classroom creation
    log_create(
        db, current_user, "classroom", db_classroom.id,
        details={
            "name": db_classroom.name,
            "branch_id": branch_id,
            "capacity": db_classroom.capacity
        },
        request=request
    )

    db.commit()
    db.refresh(db_classroom)
    return db_classroom


@router.get("/classrooms/{classroom_id}")
async def get_classroom(
    classroom_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")
    return classroom


@router.put("/classrooms/{classroom_id}")
async def update_classroom(
    classroom_id: int,
    classroom_update: ClassroomUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    # Track changes
    changes = classroom_update.dict(exclude_unset=True)

    for field, value in changes.items():
        setattr(classroom, field, value)

    # Log the classroom update
    if changes:
        log_update(
            db, current_user, "classroom", classroom_id,
            details={"changes": changes, "branch_id": classroom.branch_id},
            request=request
        )

    db.commit()
    db.refresh(classroom)
    return classroom


@router.delete("/classrooms/{classroom_id}")
async def delete_classroom(
    classroom_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    # Log the deletion before removing
    log_delete(
        db, current_user, "classroom", classroom_id,
        details={
            "name": classroom.name,
            "branch_id": classroom.branch_id,
            "capacity": classroom.capacity
        },
        request=request
    )

    db.delete(classroom)
    db.commit()
    return BaseResponse(message="Classroom deleted successfully")
