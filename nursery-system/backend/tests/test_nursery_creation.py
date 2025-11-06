from __future__ import annotations

from typing import Dict

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Nursery, RoleEnum, User
from app.nursery_helpers import normalize_text
from app.security import hash_password


def _auth_headers(token: str) -> Dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


def test_create_main_nursery_returns_director_credentials(
    client: TestClient,
    admin_token: str,
    db_session: Session,
) -> None:
    payload = {
        "name": "الزيتونة",
        "mainPhone": "0791234567",
        "isBranch": False,
        "branchName": None,
        "email": "info@alzytoonah.com",
        "governorate": "Amman",
        "city": "Amman",
        "postalCode": "11953",
        "addressLine": "Abdoun Street",
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "notes": "Test nursery",
    }

    response = client.post(
        "/admin/nurseries",
        json={**payload},
        headers=_auth_headers(admin_token),
    )

    assert response.status_code == 201
    body = response.json()

    assert body["scope"] == "Main"
    assert body["manager"]["email"] == "manager_4@alzytoonah.com"
    assert 12 <= len(body["manager"]["tempPassword"]) <= 16

    nursery = (
        db_session.query(Nursery)
        .filter(Nursery.id == body["nurseryId"])
        .one()
    )
    assert nursery.phone_normalized == "+962791234567"
    assert nursery.name_normalized == normalize_text(payload["name"])
    assert nursery.branch_normalized == ""

    director = (
        db_session.query(User)
        .filter(User.nursery_id == nursery.id, User.role == RoleEnum.DIRECTOR)
        .one()
    )
    assert director.email == body["manager"]["email"]
    assert director.must_reset_password is True
    assert director.temp_password == body["manager"]["tempPassword"]
    assert director.hashed_password != body["manager"]["tempPassword"]


def test_create_branch_returns_branch_scope_and_email(
    client: TestClient,
    admin_token: str,
    db_session: Session,
) -> None:
    payload = {
        "name": "AlZaytoonah",
        "mainPhone": "0787654321",
        "isBranch": True,
        "branchName": "Downtown Branch",
        "email": None,
        "governorate": "Amman",
        "city": "Amman",
        "postalCode": None,
        "addressLine": "Rainbow Street",
        "minAgeDays": 90,
        "maxAgeMonths": 60,
        "notes": "",
    }

    response = client.post(
        "/admin/nurseries",
        json=payload,
        headers=_auth_headers(admin_token),
    )

    assert response.status_code == 201
    body = response.json()

    assert body["scope"] == payload["branchName"]
    assert body["manager"]["email"] == "manager_4@alzaytoonah-downtown-branch.com"

    nursery = (
        db_session.query(Nursery)
        .filter(Nursery.id == body["nurseryId"])
        .one()
    )
    assert nursery.is_branch is True
    assert nursery.branch_name == payload["branchName"]
    assert nursery.branch_normalized == normalize_text(payload["branchName"])


def test_duplicate_nursery_name_conflict(client: TestClient, admin_token: str) -> None:
    base_payload = {
        "name": "Happy Kids",
        "mainPhone": "0790000001",
        "isBranch": False,
        "branchName": None,
        "email": None,
        "governorate": None,
        "city": None,
        "postalCode": None,
        "addressLine": None,
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "notes": "",
    }

    first = client.post("/admin/nurseries", json=base_payload, headers=_auth_headers(admin_token))
    assert first.status_code == 201

    duplicate_payload = {**base_payload, "name": "  happy   kids "}
    second = client.post("/admin/nurseries", json=duplicate_payload, headers=_auth_headers(admin_token))

    assert second.status_code == 409
    error = second.json()["error"]
    assert error["code"] == "NURSERY_NAME_TAKEN"
    assert error["message"] == "اسم الحضانة مستخدم بالفعل."


def test_duplicate_phone_conflict_across_formats(
    client: TestClient,
    admin_token: str,
) -> None:
    payload = {
        "name": "Sunshine",
        "mainPhone": "0798888888",
        "isBranch": False,
        "branchName": None,
        "email": None,
        "governorate": None,
        "city": None,
        "postalCode": None,
        "addressLine": None,
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "notes": "",
    }
    first = client.post("/admin/nurseries", json=payload, headers=_auth_headers(admin_token))
    assert first.status_code == 201

    duplicate_phone = {**payload, "name": "Sunshine Branch", "mainPhone": "+962798888888"}
    second = client.post("/admin/nurseries", json=duplicate_phone, headers=_auth_headers(admin_token))
    assert second.status_code == 409

    error = second.json()["error"]
    assert error["code"] == "NURSERY_PHONE_TAKEN"
    assert error["message"] == "رقم الهاتف الرئيسي مستخدم بالفعل."


def test_email_collision_generates_suffix(
    client: TestClient,
    admin_token: str,
    db_session: Session,
) -> None:
    existing = User(
        email="manager_4@alzytoonah.com",
        email_normalized="manager_4@alzytoonah.com",
        hashed_password=hash_password("existing-secret-123"),
        temp_password=None,
        must_reset_password=False,
        first_name="Existing",
        last_name="Director",
        role=RoleEnum.DIRECTOR,
        is_active=True,
    )
    db_session.add(existing)
    db_session.flush()

    payload = {
        "name": "Alzytoonah",
        "mainPhone": "0792222333",
        "isBranch": False,
        "branchName": None,
        "email": None,
        "governorate": None,
        "city": None,
        "postalCode": None,
        "addressLine": None,
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "notes": "",
    }

    response = client.post("/admin/nurseries", json=payload, headers=_auth_headers(admin_token))
    assert response.status_code == 201
    email = response.json()["manager"]["email"]
    assert email == "manager_4@alzytoonah-2.com"


def test_branch_requires_name(
    client: TestClient,
    admin_token: str,
) -> None:
    payload = {
        "name": "No Branch Name",
        "mainPhone": "0795555555",
        "isBranch": True,
        "branchName": None,
        "email": None,
        "governorate": None,
        "city": None,
        "postalCode": None,
        "addressLine": None,
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "notes": "",
    }

    response = client.post("/admin/nurseries", json=payload, headers=_auth_headers(admin_token))
    data = response.json()
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "INVALID_BRANCH_NAME"
    assert error["message"] == "اسم الفرع مطلوب"


def test_invalid_phone_format_rejected(client: TestClient, admin_token: str) -> None:
    payload = {
        "name": "Bad Phone",
        "mainPhone": "061234567",
        "isBranch": False,
        "branchName": None,
        "email": None,
        "governorate": None,
        "city": None,
        "postalCode": None,
        "addressLine": None,
        "minAgeDays": 70,
        "maxAgeMonths": 52,
        "notes": "",
    }

    response = client.post("/admin/nurseries", json=payload, headers=_auth_headers(admin_token))
    assert response.status_code == 400
    error = response.json()["error"]
    assert error["code"] == "INVALID_PHONE"
    assert error["message"] == "رقم الهاتف الأردني غير صحيح (مثال: 07XXXXXXXX)"


