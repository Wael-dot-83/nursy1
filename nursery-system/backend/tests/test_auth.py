from app.models import RoleEnum


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    payload = response.json()
    assert payload["message"] == "Nursery Management System API"


def test_login_success(client, admin_user):
    response = client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": "TestPass123!"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert "refresh_token" in data


def test_login_invalid_credentials(client, admin_user):
    response = client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": "wrongpassword"},
    )
    assert response.status_code == 401
    error = response.json()
    assert error["error"]["code"] == "HTTP_401"
    assert error["error"]["message"] == "Invalid credentials"
    assert error["requestId"]


def test_login_nonexistent_user(client):
    response = client.post(
        "/auth/login",
        json={"email": "missing@example.com", "password": "password"},
    )
    assert response.status_code == 401
    error = response.json()
    assert error["error"]["code"] == "HTTP_401"


def test_get_current_user(client, admin_user):
    login_response = client.post(
        "/auth/login",
        json={"email": admin_user.email, "password": "TestPass123!"},
    )
    token = login_response.json()["access_token"]

    response = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == admin_user.email
    assert data["role"] == RoleEnum.ADMIN.value


def test_unauthorized_access(client):
    response = client.get("/auth/me")
    assert response.status_code in (401, 403)
    body = response.json()
    assert body["error"]["code"] in {"HTTP_401", "HTTP_403"}


def test_login_validation_error(client):
    response = client.post("/auth/login", json={"email": "not-an-email"})
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"
    assert body["error"]["details"]
