"""
Test authentication endpoints
"""
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User
from app.security import hash_password
import os

# Create test database
TEST_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

client = TestClient(app)

@pytest.fixture(scope="module", autouse=True)
def setup_database():
    """Create test database and populate with test data"""
    Base.metadata.create_all(bind=engine)

    # Create test admin user
    db = TestingSessionLocal()
    test_admin = User(
        email="test@admin.com",
        first_name="Test",
        last_name="Admin",
        phone="+962123456789",
        role="ADMIN",
        hashed_password=hash_password("TestPass123!"),
        is_active=True
    )
    db.add(test_admin)
    db.commit()
    db.close()

    yield

    # Cleanup
    Base.metadata.drop_all(bind=engine)
    if os.path.exists("./test.db"):
        os.remove("./test.db")

def test_root_endpoint():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "Nursery Management System" in data["message"]

def test_login_success():
    """Test successful login"""
    response = client.post(
        "/auth/login",
        json={"email": "test@admin.com", "password": "TestPass123!"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "user" in data

def test_login_invalid_credentials():
    """Test login with invalid credentials"""
    response = client.post(
        "/auth/login",
        json={"email": "test@admin.com", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_login_nonexistent_user():
    """Test login with nonexistent user"""
    response = client.post(
        "/auth/login",
        json={"email": "nonexistent@test.com", "password": "password"}
    )
    assert response.status_code == 401

def test_get_current_user():
    """Test getting current user info"""
    # First login
    login_response = client.post(
        "/auth/login",
        json={"email": "test@admin.com", "password": "TestPass123!"}
    )
    token = login_response.json()["access_token"]

    # Then get user info
    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@admin.com"
    assert data["role"] == "ADMIN"

def test_unauthorized_access():
    """Test accessing protected endpoint without token"""
    response = client.get("/auth/me")
    assert response.status_code == 401
