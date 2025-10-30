from fastapi import APIRouter, Depends, HTTPException
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
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [_format_nursery(nursery) for nursery in nurseries]


@router.post("/nurseries")
async def create_nursery(
    nursery: NurseryCreate,
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
        base_candidate = f"{fallback_prefix}@nursery.local"
        if not db.query(User).filter(User.email == base_candidate).first():
            return base_candidate
        counter = 1
        while True:
            candidate = f"{fallback_prefix}_{counter}@nursery.local"
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
            hashed_password=hash_password(password),
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    nursery = _get_nursery_or_404(nursery_id, db)

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

    db.commit()
    db.refresh(nursery)
    return _format_nursery(nursery)


@router.delete("/nurseries/{nursery_id}")
async def delete_nursery(
    nursery_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    nursery = _get_nursery_or_404(nursery_id, db)

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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    branch = db.query(Branch).filter(Branch.id == branch_id).first()
    if not branch:
        raise HTTPException(status_code=404, detail="Branch not found")

    if branch_update.name is not None:
        branch.name = branch_update.name
    if branch_update.address is not None:
        branch.address_street = branch_update.address.get("street")
        branch.address_city = branch_update.address.get("city")
        branch.address_governorate = branch_update.address.get("governorate")
        branch.address_postal_code = branch_update.address.get("postalCode")
    if branch_update.phone is not None:
        branch.phone = branch_update.phone

    db.commit()
    db.refresh(branch)
    return _format_branch(branch)


@router.delete("/branches/{branch_id}")
async def delete_branch(
    branch_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
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
    current_user: User = Depends(require_admin),
):
    classrooms = db.query(Classroom).filter(Classroom.branch_id == branch_id).all()
    return classrooms


@router.post("/branches/{branch_id}/classrooms")
async def create_classroom(
    branch_id: int,
    classroom: ClassroomCreate,
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
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
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
    current_user: User = Depends(require_admin),
):
    classroom = db.query(Classroom).filter(Classroom.id == classroom_id).first()
    if not classroom:
        raise HTTPException(status_code=404, detail="Classroom not found")

    db.delete(classroom)
    db.commit()
    return BaseResponse(message="Classroom deleted successfully")
