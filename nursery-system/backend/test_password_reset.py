"""Test password reset flow"""
import pytest
from fastapi.testclient import TestClient
from datetime import datetime, timedelta

from app.main import app
from app.database import SessionLocal
from app.models import User, PasswordResetOTP, PasswordResetAttempt
from app.security import hash_password, hash_otp_code
from app.sms_service import normalize_jordan_phone

client = TestClient(app)

@pytest.fixture
def db():
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture
def test_user(db):
    user = User(
        email="test@example.com",
        phone="+9627912345678",
        first_name="Test",
        last_name="User",
        role="parent",
        hashed_password=hash_password("OldPassword123"),
        is_active=True
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    yield user
    db.delete(user)
    db.commit()

def test_phone_normalization():
    assert normalize_jordan_phone("0791234567") == "+9627912345 67"
    assert normalize_jordan_phone("+9627912345678") == "+9627912345678"

def test_request_otp_success(test_user):
    response = client.post("/auth/forgot-password/request", json={
        "phone": "0791234567"
    })
    assert response.status_code == 200
    data = response.json()
    assert "message_ar" in data
    assert "dev_otp" in data  # Dev mode

def test_request_otp_rate_limit(test_user, db):
    phone = "+9627912345678"
    # Create 3 recent attempts
    for _ in range(3):
        attempt = PasswordResetAttempt(
            phone=phone,
            ip_address="127.0.0.1",
            success=True,
            attempted_at=datetime.utcnow()
        )
        db.add(attempt)
    db.commit()
    
    response = client.post("/auth/forgot-password/request", json={
        "phone": "0791234567"
    })
    assert response.status_code == 429

def test_verify_otp_success(test_user, db):
    phone = "+9627912345678"
    otp = "123456"
    otp_record = PasswordResetOTP(
        phone=phone,
        otp_hash=hash_otp_code(otp),
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        attempts=0,
        used=False
    )
    db.add(otp_record)
    db.commit()
    
    response = client.post("/auth/forgot-password/verify", json={
        "phone": "0791234567",
        "otp": otp
    })
    assert response.status_code == 200
    assert response.json()["verified"] == True

def test_verify_otp_invalid(test_user, db):
    phone = "+9627912345678"
    otp_record = PasswordResetOTP(
        phone=phone,
        otp_hash=hash_otp_code("123456"),
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        attempts=0,
        used=False
    )
    db.add(otp_record)
    db.commit()
    
    response = client.post("/auth/forgot-password/verify", json={
        "phone": "0791234567",
        "otp": "999999"
    })
    assert response.status_code == 400

def test_confirm_password_reset(test_user, db):
    phone = "+9627912345678"
    otp = "123456"
    otp_record = PasswordResetOTP(
        phone=phone,
        otp_hash=hash_otp_code(otp),
        expires_at=datetime.utcnow() + timedelta(minutes=10),
        attempts=0,
        used=True
    )
    db.add(otp_record)
    db.commit()
    
    response = client.post("/auth/forgot-password/confirm", json={
        "phone": "0791234567",
        "otp": otp,
        "new_password": "NewPassword123"
    })
    assert response.status_code == 200
    
    # Verify password changed
    db.refresh(test_user)
    from app.security import verify_password
    assert verify_password("NewPassword123", test_user.hashed_password)

if __name__ == "__main__":
    pytest.main([__file__, "-v"])
