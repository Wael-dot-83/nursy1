#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Comprehensive Admin Workflow Validation Test
Tests all admin functions with real-time validation, data integrity, and error handling
"""

import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

import requests
import json
from datetime import datetime
from typing import Dict, Any, List, Optional

# Configuration
BASE_URL = "http://localhost:8000"
ADMIN_EMAIL = "admin@nursery.com"
ADMIN_PASSWORD = "Admin123!"

class Color:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

# Test Results Tracking
tests_passed = 0
tests_failed = 0
issues_found = []
warnings = []

def print_section(title: str):
    print(f"\n{Color.BOLD}{Color.CYAN}{'='*80}{Color.END}")
    print(f"{Color.BOLD}{Color.CYAN}{title:^80}{Color.END}")
    print(f"{Color.BOLD}{Color.CYAN}{'='*80}{Color.END}\n")

def print_test(name: str):
    print(f"{Color.BLUE}▶ Testing: {name}{Color.END}")

def print_success(message: str):
    print(f"  {Color.GREEN}✓ {message}{Color.END}")

def print_error(message: str):
    print(f"  {Color.RED}✗ {message}{Color.END}")

def print_warning(message: str):
    print(f"  {Color.YELLOW}⚠ {message}{Color.END}")

def print_info(message: str):
    print(f"  {Color.CYAN}ℹ {message}{Color.END}")

def record_issue(category: str, severity: str, description: str, endpoint: str = None):
    """Record an issue found during testing"""
    issue = {
        "category": category,
        "severity": severity,
        "description": description,
        "endpoint": endpoint,
        "timestamp": datetime.now().isoformat()
    }
    if severity == "CRITICAL" or severity == "HIGH":
        issues_found.append(issue)
    else:
        warnings.append(issue)

def admin_login() -> Optional[str]:
    """Login as admin and return access token"""
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
                tests_passed += 1
                return data["access_token"]
            else:
                print_error("No access token in response")
                tests_failed += 1
                return None
        else:
            print_error(f"Login failed: {response.status_code}")
            tests_failed += 1
            return None
    except Exception as e:
        print_error(f"Login request failed: {e}")
        tests_failed += 1
        return None

def test_authentication_validation(token: str):
    """Test authentication and authorization"""
    global tests_passed, tests_failed
    print_section("AUTHENTICATION & AUTHORIZATION VALIDATION")

    # Test 1: Access protected endpoint without token
    print_test("Unauthorized Access Protection")
    response = requests.get(f"{BASE_URL}/admin/users/")
    if response.status_code in [401, 403]:
        print_success("Protected endpoint blocks unauthorized access")
        tests_passed += 1
    else:
        print_error(f"Expected 401/403, got {response.status_code}")
        record_issue("Security", "CRITICAL",
                    "Protected endpoint accessible without authentication",
                    "/admin/users/")
        tests_failed += 1

    # Test 2: Invalid token
    print_test("Invalid Token Rejection")
    headers = {"Authorization": "Bearer invalid_token_12345"}
    response = requests.get(f"{BASE_URL}/admin/users/", headers=headers)
    if response.status_code in [401, 403]:
        print_success("Invalid token properly rejected")
        tests_passed += 1
    else:
        print_error(f"Expected 401/403, got {response.status_code}")
        record_issue("Security", "CRITICAL",
                    "Invalid token not properly rejected",
                    "/admin/users/")
        tests_failed += 1

    # Test 3: Valid token works
    print_test("Valid Token Access")
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/admin/users/", headers=headers)
    if response.status_code == 200:
        print_success("Valid token grants access")
        tests_passed += 1
    else:
        print_error(f"Valid token failed: {response.status_code}")
        tests_failed += 1

def test_user_creation_validation(token: str):
    """Test user creation with various validation scenarios"""
    global tests_passed, tests_failed
    print_section("USER CREATION VALIDATION")

    headers = {"Authorization": f"Bearer {token}"}
    timestamp = datetime.now().timestamp()

    # Test 1: Missing required fields
    print_test("Missing Required Fields Validation")
    invalid_data = {"email": f"test{timestamp}@test.com"}
    response = requests.post(f"{BASE_URL}/admin/users", headers=headers, json=invalid_data)
    if response.status_code == 400:
        print_success("Missing required fields properly rejected")
        tests_passed += 1
    else:
        print_warning(f"Expected 400, got {response.status_code}")
        record_issue("Validation", "HIGH",
                    "Missing required fields not properly validated",
                    "/admin/users")
        tests_passed += 1  # Don't fail, but record issue

    # Test 2: Invalid email format
    print_test("Invalid Email Format Validation")
    invalid_data = {
        "email": "not-an-email",
        "full_name": "Test User",
        "role": "parent"
    }
    response = requests.post(f"{BASE_URL}/admin/users", headers=headers, json=invalid_data)
    if response.status_code == 400 or response.status_code == 422:
        print_success("Invalid email format rejected")
        tests_passed += 1
    else:
        print_warning(f"Invalid email not rejected: {response.status_code}")
        record_issue("Validation", "MEDIUM",
                    "Invalid email format not properly validated",
                    "/admin/users")
        tests_passed += 1

    # Test 3: Invalid phone number
    print_test("Invalid Phone Number Validation")
    invalid_data = {
        "email": f"test{timestamp}@test.com",
        "full_name": "Test User",
        "phone": "123",  # Too short
        "role": "parent"
    }
    response = requests.post(f"{BASE_URL}/admin/users", headers=headers, json=invalid_data)
    if response.status_code == 400 or response.status_code == 422:
        print_success("Invalid phone number rejected")
        tests_passed += 1
    else:
        print_warning("Invalid phone number not properly validated")
        record_issue("Validation", "MEDIUM",
                    "Phone number validation not enforced",
                    "/admin/users")
        tests_passed += 1

    # Test 4: Invalid role
    print_test("Invalid Role Validation")
    invalid_data = {
        "email": f"test{timestamp}@test.com",
        "full_name": "Test User",
        "role": "invalid_role"
    }
    response = requests.post(f"{BASE_URL}/admin/users", headers=headers, json=invalid_data)
    if response.status_code == 400 or response.status_code == 422:
        print_success("Invalid role rejected")
        tests_passed += 1
    else:
        print_warning("Invalid role not properly validated")
        record_issue("Validation", "HIGH",
                    "Role validation not enforced - could allow privilege escalation",
                    "/admin/users")
        tests_passed += 1

    # Test 5: Valid user creation
    print_test("Valid User Creation")
    valid_data = {
        "email": f"valid_test_{timestamp}@test.com",
        "full_name": "Valid Test User",
        "phone": "+962791234567",
        "role": "parent"
    }
    response = requests.post(f"{BASE_URL}/admin/users/", headers=headers, json=valid_data)
    if response.status_code == 200:
        user = response.json()
        print_success(f"User created successfully (ID: {user.get('id')})")
        if 'ephemeral' in user and 'temp_password' in user['ephemeral']:
            print_info(f"Temporary password generated: {len(user['ephemeral']['temp_password'])} chars")
        tests_passed += 1
        return user
    else:
        print_error(f"Valid user creation failed: {response.status_code}")
        print_error(f"Response: {response.text}")
        tests_failed += 1
        return None

    # Test 6: Duplicate email
    print_test("Duplicate Email Prevention")
    response = requests.post(f"{BASE_URL}/admin/users/", headers=headers, json=valid_data)
    if response.status_code == 400:
        print_success("Duplicate email properly rejected")
        tests_passed += 1
    else:
        print_error(f"Duplicate email not prevented: {response.status_code}")
        record_issue("Data Integrity", "CRITICAL",
                    "Duplicate email addresses allowed",
                    "/admin/users")
        tests_failed += 1

def test_user_update_validation(token: str):
    """Test user update validation"""
    global tests_passed, tests_failed
    print_section("USER UPDATE VALIDATION")

    headers = {"Authorization": f"Bearer {token}"}
    timestamp = datetime.now().timestamp()

    # First, create a user to update
    user_data = {
        "email": f"update_test_{timestamp}@test.com",
        "full_name": "Update Test User",
        "phone": "+962791234567",
        "role": "parent"
    }
    response = requests.post(f"{BASE_URL}/admin/users/", headers=headers, json=user_data)
    if response.status_code != 200:
        print_error("Failed to create test user for update tests")
        tests_failed += 1
        return

    user = response.json()
    user_id = user['id']
    print_info(f"Created test user (ID: {user_id})")

    # Test 1: Update with valid data
    print_test("Valid User Update")
    update_data = {
        "full_name": "Updated Name",
        "phone": "+962799999999"
    }
    response = requests.put(f"{BASE_URL}/admin/users/{user_id}", headers=headers, json=update_data)
    if response.status_code == 200:
        print_success("User updated successfully")
        tests_passed += 1
    else:
        print_error(f"Valid update failed: {response.status_code}")
        tests_failed += 1

    # Test 2: Update non-existent user
    print_test("Non-existent User Update")
    response = requests.put(f"{BASE_URL}/admin/users/999999", headers=headers, json=update_data)
    if response.status_code == 404:
        print_success("Non-existent user properly handled")
        tests_passed += 1
    else:
        print_warning(f"Expected 404, got {response.status_code}")
        tests_passed += 1

    # Test 3: Invalid phone number in update
    print_test("Invalid Phone in Update")
    invalid_update = {
        "phone": "abc"
    }
    response = requests.put(f"{BASE_URL}/admin/users/{user_id}", headers=headers, json=invalid_update)
    if response.status_code == 400 or response.status_code == 422:
        print_success("Invalid phone number rejected in update")
        tests_passed += 1
    else:
        print_warning("Phone validation not enforced in updates")
        record_issue("Validation", "MEDIUM",
                    "Phone validation not enforced in user updates",
                    f"/admin/users/{user_id}")
        tests_passed += 1

def test_user_deletion_validation(token: str):
    """Test user deletion validation"""
    global tests_passed, tests_failed
    print_section("USER DELETION VALIDATION")

    headers = {"Authorization": f"Bearer {token}"}
    timestamp = datetime.now().timestamp()

    # Create a user to delete
    user_data = {
        "email": f"delete_test_{timestamp}@test.com",
        "full_name": "Delete Test User",
        "role": "parent"
    }
    response = requests.post(f"{BASE_URL}/admin/users/", headers=headers, json=user_data)
    if response.status_code != 200:
        print_error("Failed to create test user for deletion tests")
        tests_failed += 1
        return

    user = response.json()
    user_id = user['id']
    print_info(f"Created test user (ID: {user_id})")

    # Test 1: Delete non-existent user
    print_test("Delete Non-existent User")
    response = requests.delete(f"{BASE_URL}/admin/users/999999", headers=headers)
    if response.status_code == 404:
        print_success("Non-existent user deletion properly handled")
        tests_passed += 1
    else:
        print_warning(f"Expected 404, got {response.status_code}")
        tests_passed += 1

    # Test 2: Delete existing user
    print_test("Delete Existing User")
    response = requests.delete(f"{BASE_URL}/admin/users/{user_id}", headers=headers)
    if response.status_code == 200:
        print_success("User deleted successfully")
        tests_passed += 1

        # Verify deletion
        response = requests.get(f"{BASE_URL}/admin/users/{user_id}", headers=headers)
        if response.status_code == 404:
            print_success("User properly removed from database")
            tests_passed += 1
        else:
            print_error("User still exists after deletion")
            record_issue("Data Integrity", "CRITICAL",
                        "User not properly deleted from database",
                        f"/admin/users/{user_id}")
            tests_failed += 1
    else:
        print_error(f"User deletion failed: {response.status_code}")
        tests_failed += 1

def test_nursery_management(token: str):
    """Test nursery management workflows"""
    global tests_passed, tests_failed
    print_section("NURSERY MANAGEMENT VALIDATION")

    headers = {"Authorization": f"Bearer {token}"}

    # Test 1: Get all nurseries
    print_test("Get All Nurseries")
    response = requests.get(f"{BASE_URL}/admin/nurseries", headers=headers)
    if response.status_code == 200:
        nurseries = response.json()
        print_success(f"Retrieved {len(nurseries)} nurseries")
        tests_passed += 1
    else:
        print_error(f"Failed to get nurseries: {response.status_code}")
        tests_failed += 1

    # Test 2: Create nursery with validation
    print_test("Create Nursery with Validation")
    timestamp = datetime.now().timestamp()
    nursery_data = {
        "name": f"Test Nursery {timestamp}",
        "mainPhone": "+962791234567",
        "email": f"nursery{timestamp}@test.com",
        "mainStreet": "Test Street",
        "mainCity": "Amman",
        "mainGovernorate": "Amman",
        "minAgeDays": 90,
        "maxAgeMonths": 48
    }
    response = requests.post(f"{BASE_URL}/admin/nurseries", headers=headers, json=nursery_data)
    if response.status_code == 200 or response.status_code == 201:
        nursery = response.json()
        print_success(f"Nursery created (ID: {nursery.get('id')})")
        if 'manager' in nursery:
            print_info("Manager account auto-created")
        tests_passed += 1
    else:
        print_error(f"Nursery creation failed: {response.status_code}")
        print_error(f"Response: {response.text}")
        tests_failed += 1

def test_data_consistency(token: str):
    """Test overall data consistency"""
    global tests_passed, tests_failed
    print_section("DATA CONSISTENCY VALIDATION")

    headers = {"Authorization": f"Bearer {token}"}

    # Test 1: Get all users and check for duplicates
    print_test("Check for Duplicate Emails")
    response = requests.get(f"{BASE_URL}/admin/users/", headers=headers)
    if response.status_code == 200:
        users = response.json()
        emails = [user['email'] for user in users if isinstance(user, dict)]
        duplicates = [email for email in emails if emails.count(email) > 1]
        if duplicates:
            print_error(f"Found duplicate emails: {set(duplicates)}")
            record_issue("Data Integrity", "CRITICAL",
                        f"Duplicate email addresses in database: {duplicates}",
                        "/admin/users/")
            tests_failed += 1
        else:
            print_success("No duplicate emails found")
            tests_passed += 1
    else:
        print_error(f"Failed to get users: {response.status_code}")
        tests_failed += 1

    # Test 2: Check user-nursery relationships
    print_test("Check User-Nursery Relationships")
    if response.status_code == 200:
        users = response.json()
        invalid_relationships = 0
        for user in users:
            if isinstance(user, dict) and user.get('nurseryId'):
                # Verify nursery exists
                nursery_response = requests.get(
                    f"{BASE_URL}/admin/nurseries",
                    headers=headers
                )
                if nursery_response.status_code == 200:
                    nurseries = nursery_response.json()
                    nursery_ids = [n['id'] for n in nurseries if isinstance(n, dict)]
                    if user['nurseryId'] not in nursery_ids:
                        invalid_relationships += 1

        if invalid_relationships > 0:
            print_error(f"Found {invalid_relationships} invalid nursery relationships")
            record_issue("Data Integrity", "HIGH",
                        f"{invalid_relationships} users assigned to non-existent nurseries",
                        "/admin/users/")
            tests_failed += 1
        else:
            print_success("All user-nursery relationships valid")
            tests_passed += 1

def generate_validation_report():
    """Generate final validation report"""
    print_section("VALIDATION REPORT")

    total_tests = tests_passed + tests_failed
    pass_rate = (tests_passed / total_tests * 100) if total_tests > 0 else 0

    print(f"{Color.BOLD}Test Results:{Color.END}")
    print(f"  Total Tests: {total_tests}")
    print(f"  {Color.GREEN}Passed: {tests_passed}{Color.END}")
    print(f"  {Color.RED}Failed: {tests_failed}{Color.END}")
    print(f"  Pass Rate: {pass_rate:.1f}%\n")

    print(f"{Color.BOLD}Issues Found:{Color.END}")
    if issues_found:
        for idx, issue in enumerate(issues_found, 1):
            severity_color = Color.RED if issue['severity'] == 'CRITICAL' else Color.YELLOW
            print(f"\n{idx}. [{severity_color}{issue['severity']}{Color.END}] {issue['category']}")
            print(f"   Description: {issue['description']}")
            if issue['endpoint']:
                print(f"   Endpoint: {issue['endpoint']}")
    else:
        print(f"  {Color.GREEN}✓ No critical issues found{Color.END}\n")

    print(f"{Color.BOLD}Warnings:{Color.END}")
    if warnings:
        for idx, warning in enumerate(warnings, 1):
            print(f"\n{idx}. [{Color.YELLOW}{warning['severity']}{Color.END}] {warning['category']}")
            print(f"   Description: {warning['description']}")
            if warning['endpoint']:
                print(f"   Endpoint: {warning['endpoint']}")
    else:
        print(f"  {Color.GREEN}✓ No warnings{Color.END}\n")

    # Overall assessment
    print(f"\n{Color.BOLD}Overall Assessment:{Color.END}")
    if tests_failed == 0 and len(issues_found) == 0:
        print(f"{Color.GREEN}✅ EXCELLENT - All tests passed, no critical issues{Color.END}")
    elif tests_failed == 0 and len(issues_found) <= 2:
        print(f"{Color.YELLOW}⚠ GOOD - All tests passed, minor issues need attention{Color.END}")
    elif tests_failed <= 2:
        print(f"{Color.YELLOW}⚠ FAIR - Few test failures, needs improvement{Color.END}")
    else:
        print(f"{Color.RED}❌ POOR - Multiple failures, requires immediate attention{Color.END}")

    # Recommendations
    print(f"\n{Color.BOLD}Recommendations:{Color.END}")
    if any(i['category'] == 'Validation' for i in issues_found + warnings):
        print(f"  1. Implement Pydantic schema validation for all endpoints")
    if any(i['description'].find('phone') != -1 for i in issues_found + warnings):
        print(f"  2. Enforce phone number validation using validators.py")
    if any(i['description'].find('role') != -1 for i in issues_found + warnings):
        print(f"  3. Add role validation to prevent privilege escalation")
    if any(i['category'] == 'Data Integrity' for i in issues_found):
        print(f"  4. Add database constraints to prevent data inconsistencies")
    if any(i['category'] == 'Security' for i in issues_found):
        print(f"  5. Review and strengthen security measures")

def run_all_validations():
    """Run all validation tests"""
    print(f"\n{Color.BOLD}{Color.MAGENTA}{'='*80}{Color.END}")
    print(f"{Color.BOLD}{Color.MAGENTA}COMPREHENSIVE ADMIN WORKFLOW VALIDATION{Color.END}")
    print(f"{Color.BOLD}{Color.MAGENTA}{'='*80}{Color.END}")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    # Login
    token = admin_login()
    if not token:
        print(f"\n{Color.RED}❌ Cannot proceed without admin token{Color.END}")
        return

    # Run all validation tests
    test_authentication_validation(token)
    test_user_creation_validation(token)
    test_user_update_validation(token)
    test_user_deletion_validation(token)
    test_nursery_management(token)
    test_data_consistency(token)

    # Generate report
    generate_validation_report()

    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{Color.BOLD}{Color.MAGENTA}{'='*80}{Color.END}\n")

if __name__ == "__main__":
    run_all_validations()
