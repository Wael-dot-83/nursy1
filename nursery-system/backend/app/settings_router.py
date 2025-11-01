"""
Settings router for system configuration
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from .database import get_db
from .dependencies import require_admin
from .models import User
from .schemas import BaseResponse
from .audit_helper import log_settings_change, log_create, log_update, log_delete
import json
import os

router = APIRouter()

# Simple file-based settings storage for now
SETTINGS_FILE = "app_settings.json"

def get_settings():
    """Load settings from file"""
    if os.path.exists(SETTINGS_FILE):
        with open(SETTINGS_FILE, 'r') as f:
            return json.load(f)
    return {
        "security": {
            "password_policy": {
                "min_length": 8,
                "require_uppercase": True,
                "require_lowercase": True,
                "require_numbers": True,
                "require_special": False
            },
            "session_timeout": 1800,
            "lockout_threshold": 5,
            "otp_enabled_for_admins": False,
            "cors_allowed_origins": ["http://localhost:5173", "http://localhost:5174"]
        },
        "organization": {
            "language": "ar",
            "timezone": "Asia/Amman",
            "date_format": "DD/MM/YYYY",
            "notifications": {
                "sms_enabled": True,
                "email_enabled": True,
                "push_enabled": False
            }
        },
        "governorates": [
            "عمان", "إربد", "الزرقاء", "المفرق", "الطفيلة",
            "معان", "العقبة", "الكرك", "مادبا", "عجلون", "جرش", "السلط"
        ],
        "age_categories": [
            {"id": "infant", "name": "رضع (0-1 سنة)", "min_days": 0, "max_months": 12},
            {"id": "toddler", "name": "أطفال صغار (1-2 سنوات)", "min_days": 365, "max_months": 24},
            {"id": "preschool", "name": "مرحلة ما قبل المدرسة (2-5 سنوات)", "min_days": 730, "max_months": 60},
            {"id": "school_age", "name": "عمر المدرسة (5 سنوات فما فوق)", "min_days": 1825, "max_months": None}
        ]
    }

def save_settings(settings: dict):
    """Save settings to file"""
    with open(SETTINGS_FILE, 'w', encoding='utf-8') as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)

@router.get("/")
async def get_all_settings(
    current_user: User = Depends(require_admin)
):
    """Get all system settings (Admin only)"""
    return get_settings()

@router.get("/security")
async def get_security_settings(
    current_user: User = Depends(require_admin)
):
    """Get security settings (Admin only)"""
    settings = get_settings()
    return settings.get("security", {})

@router.patch("/security")
async def update_security_settings(
    updates: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update security settings (Admin only)"""
    settings = get_settings()

    # Merge updates
    if "security" not in settings:
        settings["security"] = {}

    for key, value in updates.items():
        if isinstance(value, dict) and key in settings["security"]:
            settings["security"][key].update(value)
        else:
            settings["security"][key] = value

    save_settings(settings)

    # Log the settings change
    log_settings_change(
        db, current_user, "security",
        details={"updates": updates},
        request=request
    )
    db.commit()

    return {"message": "Security settings updated", "security": settings["security"]}

@router.get("/organization")
async def get_organization_settings(
    current_user: User = Depends(require_admin)
):
    """Get organization settings (Admin only)"""
    settings = get_settings()
    return settings.get("organization", {})

@router.patch("/organization")
async def update_organization_settings(
    updates: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update organization settings (Admin only)"""
    settings = get_settings()

    # Merge updates
    if "organization" not in settings:
        settings["organization"] = {}

    for key, value in updates.items():
        if isinstance(value, dict) and key in settings["organization"]:
            settings["organization"][key].update(value)
        else:
            settings["organization"][key] = value

    save_settings(settings)

    # Log the settings change
    log_settings_change(
        db, current_user, "organization",
        details={"updates": updates},
        request=request
    )
    db.commit()

    return {"message": "Organization settings updated", "organization": settings["organization"]}

@router.get("/governorates")
async def get_governorates():
    """Get list of governorates"""
    settings = get_settings()
    return {"governorates": settings.get("governorates", [])}

@router.post("/governorates")
async def add_governorate(
    governorate_data: Dict[str, str],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Add a new governorate (Admin only)"""
    settings = get_settings()
    governorate = governorate_data.get("name")

    if not governorate:
        raise HTTPException(status_code=400, detail="Governorate name is required")

    if "governorates" not in settings:
        settings["governorates"] = []

    if governorate not in settings["governorates"]:
        settings["governorates"].append(governorate)
        save_settings(settings)

        # Log the settings change
        log_create(
            db, current_user, "governorate", None,
            details={"name": governorate},
            request=request
        )
        db.commit()

    return {"message": "Governorate added", "governorates": settings["governorates"]}

@router.delete("/governorates/{governorate}")
async def delete_governorate(
    governorate: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete a governorate (Admin only)"""
    settings = get_settings()

    if "governorates" in settings and governorate in settings["governorates"]:
        settings["governorates"].remove(governorate)
        save_settings(settings)

        # Log the settings change
        log_delete(
            db, current_user, "governorate", None,
            details={"name": governorate},
            request=request
        )
        db.commit()

    return {"message": "Governorate deleted", "governorates": settings.get("governorates", [])}

@router.get("/age-categories")
async def get_age_categories():
    """Get age categories"""
    settings = get_settings()
    return {"age_categories": settings.get("age_categories", [])}

@router.post("/age-categories")
async def add_age_category(
    category_data: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Add a new age category (Admin only)"""
    settings = get_settings()

    if "age_categories" not in settings:
        settings["age_categories"] = []

    settings["age_categories"].append(category_data)
    save_settings(settings)

    # Log the settings change
    log_create(
        db, current_user, "age_category", None,
        details=category_data,
        request=request
    )
    db.commit()

    return {"message": "Age category added", "age_categories": settings["age_categories"]}

@router.put("/age-categories/{category_id}")
async def update_age_category(
    category_id: str,
    category_data: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Update an age category (Admin only)"""
    settings = get_settings()

    if "age_categories" in settings:
        for i, cat in enumerate(settings["age_categories"]):
            if cat.get("id") == category_id:
                settings["age_categories"][i] = category_data
                save_settings(settings)

                # Log the settings change
                log_update(
                    db, current_user, "age_category", None,
                    details={"category_id": category_id, "updates": category_data},
                    request=request
                )
                db.commit()

                return {"message": "Age category updated", "age_categories": settings["age_categories"]}

    raise HTTPException(status_code=404, detail="Age category not found")

@router.delete("/age-categories/{category_id}")
async def delete_age_category(
    category_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    """Delete an age category (Admin only)"""
    settings = get_settings()

    if "age_categories" in settings:
        settings["age_categories"] = [cat for cat in settings["age_categories"] if cat.get("id") != category_id]
        save_settings(settings)

        # Log the settings change
        log_delete(
            db, current_user, "age_category", None,
            details={"category_id": category_id},
            request=request
        )
        db.commit()

    return {"message": "Age category deleted", "age_categories": settings.get("age_categories", [])}
