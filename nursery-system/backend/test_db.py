#!/usr/bin/env python3
"""
Test database operations
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User
from app.security import verify_password

def test_database():
    """Test database operations"""
    db = SessionLocal()

    try:
        print("🧪 Testing database operations...")

        # Test user query
        user = db.query(User).filter(User.email == "admin@nursery.com").first()
        if user:
            print("✓ User query works")
            print(f"  User: {user.first_name} {user.last_name} ({user.role.value})")

            # Test password verification
            if verify_password("Admin123!", user.hashed_password):
                print("✓ Password verification works")
            else:
                print("❌ Password verification failed")
        else:
            print("❌ User query failed")

        # Count total users
        user_count = db.query(User).count()
        print(f"✓ Total users in database: {user_count}")

        print("\n✅ Database operations working correctly!")

    except Exception as e:
        print(f"❌ Database test failed: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_database()