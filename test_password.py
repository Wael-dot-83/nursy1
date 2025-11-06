#!/usr/bin/env python3
"""Test password verification for admin user"""
import sys
sys.path.insert(0, '/app')

from app.database import SessionLocal
from app.models import User
from app.security import verify_password

db = SessionLocal()

# Get admin user
user = db.query(User).filter(User.email == "admin@example.com").first()

if not user:
    print("❌ Admin user not found!")
    sys.exit(1)

print(f"✅ User found: {user.email}")
print(f"   Role: {user.role}")
print(f"   Active: {user.is_active}")
print(f"   Failed attempts: {user.failed_login_attempts}")
print(f"   Locked until: {user.account_locked_until}")
print()

# Test passwords
passwords = [
    "Admin123!",
    "admin123!",
    "Admin123",
    "admin123",
]

print("Testing passwords:")
for pwd in passwords:
    result = verify_password(pwd, user.hashed_password)
    status = "✅ MATCH" if result else "❌ NO MATCH"
    print(f"  {status}: '{pwd}'")

db.close()
