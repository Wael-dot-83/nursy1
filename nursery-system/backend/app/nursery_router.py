from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session, selectinload
from typing import List, Optional, Dict, Any

from .database import get_db
from .models import Nursery, Branch, Classroom, User, RoleEnum
from .schemas import (
    NurseryCreate,
    NurseryUpdate,
    BranchCreate,
    BranchUpdate,
    ClassroomCreate,
    ClassroomUpdate,
    BaseResponse,
)
from .dependencies import require_admin
from .security import hash_password
from .audit_helper import log_create, log_update, log_delete

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


@router.post("/nurseries")
async def create_nursery(
    nursery: NurseryCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    import secrets
    import string

    db_nursery = Nursery(
        name=nursery.name,
        main_street=nursery.main_address.get("street"),
        main_city=nursery.main_address.get("city"),
        main_governorate=nursery.main_address.get("governorate"),
        main_postal_code=nursery.main_address.get("postalCode"),
        main_phone=nursery.main_phone,
        email=nursery.email,
        min_age_days=nursery.age_range.get("minAge", 70),
        max_age_months=nursery.age_range.get("maxAge", 52),
        notes=nursery.notes,
        is_active=True,
    )

    db.add(db_nursery)
    db.flush()  # Populate primary key

    created_branches: List[Branch] = []
    branch_ids: List[int] = []
    manager_credentials: List[Dict[str, Any]] = []

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

    def create_manager_account(
        *,
        scope: str,
        email: str,
        password: str,
        first_name: str,
        last_name: str,
        phone: Optional[str],
        branch: Optional[Branch] = None,
    ) -> User:
        user = User(
            email=email,
            username=email,
            hashed_password=hash_password(password),
            temp_password=password,
            first_name=first_name,
            last_name=last_name,
            phone=phone,
            role=RoleEnum.MANAGER,
            nursery_id=db_nursery.id,
            is_active=True,
        )
        db.add(user)
        db.flush()
        manager_credentials.append(
            {
                "scope": scope,
                "username": email,
                "email": email,
                "tempPassword": password,
                "temporaryPassword": password,
                "fullName": f"{first_name} {last_name}".strip(),
                "branchId": branch.id if branch else None,
                "branchName": branch.name if branch else None,
                "nurseryId": db_nursery.id,
            }
        )
        return user

    try:
        if nursery.branches:
            for branch_data in nursery.branches:
                address = branch_data.get("address") or {}
                branch_phone = (branch_data.get("phone") or branch_data.get("primaryPhone") or "").strip()
                db_branch = Branch(
                    nursery_id=db_nursery.id,
                    name=db_nursery.name,
                    address_street=address.get("street"),
                    address_city=address.get("city"),
                    address_governorate=address.get("governorate"),
                    address_postal_code=address.get("postalCode"),
                    phone=branch_phone or None,
                )
                db.add(db_branch)
                db.flush()
                created_branches.append(db_branch)
                branch_ids.append(db_branch.id)

        main_manager_password = generate_password()
        main_manager_email = unique_email(nursery.email, f"manager_{db_nursery.id}")
        create_manager_account(
            scope="Main",
            email=main_manager_email,
            password=main_manager_password,
            first_name="Manager",
            last_name=f"Nursery {db_nursery.id}",
            phone=nursery.main_phone,
        )

        for idx, branch in enumerate(created_branches, start=1):
            branch_password = generate_password()
            branch_email = unique_email(
                None,
                f"manager_{db_nursery.id}_branch_{idx}"
            )
            create_manager_account(
                scope=f"Branch {idx}",
                email=branch_email,
                password=branch_password,
                first_name="Manager",
                last_name=db_nursery.name,
                phone=branch.phone or nursery.main_phone,
                branch=branch,
            )

        # Log the nursery creation
        log_create(
            db, current_user, "nursery", db_nursery.id,
            details={
                "name": db_nursery.name,
                "email": db_nursery.email,
                "branches_count": len(created_branches),
                "managers_created": len(manager_credentials)
            },
            request=request
        )

        db.commit()
    except Exception:
        db.rollback()
        raise

    db.refresh(db_nursery)

    branches = created_branches or list(db.query(Branch).filter(Branch.nursery_id == db_nursery.id).all())
    serialized_nursery = _format_nursery(db_nursery, branches=branches)
    serialized_nursery.update(
        {
            "success": True,
            "nurseryId": db_nursery.id,
            "branchIds": branch_ids,
            "managers": manager_credentials,
            "hasBranches": bool(branch_ids),
        }
    )
    serialized_nursery["manager"] = manager_credentials[0] if manager_credentials else None
    return serialized_nursery


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
                username=branch_email,
                hashed_password=hash_password(branch_password),
                temp_password=branch_password,
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
