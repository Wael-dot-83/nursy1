
from .database import get_db
from .models import User
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
import json
import uuid
from .dependencies import require_admin
from fastapi import APIRouter, Depends, HTTPException, status, Request
"""
Settings router for system configuration
"""

router = APIRouter()

# Simple file-based settings storage for now
SETTINGS_FILE = "app_settings.json"

def get_settings():
    try:
        with open(SETTINGS_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {
            "governorates": [],
            "age_categories": [],
            "security": {},
            "organization": {}
        }

def save_settings(settings: dict):
    with open(SETTINGS_FILE, "w", encoding="utf-8") as f:
        json.dump(settings, f, ensure_ascii=False, indent=2)

@router.get("/")
# ... existing code
@router.patch("/organization")
async def update_organization_settings(
    updates: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
# ... existing code
    return {"message": "Organization settings updated", "organization": settings["organization"]}

@router.get("/governorates")
async def get_governorates():
    settings = get_settings()
    return {"governorates": settings.get("governorates", [])}

@router.post("/governorates")
async def add_governorate(
    governorate_data: Dict[str, str],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    settings = get_settings()
    governorates = settings.get("governorates", [])
    
    name = governorate_data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Governorate name is required")
    
    if any(g['name'] == name for g in governorates):
        raise HTTPException(status_code=400, detail="Governorate already exists")

    new_governorate = {
        "id": str(uuid.uuid4()),
        "name": name
    }
    governorates.append(new_governorate)
    settings["governorates"] = governorates
    save_settings(settings)
    
    # TODO: Add audit log entry
    
    return {"message": "Governorate added", "governorates": settings["governorates"]}

@router.put("/governorates/{governorate_id}")
async def update_governorate(
    governorate_id: str,
    governorate_data: Dict[str, str],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    settings = get_settings()
    governorates = settings.get("governorates", [])
    
    name = governorate_data.get("name")
    if not name:
        raise HTTPException(status_code=400, detail="Governorate name is required")

    # Check if new name already exists (and it's not the same item)
    if any(g['name'] == name and g.get('id') != governorate_id for g in governorates):
        raise HTTPException(status_code=400, detail="Governorate with this name already exists")

    # Find and update
    governorate_found = False
    for i, g in enumerate(governorates):
        if g.get("id") == governorate_id:
            governorates[i]['name'] = name
            governorate_found = True
            break
    
    if not governorate_found:
        raise HTTPException(status_code=404, detail="Governorate not found")

    settings["governorates"] = governorates
    save_settings(settings)
    
    # TODO: Add audit log entry
    
    return {"message": "Governorate updated", "governorates": settings["governorates"]}

@router.delete("/governorates/{governorate_id}")
async def delete_governorate(
    governorate_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    settings = get_settings()
    governorates = settings.get("governorates", [])
    
    initial_len = len(governorates)
    governorates = [g for g in governorates if g.get("id") != governorate_id]
    
    if len(governorates) == initial_len:
        raise HTTPException(status_code=404, detail="Governorate not found")

    settings["governorates"] = governorates
    save_settings(settings)
    
    # TODO: Add audit log entry
    
    return {"message": "Governorate deleted", "governorates": settings.get("governorates", [])}

@router.get("/age-categories")
async def get_age_categories():
    settings = get_settings()
    return {"age_categories": settings.get("age_categories", [])}

@router.post("/age-categories")
async def add_age_category(
    category_data: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    settings = get_settings()
    categories = settings.get("age_categories", [])
    
    name = category_data.get("name")
    min_months = category_data.get("min_months")
    max_months = category_data.get("max_months")

    if not all([name, min_months is not None, max_months is not None]):
        raise HTTPException(status_code=400, detail="Missing required fields: name, min_months, max_months")
    
    if not (isinstance(min_months, int) and isinstance(max_months, int) and 0 <= min_months < max_months):
        raise HTTPException(status_code=400, detail="Invalid age range. min_months must be a non-negative integer and less than max_months.")

    # Check for overlap
    for cat in categories:
        if max(min_months, cat['min_months']) < min(max_months, cat['max_months']):
            raise HTTPException(status_code=400, detail=f"Age range overlaps with existing category '{cat['name']}' ({cat['min_months']}-{cat['max_months']} months)")

    new_category = {
        "id": str(uuid.uuid4()),
        "name": name,
        "min_months": min_months,
        "max_months": max_months
    }
    categories.append(new_category)
    settings["age_categories"] = sorted(categories, key=lambda x: x['min_months'])
    save_settings(settings)
    
    # TODO: Add audit log entry
    
    return {"message": "Age category added", "age_categories": settings["age_categories"]}

@router.put("/age-categories/{category_id}")
async def update_age_category(
    category_id: str,
    category_data: Dict[str, Any],
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    settings = get_settings()
    categories = settings.get("age_categories", [])
    
    name = category_data.get("name")
    min_months = category_data.get("min_months")
    max_months = category_data.get("max_months")

    if not all([name, min_months is not None, max_months is not None]):
        raise HTTPException(status_code=400, detail="Missing required fields: name, min_months, max_months")

    if not (isinstance(min_months, int) and isinstance(max_months, int) and 0 <= min_months < max_months):
        raise HTTPException(status_code=400, detail="Invalid age range. min_months must be a non-negative integer and less than max_months.")

    # Check for overlap with other categories
    for cat in categories:
        if cat['id'] != category_id and max(min_months, cat['min_months']) < min(max_months, cat['max_months']):
            raise HTTPException(status_code=400, detail=f"Age range overlaps with existing category '{cat['name']}' ({cat['min_months']}-{cat['max_months']} months)")

    # Find and update the category
    for i, cat in enumerate(categories):
        if cat['id'] == category_id:
            categories[i] = {
                "id": category_id,
                "name": name,
                "min_months": min_months,
                "max_months": max_months
            }
            break
    else:
        raise HTTPException(status_code=404, detail="Age category not found")

    settings["age_categories"] = sorted(categories, key=lambda x: x['min_months'])
    save_settings(settings)
    
    # TODO: Add audit log entry
    
    return {"message": "Age category updated", "age_categories": settings["age_categories"]}

@router.delete("/age-categories/{category_id}")
async def delete_age_category(
    category_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin)
):
    settings = get_settings()
    categories = settings.get("age_categories", [])
    
    initial_len = len(categories)
    categories = [cat for cat in categories if cat.get("id") != category_id]
    
    if len(categories) == initial_len:
        raise HTTPException(status_code=404, detail="Age category not found")

    settings["age_categories"] = categories
    save_settings(settings)
    
    # TODO: Add audit log entry
    
    return {"message": "Age category deleted", "age_categories": settings.get("age_categories", [])}
