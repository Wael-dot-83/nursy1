"""
Test nursery creation with branches and manager accounts
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.models import Nursery, Branch, User, RoleEnum, Governorate
from app.database import get_db
from tests.conftest import test_db, admin_token


def test_create_nursery_no_branches(test_db: Session, admin_token: str):
    """Test creating a nursery without branches"""
    client = TestClient(app)
    
    payload = {
        "name": "Test Nursery",
        "mainPhone": "0791234567",
        "email": "test@nursery.com",
        "governorateId": 1,
        "city": "Amman",
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "hasBranches": False,
        "numberOfBranches": 0,
        "branches": [],
        "branchManagersEnabled": True
    }
    
    response = client.post(
        "/admin/nurseries",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    # Verify response structure
    assert "nursery" in data
    assert "director" in data
    assert "managers" in data
    assert len(data["managers"]) == 0
    
    # Verify nursery created
    nursery = test_db.query(Nursery).filter(Nursery.name == "Test Nursery").first()
    assert nursery is not None
    assert nursery.governorate_id == 1
    
    # Verify director created
    director = test_db.query(User).filter(
        User.nursery_id == nursery.id,
        User.role == RoleEnum.DIRECTOR
    ).first()
    assert director is not None
    assert director.temp_password is not None
    
    # Verify no branches created
    branches = test_db.query(Branch).filter(Branch.nursery_id == nursery.id).all()
    assert len(branches) == 0


def test_create_nursery_with_branches(test_db: Session, admin_token: str):
    """Test creating a nursery with 2 branches and managers"""
    client = TestClient(app)
    
    payload = {
        "name": "Multi-Branch Nursery",
        "mainPhone": "0792345678",
        "email": "multi@nursery.com",
        "governorateId": 1,
        "city": "Amman",
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "hasBranches": True,
        "numberOfBranches": 2,
        "branches": [
            {"name": "فرع الجبيهة", "phone": "0793456789"},
            {"name": "فرع الشميساني", "phone": "0794567890"}
        ],
        "branchManagersEnabled": True
    }
    
    response = client.post(
        "/admin/nurseries",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    
    assert response.status_code == 201
    data = response.json()
    
    # Verify response structure
    assert "nursery" in data
    assert "director" in data
    assert "managers" in data
    assert len(data["managers"]) == 2
    
    # Verify each manager has required fields
    for manager in data["managers"]:
        assert "email" in manager
        assert "temporaryPassword" in manager
        assert "branchName" in manager
    
    # Verify nursery created
    nursery = test_db.query(Nursery).filter(Nursery.name == "Multi-Branch Nursery").first()
    assert nursery is not None
    
    # Verify exactly 2 branches created
    branches = test_db.query(Branch).filter(Branch.nursery_id == nursery.id).all()
    assert len(branches) == 2
    assert branches[0].name == "فرع الجبيهة"
    assert branches[1].name == "فرع الشميساني"
    
    # Verify exactly 2 managers created with branch_id
    managers = test_db.query(User).filter(
        User.nursery_id == nursery.id,
        User.role == RoleEnum.MANAGER
    ).all()
    assert len(managers) == 2
    
    for manager in managers:
        assert manager.branch_id is not None
        assert manager.branch_id in [b.id for b in branches]
        assert manager.temp_password is not None


def test_create_nursery_duplicate_name(test_db: Session, admin_token: str):
    """Test that duplicate nursery names are rejected"""
    client = TestClient(app)
    
    payload = {
        "name": "Duplicate Nursery",
        "mainPhone": "0795678901",
        "hasBranches": False,
        "numberOfBranches": 0,
        "branches": []
    }
    
    # Create first nursery
    response1 = client.post(
        "/admin/nurseries",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response1.status_code == 201
    
    # Try to create duplicate
    payload["mainPhone"] = "0796789012"  # Different phone
    response2 = client.post(
        "/admin/nurseries",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response2.status_code == 409
    assert "NURSERY_NAME_TAKEN" in response2.json()["detail"]["code"]


def test_create_nursery_duplicate_phone(test_db: Session, admin_token: str):
    """Test that duplicate phone numbers are rejected"""
    client = TestClient(app)
    
    payload1 = {
        "name": "Nursery One",
        "mainPhone": "0797890123",
        "hasBranches": False,
        "numberOfBranches": 0,
        "branches": []
    }
    
    # Create first nursery
    response1 = client.post(
        "/admin/nurseries",
        json=payload1,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response1.status_code == 201
    
    # Try to create with same phone
    payload2 = {
        "name": "Nursery Two",
        "mainPhone": "0797890123",  # Same phone
        "hasBranches": False,
        "numberOfBranches": 0,
        "branches": []
    }
    response2 = client.post(
        "/admin/nurseries",
        json=payload2,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response2.status_code == 409
    assert "NURSERY_PHONE_TAKEN" in response2.json()["detail"]["code"]


def test_create_nursery_invalid_governorate(test_db: Session, admin_token: str):
    """Test that invalid governorate ID is rejected"""
    client = TestClient(app)
    
    payload = {
        "name": "Invalid Gov Nursery",
        "mainPhone": "0798901234",
        "governorateId": 9999,  # Non-existent
        "hasBranches": False,
        "numberOfBranches": 0,
        "branches": []
    }
    
    response = client.post(
        "/admin/nurseries",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 400
    assert "INVALID_GOVERNORATE" in response.json()["detail"]["code"]


def test_managers_visible_in_users_list(test_db: Session, admin_token: str):
    """Test that newly created managers appear in /admin/users immediately"""
    client = TestClient(app)
    
    # Create nursery with branches
    payload = {
        "name": "Visibility Test Nursery",
        "mainPhone": "0799012345",
        "hasBranches": True,
        "numberOfBranches": 2,
        "branches": [
            {"name": "فرع 1"},
            {"name": "فرع 2"}
        ],
        "branchManagersEnabled": True
    }
    
    response = client.post(
        "/admin/nurseries",
        json=payload,
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert response.status_code == 201
    
    # Get users list
    users_response = client.get(
        "/admin/users",
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert users_response.status_code == 200
    
    users_data = users_response.json()
    users = users_data.get("data", users_data)
    
    # Verify managers are in the list
    manager_emails = [m["email"] for m in response.json()["managers"]]
    user_emails = [u["email"] for u in users]
    
    for email in manager_emails:
        assert email in user_emails, f"Manager {email} not found in users list"
