#!/usr/bin/env python3
"""
Extended user seeding script for Nursery Management System
Adds more diverse users for testing and demonstration
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Fix encoding for Windows console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import User, RoleEnum, Nursery
from app.security import hash_password

def seed_extended_users():
    """Add more users to the database for comprehensive testing"""
    db = SessionLocal()

    try:
        print("🌱 Seeding extended users...")

        # Get the nursery
        nursery = db.query(Nursery).first()
        if not nursery:
            print("❌ No nursery found! Please run seed_db.py first.")
            return

        # Extended user data
        users_data = [
            # Additional Admins
            {
                "email": "admin2@nursery.com",
                "password": "Admin2Pass!",
                "first_name": "Ahmed",
                "last_name": "Al-Hassan",
                "phone": "+96271111111",
                "role": RoleEnum.ADMIN,
                "nursery_id": nursery.id
            },

            # Additional Managers
            {
                "email": "manager.branch1@nursery.com",
                "password": "Manager1!",
                "first_name": "Layla",
                "last_name": "Al-Mahmoud",
                "phone": "+96272111111",
                "role": RoleEnum.MANAGER,
                "nursery_id": nursery.id
            },
            {
                "email": "manager.branch2@nursery.com",
                "password": "Manager2!",
                "first_name": "Omar",
                "last_name": "Khalil",
                "phone": "+96272222222",
                "role": RoleEnum.MANAGER,
                "nursery_id": nursery.id
            },
            {
                "email": "manager.operations@nursery.com",
                "password": "Manager3!",
                "first_name": "Fatima",
                "last_name": "Nasser",
                "phone": "+96272333333",
                "role": RoleEnum.MANAGER,
                "nursery_id": nursery.id
            },

            # Additional Supervisors
            {
                "email": "supervisor.morning@nursery.com",
                "password": "Super1!",
                "first_name": "Rania",
                "last_name": "Yousef",
                "phone": "+96273111111",
                "role": RoleEnum.SUPERVISOR,
                "nursery_id": nursery.id
            },
            {
                "email": "supervisor.afternoon@nursery.com",
                "password": "Super2!",
                "first_name": "Khaled",
                "last_name": "Ibrahim",
                "phone": "+96273222222",
                "role": RoleEnum.SUPERVISOR,
                "nursery_id": nursery.id
            },
            {
                "email": "supervisor.classroom1@nursery.com",
                "password": "Super3!",
                "first_name": "Hala",
                "last_name": "Mustafa",
                "phone": "+96273333333",
                "role": RoleEnum.SUPERVISOR,
                "nursery_id": nursery.id
            },
            {
                "email": "supervisor.classroom2@nursery.com",
                "password": "Super4!",
                "first_name": "Youssef",
                "last_name": "Hamdan",
                "phone": "+96273444444",
                "role": RoleEnum.SUPERVISOR,
                "nursery_id": nursery.id
            },
            {
                "email": "supervisor.classroom3@nursery.com",
                "password": "Super5!",
                "first_name": "Nour",
                "last_name": "Saleh",
                "phone": "+96273555555",
                "role": RoleEnum.SUPERVISOR,
                "nursery_id": nursery.id
            },

            # Additional Parents
            {
                "email": "parent.smith@nursery.com",
                "password": "Parent1!",
                "first_name": "John",
                "last_name": "Smith",
                "phone": "+96274111111",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.brown@nursery.com",
                "password": "Parent2!",
                "first_name": "Lisa",
                "last_name": "Brown",
                "phone": "+96274222222",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.johnson@nursery.com",
                "password": "Parent3!",
                "first_name": "David",
                "last_name": "Johnson",
                "phone": "+96274333333",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.williams@nursery.com",
                "password": "Parent4!",
                "first_name": "Sarah",
                "last_name": "Williams",
                "phone": "+96274444444",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.jones@nursery.com",
                "password": "Parent5!",
                "first_name": "Michael",
                "last_name": "Jones",
                "phone": "+96274555555",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.garcia@nursery.com",
                "password": "Parent6!",
                "first_name": "Maria",
                "last_name": "Garcia",
                "phone": "+96274666666",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.martinez@nursery.com",
                "password": "Parent7!",
                "first_name": "Carlos",
                "last_name": "Martinez",
                "phone": "+96274777777",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.rodriguez@nursery.com",
                "password": "Parent8!",
                "first_name": "Ana",
                "last_name": "Rodriguez",
                "phone": "+96274888888",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.lee@nursery.com",
                "password": "Parent9!",
                "first_name": "James",
                "last_name": "Lee",
                "phone": "+96274999999",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },
            {
                "email": "parent.ahmed@nursery.com",
                "password": "Parent10!",
                "first_name": "Mona",
                "last_name": "Ahmed",
                "phone": "+96274101010",
                "role": RoleEnum.PARENT,
                "nursery_id": nursery.id
            },

            # Additional Admins (Backup)
            {
                "email": "backup.admin@nursery.com",
                "password": "Backup1!",
                "first_name": "Backup",
                "last_name": "Administrator",
                "phone": "+96275111111",
                "role": RoleEnum.ADMIN,
                "nursery_id": nursery.id
            },
            {
                "email": "deputy.manager@nursery.com",
                "password": "Deputy1!",
                "first_name": "Deputy",
                "last_name": "Manager",
                "phone": "+96275222222",
                "role": RoleEnum.MANAGER,
                "nursery_id": nursery.id
            }
        ]

        created_count = 0
        skipped_count = 0

        for user_data in users_data:
            # Check if user already exists
            existing_user = db.query(User).filter(User.email == user_data["email"]).first()
            if existing_user:
                print(f"⊘ Skipped {user_data['email']} (already exists)")
                skipped_count += 1
                continue

            # Create new user
            password = user_data.pop("password")
            user = User(
                **user_data,
                hashed_password=hash_password(password),
                is_active=True
            )
            db.add(user)
            created_count += 1
            print(f"✓ Created {user_data['role'].value}: {user_data['email']}")

        db.commit()

        print(f"\n✨ Extended user seeding complete!")
        print(f"✓ Created: {created_count} users")
        print(f"⊘ Skipped: {skipped_count} users (already exist)")

        print("\n" + "="*60)
        print("📋 ALL USER ACCOUNTS")
        print("="*60)

        # Print summary by role
        roles = [RoleEnum.ADMIN, RoleEnum.MANAGER, RoleEnum.SUPERVISOR, RoleEnum.PARENT]
        for role in roles:
            users = db.query(User).filter(User.role == role).all()
            if users:
                print(f"\n{role.value.upper()} ({len(users)} users):")
                print("-" * 60)
                for user in users:
                    print(f"  Email: {user.email}")
                    print(f"  Name:  {user.first_name} {user.last_name}")
                    print(f"  Phone: {user.phone}")
                    print()

    except Exception as e:
        print(f"❌ Error seeding extended users: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_extended_users()
