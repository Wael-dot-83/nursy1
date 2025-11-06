"""
Test Governorate Endpoints
Tests for governorate CRUD operations and API responses
"""

import pytest
from fastapi.testclient import TestClient
from app.models import Governorate


def test_list_governorates_unauthenticated(client: TestClient, db_session):
    """Test that governorates can be listed without authentication"""
    # Seed some governorates
    governorates = [
        Governorate(code="AM", name_en="Amman", name_ar="عمّان"),
        Governorate(code="IR", name_en="Irbid", name_ar="إربد"),
        Governorate(code="ZA", name_en="Zarqa", name_ar="الزرقاء"),
    ]
    db_session.add_all(governorates)
    db_session.commit()

    response = client.get("/governorates/")
    assert response.status_code == 200
    
    data = response.json()
    assert "governorates" in data
    assert len(data["governorates"]) >= 3
    
    # Verify structure
    gov = data["governorates"][0]
    assert "id" in gov
    assert "code" in gov
    assert "name_en" in gov
    assert "name_ar" in gov


def test_list_governorates_count(client: TestClient, db_session):
    """Test that at least 12 governorates are seeded (all Jordan governorates)"""
    # This assumes seed.py has run
    from app.seed import seed_governorates
    seed_governorates()
    
    response = client.get("/governorates/")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["governorates"]) >= 12, "Should have at least 12 Jordan governorates"


def test_governorate_utf8_encoding(client: TestClient, db_session):
    """Test that Arabic text is properly encoded and returned"""
    # Seed governorate with Arabic name
    gov = Governorate(code="AM", name_en="Amman", name_ar="عمّان")
    db_session.add(gov)
    db_session.commit()

    response = client.get("/governorates/")
    assert response.status_code == 200
    
    data = response.json()
    assert len(data["governorates"]) > 0
    
    # Find Amman governorate
    amman = next((g for g in data["governorates"] if g["code"] == "AM"), None)
    assert amman is not None
    assert amman["name_ar"] == "عمّان", "Arabic text should be properly encoded"
    
    # Verify response has correct content-type
    assert "application/json" in response.headers["content-type"]


def test_governorate_fields_required(client: TestClient, db_session):
    """Test that all required fields are present in response"""
    gov = Governorate(code="AM", name_en="Amman", name_ar="عمّان")
    db_session.add(gov)
    db_session.commit()

    response = client.get("/governorates/")
    assert response.status_code == 200
    
    data = response.json()
    gov_data = data["governorates"][0]
    
    # Check all required fields
    required_fields = ["id", "code", "name_en", "name_ar"]
    for field in required_fields:
        assert field in gov_data, f"Field '{field}' is required"
        assert gov_data[field] is not None, f"Field '{field}' cannot be None"


def test_governorate_unique_codes(client: TestClient, db_session):
    """Test that governorate codes are unique"""
    response = client.get("/governorates/")
    assert response.status_code == 200
    
    data = response.json()
    codes = [g["code"] for g in data["governorates"]]
    
    # Check for duplicates
    assert len(codes) == len(set(codes)), "Governorate codes must be unique"


@pytest.mark.integration
def test_governorate_seed_idempotency(client: TestClient, db_session):
    """Test that running seed multiple times doesn't create duplicates"""
    from app.seed import seed_governorates
    
    # Seed first time
    seed_governorates()
    response1 = client.get("/governorates/")
    count1 = len(response1.json()["governorates"])
    
    # Seed second time
    seed_governorates()
    response2 = client.get("/governorates/")
    count2 = len(response2.json()["governorates"])
    
    assert count1 == count2, "Seeding should be idempotent (no duplicates)"
