#!/usr/bin/env python3
"""
Test script for Nursery Management System API
"""
import requests
import json
import sys

API_BASE = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    try:
        response = requests.get(f"{API_BASE}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_docs():
    """Test API documentation"""
    try:
        response = requests.get(f"{API_BASE}/docs")
        if response.status_code == 200:
            print("✅ API docs accessible")
            return True
        else:
            print(f"❌ API docs failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API docs error: {e}")
        return False

def test_openapi():
    """Test OpenAPI schema"""
    try:
        response = requests.get(f"{API_BASE}/openapi.json")
        if response.status_code == 200:
            schema = response.json()
            print("✅ OpenAPI schema accessible")
            print(f"   API Title: {schema.get('info', {}).get('title', 'Unknown')}")
            print(f"   API Version: {schema.get('info', {}).get('version', 'Unknown')}")
            return True
        else:
            print(f"❌ OpenAPI schema failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ OpenAPI schema error: {e}")
        return False

def test_auth_endpoints():
    """Test auth endpoints exist"""
    endpoints = [
        "/auth/login",
        "/auth/otp/request",
        "/auth/otp/verify"
    ]

    for endpoint in endpoints:
        try:
            # Just check if endpoint exists (should return 405 Method Not Allowed or similar)
            response = requests.get(f"{API_BASE}{endpoint}")
            if response.status_code in [405, 422, 401]:
                print(f"✅ Auth endpoint {endpoint} exists")
            else:
                print(f"❌ Auth endpoint {endpoint} unexpected response: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Auth endpoint {endpoint} error: {e}")
            return False
    return True

def test_protected_endpoints():
    """Test protected endpoints require auth"""
    endpoints = [
        "/nurseries",
        "/users",
        "/children",
        "/attendance",
        "/reports"
    ]

    for endpoint in endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}")
            if response.status_code in [401, 403]:
                print(f"✅ Protected endpoint {endpoint} requires authentication")
            else:
                print(f"❌ Protected endpoint {endpoint} unexpected response: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Protected endpoint {endpoint} error: {e}")
            return False
    return True

def main():
    print("🧪 Testing Nursery Management System API")
    print("=" * 50)

    tests = [
        ("Health Check", test_health),
        ("API Documentation", test_docs),
        ("OpenAPI Schema", test_openapi),
        ("Auth Endpoints", test_auth_endpoints),
        ("Protected Endpoints", test_protected_endpoints),
    ]

    passed = 0
    total = len(tests)

    for test_name, test_func in tests:
        print(f"\n🔍 Testing {test_name}...")
        if test_func():
            passed += 1
        print()

    print("=" * 50)
    print(f"📊 Test Results: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 All tests passed! API is ready for frontend integration.")
        return 0
    else:
        print("⚠️  Some tests failed. Please check the backend server.")
        return 1

if __name__ == "__main__":
    sys.exit(main())