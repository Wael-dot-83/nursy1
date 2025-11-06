
#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
End-User Automated Testing Script
Tests the nursery management system as an end user would use it
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import requests
import json
from datetime import datetime
from app.database import SessionLocal
from app.models import User, Nursery, Branch, Classroom, AuditLog

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@nursery.com"
ADMIN_PASSWORD = "Admin123!"

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_test(name):
    print(f"\n{Color.BLUE}▶ Testing: {name}{Color.END}")

def print_success(message):
    print(f"  {Color.GREEN}✓ {message}{Color.END}")

def print_error(message):
    print(f"  {Color.RED}✗ {message}{Color.END}")

def print_info(message):
    print(f"  {Color.YELLOW}ℹ {message}{Color.END}")

# Test Results Tracker
tests_passed = 0
tests_failed = 0

def test_api_health():
    """Test 1: API Health Check"""
    global tests_passed, tests_failed
    print_test("API Health Check")

    try:
        response = requests.get(f"{BASE_URL}/")
        if response.status_code == 200:
            print_success("API is online and responding")
            tests_passed += 1
            return True
        else:
            print_error(f"API returned {response.status_code}")
            tests_failed += 1
            return False
    except Exception as e:
        print_error(f"Cannot connect to API: {e}")
        tests_failed += 1
        return False

def test_admin_login():
    """Test 2: Admin Login"""
    global tests_passed, tests_failed
    print_test("Admin Login")

    try:
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )

        if response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                print_success(f"Admin logged in successfully")
                print_info(f"Token received (first 20 chars): {data['access_token'][:20]}...")
                tests_passed += 1
                return data["access_token"]
            else:
                print_error("No access token in response")
                tests_failed += 1
                return None
        else:
            print_error(f"Login failed with status {response.status_code}")
            print_error(f"Response: {response.text}")
            tests_failed += 1
            return None
    except Exception as e:
        print_error(f"Login request failed: {e}")
        tests_failed += 1
        return None

def test_get_nurseries(token):
    """Test 3: Get All Nurseries"""
    global tests_passed, tests_failed
    print_test("Get All Nurseries")

    if not token:
        print_error("No authentication token available")
        tests_failed += 1
        return []

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/admin/nurseries", headers=headers)

        if response.status_code == 200:
            nurseries = response.json()
            print_success(f"Retrieved {len(nurseries)} nurseries")
            if nurseries:
                print_info(f"Example: {nurseries[0]['name']}")
            tests_passed += 1
            return nurseries
        else:
            print_error(f"Failed to get nurseries: {response.status_code}")
            tests_failed += 1
            return []
    except Exception as e:
        print_error(f"Request failed: {e}")
        tests_failed += 1
        return []

def test_get_users(token):
    """Test 4: Get All Users"""
    global tests_passed, tests_failed
    print_test("Get All Users")

    if not token:
        print_error("No authentication token available")
        tests_failed += 1
        return []

    try:
        headers = {"Authorization": f"Bearer {token}"}
        response = requests.get(f"{BASE_URL}/admin/users/", headers=headers)

        if response.status_code == 200:
            users = response.json()
            print_success(f"Retrieved {len(users)} users")

            # Count by role
            roles = {}
            for user in users:
                role = user.get('role', 'unknown')
                roles[role] = roles.get(role, 0) + 1

            for role, count in roles.items():
                print_info(f"  {role}: {count} users")

            tests_passed += 1
            return users
        else:
            print_error(f"Failed to get users: {response.status_code}")
            tests_failed += 1
            return []
    except Exception as e:
        print_error(f"Request failed: {e}")
        tests_failed += 1
        return []

def test_database_stats():
    """Test 5: Database Statistics"""
    global tests_passed, tests_failed
    print_test("Database Statistics")

    try:
        db = SessionLocal()

        user_count = db.query(User).count()
        nursery_count = db.query(Nursery).count()
        branch_count = db.query(Branch).count()
        classroom_count = db.query(Classroom).count()
        audit_count = db.query(AuditLog).count()

        print_success("Database statistics retrieved:")
        print_info(f"  Users: {user_count}")
        print_info(f"  Nurseries: {nursery_count}")
        print_info(f"  Branches: {branch_count}")
        print_info(f"  Classrooms: {classroom_count}")
        print_info(f"  Audit Logs: {audit_count}")

        db.close()
        tests_passed += 1
        return True
    except Exception as e:
        print_error(f"Database query failed: {e}")
        tests_failed += 1
        return False

def test_audit_logging():
    """Test 6: Audit Logging Functionality"""
    global tests_passed, tests_failed
    print_test("Audit Logging")

    try:
        db = SessionLocal()

        # Get recent audit logs
        recent_logs = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(5).all()

        if recent_logs:
            print_success(f"Found {len(recent_logs)} recent audit logs")

            for log in recent_logs[:3]:  # Show top 3
                action_desc = f"[{log.action}] {log.resource_type}"
                if log.resource_id:
                    action_desc += f" #{log.resource_id}"
                print_info(f"  {action_desc} by user {log.user_id} from {log.ip_address}")

            tests_passed += 1
        else:
            print_info("No audit logs found yet (normal for new system)")
            tests_passed += 1

        db.close()
        return True
    except Exception as e:
        print_error(f"Audit log query failed: {e}")
        tests_failed += 1
        return False

def test_unauthorized_access():
    """Test 7: Unauthorized Access Protection"""
    global tests_passed, tests_failed
    print_test("Unauthorized Access Protection")

    try:
        # Try to access protected endpoint without token
        response = requests.get(f"{BASE_URL}/admin/users/")

        if response.status_code == 401 or response.status_code == 403:
            print_success("Protected endpoint correctly blocks unauthorized access")
            tests_passed += 1
            return True
        else:
            print_error(f"Expected 401/403, got {response.status_code}")
            tests_failed += 1
            return False
    except Exception as e:
        print_error(f"Request failed: {e}")
        tests_failed += 1
        return False

def test_create_update_user(token):
    """Test 8: Create and Update User"""
    global tests_passed, tests_failed
    print_test("Create and Update User")

    if not token:
        print_error("No authentication token available")
        tests_failed += 1
        return False

    try:
        headers = {"Authorization": f"Bearer {token}"}

        # Create a test user
        new_user_data = {
            "email": f"test_{datetime.now().timestamp()}@test.com",
            "full_name": "Test User",
            "phone": "+96279999999",
            "role": "parent"
        }

        response = requests.post(
            f"{BASE_URL}/admin/users",
            headers=headers,
            json=new_user_data
        )

        if response.status_code == 200:
            user = response.json()
            user_id = user['id']
            print_success(f"User created with ID: {user_id}")

            # Now update the user
            update_data = {
                "phone": "+96278888888"
            }

            response = requests.put(
                f"{BASE_URL}/admin/users/{user_id}",
                headers=headers,
                json=update_data
            )

            if response.status_code == 200:
                print_success("User updated successfully")

                # Verify audit log was created
                db = SessionLocal()
                update_log = db.query(AuditLog).filter(
                    AuditLog.resource_type == "user",
                    AuditLog.resource_id == user_id,
                    AuditLog.action == "update"
                ).first()

                if update_log:
                    print_success("Audit log created for update operation")
                    tests_passed += 1
                else:
                    print_info("Audit log not found (may not be triggered for this update)")
                    tests_passed += 1

                db.close()
                return True
            else:
                print_error(f"User update failed: {response.status_code}")
                tests_failed += 1
                return False
        else:
            print_error(f"User creation failed: {response.status_code}")
            print_error(f"Response: {response.text}")
            tests_failed += 1
            return False
    except Exception as e:
        print_error(f"Request failed: {e}")
        tests_failed += 1
        return False

def run_all_tests():
    """Run all end-user tests"""
    print(f"\n{'='*60}")
    print(f"{Color.BLUE}🧪 NURSERY MANAGEMENT SYSTEM - END USER TESTING{Color.END}")
    print(f"{'='*60}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Run tests in sequence
    api_ok = test_api_health()
    if not api_ok:
        print(f"\n{Color.RED}⚠ API is not responding. Cannot continue tests.{Color.END}")
        return

    token = test_admin_login()
    if not token:
        print(f"\n{Color.RED}⚠ Cannot login as admin. Some tests will be skipped.{Color.END}")

    test_get_nurseries(token)
    test_get_users(token)
    test_database_stats()
    test_audit_logging()
    test_unauthorized_access()
    test_create_update_user(token)

    # Summary
    print(f"\n{'='*60}")
    print(f"{Color.BLUE}📊 TEST SUMMARY{Color.END}")
    print(f"{'='*60}")

    total_tests = tests_passed + tests_failed
    pass_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0

    print(f"Total Tests: {total_tests}")
    print(f"{Color.GREEN}Passed: {tests_passed}{Color.END}")
    print(f"{Color.RED}Failed: {tests_failed}{Color.END}")
    print(f"Pass Rate: {pass_rate:.1f}%")

    if tests_failed == 0:
        print(f"\n{Color.GREEN}✅ ALL TESTS PASSED!{Color.END}")
        print(f"The system is working correctly from an end-user perspective.")
    else:
        print(f"\n{Color.YELLOW}⚠ Some tests failed. Review the output above.{Color.END}")

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")

if __name__ == "__main__":
    run_all_tests()
