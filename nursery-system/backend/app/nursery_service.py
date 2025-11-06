"""Nursery service layer with business logic."""
from __future__ import annotations

import secrets
import string
from typing import Any, Dict, Optional

from fastapi import HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from .models import Nursery, RoleEnum, User
from .nursery_helpers import (
    generate_manager_email,
    normalize_text,
    to_e164_jordan,
    validate_jordan_phone,
)
from .security import hash_password

NAME_REQUIRED_MESSAGE = "اسم الحضانة مطلوب (٣ أحرف على الأقل)"
BRANCH_REQUIRED_MESSAGE = "اسم الفرع مطلوب"
PHONE_INVALID_MESSAGE = "رقم الهاتف الأردني غير صحيح (مثال: 07XXXXXXXX)"
NAME_TAKEN_MESSAGE = "اسم الحضانة مستخدم بالفعل."
PHONE_TAKEN_MESSAGE = "رقم الهاتف الرئيسي مستخدم بالفعل."
DATABASE_ERROR_MESSAGE = "تعذّر حفظ البيانات، حاول مرة أخرى لاحقًا."
UNEXPECTED_ERROR_MESSAGE = "حدث خطأ غير متوقع، حاول لاحقًا."


def _strip(value: Optional[str]) -> Optional[str]:
    """Trim string values safely."""
    return value.strip() if value else None


def _ensure_min_length(value: str, minimum: int = 3) -> bool:
    """Check that a value contains at least `minimum` non-space characters."""
    return len(value.replace(" ", "")) >= minimum


def generate_temp_password(min_length: int = 12, max_length: int = 16) -> str:
    """Generate a secure temporary password that meets basic complexity rules."""
    rng = secrets.SystemRandom()
    if min_length > max_length:
        raise ValueError("min_length must be less than or equal to max_length")

    length = rng.randrange(min_length, max_length + 1)
    if length < 3:
        length = 3

    categories = (
        string.ascii_lowercase,
        string.ascii_uppercase,
        string.digits,
    )

    password_chars = [secrets.choice(category) for category in categories]

    alphabet = "".join(categories)
    remaining = max(0, length - len(password_chars))
    password_chars.extend(secrets.choice(alphabet) for _ in range(remaining))

    rng.shuffle(password_chars)
    return "".join(password_chars)


def check_email_exists(db: Session, email: str) -> bool:
    """Check if an email already exists in a case-insensitive manner."""
    email_norm = email.lower().strip()
    return db.query(User).filter(User.email_normalized == email_norm).first() is not None


def _generate_unique_manager_email(
    db: Session,
    name: str,
    branch_name: Optional[str],
) -> str:
    """Generate a unique manager email using the provided session."""

    def exists(candidate: str) -> bool:
        return check_email_exists(db, candidate)

    return generate_manager_email(name, branch_name, exists)


def create_nursery_with_director(
    db: Session,
    name: str,
    main_phone: str,
    is_branch: bool = False,
    branch_name: Optional[str] = None,
    email: Optional[str] = None,
    governorate: Optional[str] = None,
    city: Optional[str] = None,
    postal_code: Optional[str] = None,
    address_line: Optional[str] = None,
    min_age_days: int = 70,
    max_age_months: int = 52,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """Create a nursery (or branch) and auto-provision its director account."""

    name_original = _strip(name) or ""
    name_normalized = normalize_text(name_original)

    if not name_normalized or not _ensure_min_length(name_normalized):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_NAME", "message": NAME_REQUIRED_MESSAGE},
        )

    branch_original = _strip(branch_name) or ""
    branch_normalized = normalize_text(branch_original) if is_branch else ""

    if is_branch and not branch_normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_BRANCH_NAME", "message": BRANCH_REQUIRED_MESSAGE},
        )

    phone_original = _strip(main_phone) or ""
    if not validate_jordan_phone(phone_original):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "INVALID_PHONE", "message": PHONE_INVALID_MESSAGE},
        )

    phone_normalized = to_e164_jordan(phone_original)

    existing_by_name = (
        db.query(Nursery)
        .filter(
            Nursery.name_normalized == name_normalized,
            Nursery.branch_normalized == branch_normalized,
        )
        .first()
    )
    if existing_by_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "NURSERY_NAME_TAKEN", "message": NAME_TAKEN_MESSAGE},
        )

    existing_by_phone = (
        db.query(Nursery)
        .filter(Nursery.phone_normalized == phone_normalized)
        .first()
    )
    if existing_by_phone:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "NURSERY_PHONE_TAKEN", "message": PHONE_TAKEN_MESSAGE},
        )

    try:
        nursery = Nursery(
            name=name_original,
            name_normalized=name_normalized,
            is_branch=is_branch,
            branch_name=branch_original if is_branch else None,
            branch_normalized=branch_normalized,
            main_phone=phone_original,
            phone_normalized=phone_normalized,
            email=_strip(email),
            main_governorate=_strip(governorate),
            main_city=_strip(city),
            main_postal_code=_strip(postal_code),
            main_street=_strip(address_line),
            min_age_days=min_age_days,
            max_age_months=max_age_months,
            notes=_strip(notes),
            is_active=True,
        )
        db.add(nursery)
        db.flush()

        director_email = _generate_unique_manager_email(
            db,
            name_original,
            branch_original if is_branch else None,
        )
        temp_password = generate_temp_password()

        director = User(
            email=director_email,
            email_normalized=director_email.lower(),
            hashed_password=hash_password(temp_password),
            temp_password=temp_password,
            must_reset_password=True,
            first_name="Director",
            last_name=name_original,
            phone=phone_original,
            role=RoleEnum.DIRECTOR,
            nursery_id=nursery.id,
            is_active=True,
        )
        db.add(director)
        db.commit()

        scope_label = branch_original if is_branch else "Main"
        return {
            "nurseryId": nursery.id,
            "manager": {"email": director_email, "tempPassword": temp_password},
            "scope": scope_label,
        }

    except IntegrityError as exc:
        db.rollback()
        error_message = str(exc.orig).lower() if exc.orig else ""

        if "idx_nurseries_name_branch" in error_message or "name_normalized" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "NURSERY_NAME_TAKEN", "message": NAME_TAKEN_MESSAGE},
            ) from exc

        if "idx_nurseries_phone" in error_message or "phone_normalized" in error_message:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail={"code": "NURSERY_PHONE_TAKEN", "message": PHONE_TAKEN_MESSAGE},
            ) from exc

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "DATABASE_ERROR", "message": DATABASE_ERROR_MESSAGE},
        ) from exc

    except HTTPException:
        raise
    except Exception as exc:  # pragma: no cover - defensive catch-all
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"code": "INTERNAL_ERROR", "message": UNEXPECTED_ERROR_MESSAGE},
        ) from exc
