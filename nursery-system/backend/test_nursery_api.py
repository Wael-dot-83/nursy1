#!/usr/bin/env python3
"""
Test script for nursery management API endpoints
"""
import requests
import json
import sys
import os
import time
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_nursery_api():
    """Test the nursery management API endpoints"""
    base_url = "http://localhost:8000"

    print("🧪 Testing Nursery Management API...")

    # Test basic connectivity first
    print("\n1. Testing basic connectivity...")
    try:
        response = requests.get(f"{base_url}/docs")
        print(f"Basic connectivity: {response.status_code}")
    except Exception as e:
        print(f"❌ Basic connectivity error: {e}")
        return

    # Test login
    print("\n2. Testing login...")
    login_data = {
        "email": "admin@nursery.com",
        "password": "Admin123!"
    }

    try:
        response = requests.post(f"{base_url}/auth/login", json=login_data, timeout=10)
        print(f"Login response status: {response.status_code}")
        if response.status_code == 200:
            token = response.json().get("access_token")
            headers = {"Authorization": f"Bearer {token}"}
            print("✓ Login successful")
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return
    except Exception as e:
        print(f"❌ Login error: {e}")
        return

    time.sleep(2)  # Wait a bit

    # Test get nurseries
    print("\n3. Testing GET /admin/nurseries...")
    try:
        response = requests.get(f"{base_url}/admin/nurseries", headers=headers, timeout=10)
        print(f"GET nurseries response status: {response.status_code}")
        if response.status_code == 200:
            nurseries = response.json()
            print(f"✓ Got {len(nurseries)} nurseries")
            if nurseries:
                print(f"  First nursery: {nurseries[0]['name']}")
        else:
            print(f"❌ GET nurseries failed: {response.status_code} - {response.text}")
    except Exception as e:
        print(f"❌ GET nurseries error: {e}")

    print("\n🎉 Basic API testing completed!")

if __name__ == "__main__":
    test_nursery_api()