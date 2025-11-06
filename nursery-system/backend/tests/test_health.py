"""
Test Health Endpoints
Tests for system health and readiness checks
"""

import pytest
from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient):
    """Test the health endpoint returns 200 OK"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "timestamp" in data


def test_root_endpoint(client: TestClient):
    """Test the root endpoint returns app info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "version" in data
    assert "Nursery Management System" in data["message"]


def test_docs_endpoint(client: TestClient):
    """Test the API documentation is accessible"""
    response = client.get("/docs")
    assert response.status_code == 200
    assert b"swagger-ui" in response.content or b"redoc" in response.content


def test_openapi_endpoint(client: TestClient):
    """Test the OpenAPI schema is accessible"""
    response = client.get("/openapi.json")
    assert response.status_code == 200
    data = response.json()
    assert "openapi" in data
    assert "info" in data
    assert "paths" in data
