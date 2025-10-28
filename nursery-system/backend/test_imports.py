#!/usr/bin/env python3
"""
Test script to check Flask imports
"""
try:
    from flask import Flask
    print("✓ Flask imported successfully")
except Exception as e:
    print(f"❌ Flask import failed: {e}")

try:
    from app.main import app
    print("✓ App imported successfully")
except Exception as e:
    print(f"❌ App import failed: {e}")

try:
    from app.models import User
    print("✓ Models imported successfully")
except Exception as e:
    print(f"❌ Models import failed: {e}")

try:
    from app.schemas import UserResponse
    print("✓ Schemas imported successfully")
except Exception as e:
    print(f"❌ Schemas import failed: {e}")