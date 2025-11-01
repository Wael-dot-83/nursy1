import os
from datetime import datetime
from typing import Generator

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure essential configuration is present before importing the app.
os.environ.setdefault("SECRET_KEY", "tests-secret-key-should-be-very-long-123456")
os.environ.setdefault("JWT_ACCESS_SECRET", "tests-access-secret-key-should-be-long-654321")
os.environ.setdefault("JWT_REFRESH_SECRET", "tests-refresh-secret-key-should-be-long-abcdef")
os.environ.setdefault("DATABASE_URL", "sqlite:///./test_app.db")
os.environ.setdefault("LOG_LEVEL", "INFO")
os.environ.setdefault("APP_DISABLE_LOGGING", "1")

from app.main import app  # noqa: E402
from app.database import get_db  # noqa: E402
from app.models import Base, User, RoleEnum  # noqa: E402
from app.security import hash_password  # noqa: E402

TEST_DATABASE_URL = "sqlite:///./test.db"

engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def setup_database() -> Generator[None, None, None]:
    """Create the database schema for the test session."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists("./test.db"):
        os.remove("./test.db")


@pytest.fixture(scope="function")
def db_session() -> Generator:
    """Provide a transactional scope for each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session) -> Generator[TestClient, None, None]:
    """FastAPI test client with the database dependency overridden."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.pop(get_db, None)


@pytest.fixture
def admin_user(db_session) -> User:
    """Provision an active admin user for authenticated requests."""
    user = User(
        email="test@admin.com",
        first_name="Test",
        last_name="Admin",
        phone="+962123456789",
        role=RoleEnum.ADMIN,
        hashed_password=hash_password("TestPass123!"),
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(user)
    db_session.flush()
    return user
