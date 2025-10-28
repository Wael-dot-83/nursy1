#!/usr/bin/env python3
"""
Database seeding script for Nursery Management System
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from datetime import datetime, date
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models import User, Nursery, Branch, Classroom, Child, RoleEnum, ChildStatus
from app.security import hash_password

from app.database import engine
from app.models import Base

def seed_database():
    """Seed the database with initial data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("🌱 Seeding database...")

        # Create admin user
        admin_user = User(
            email="admin@nursery.com",
            hashed_password=hash_password("Admin123!"),
            first_name="System",
            last_name="Administrator",
            phone="+96271234567",
            role=RoleEnum.ADMIN,
            is_active=True
        )
        db.add(admin_user)
        print("✓ Created admin user: admin@nursery.com / Admin123!")

        # Create sample nursery
        nursery = Nursery(
            name="Little Stars Nursery",
            main_street="123 Main Street",
            main_city="Amman",
            main_governorate="Amman",
            main_postal_code="11183",
            main_phone="+96271234567",
            email="info@littlestars.com",
            min_age_days=70,  # 2 months
            max_age_months=60,  # 5 years
            notes="A wonderful place for children to learn and grow"
        )
        db.add(nursery)
        db.flush()  # Get the nursery ID

        # Update admin user with nursery_id
        admin_user.nursery_id = nursery.id

        # Create manager user
        manager_user = User(
            email="manager@nursery.com",
            hashed_password=hash_password("Manager123!"),
            first_name="Sarah",
            last_name="Johnson",
            phone="+96272345678",
            role=RoleEnum.MANAGER,
            nursery_id=nursery.id,
            is_active=True
        )
        db.add(manager_user)

        # Create supervisor user
        supervisor_user = User(
            email="supervisor@nursery.com",
            hashed_password=hash_password("Supervisor123!"),
            first_name="Mike",
            last_name="Wilson",
            phone="+96273456789",
            role=RoleEnum.SUPERVISOR,
            nursery_id=nursery.id,
            is_active=True
        )
        db.add(supervisor_user)

        # Create parent user
        parent_user = User(
            email="parent@nursery.com",
            hashed_password=hash_password("Parent123!"),
            first_name="Emily",
            last_name="Davis",
            phone="+96274567890",
            role=RoleEnum.PARENT,
            nursery_id=nursery.id,
            is_active=True
        )
        db.add(parent_user)
        db.flush()

        # Create branch
        branch = Branch(
            name="Main Branch",
            address_street="123 Main Street",
            address_city="Amman",
            address_governorate="Amman",
            address_postal_code="11183",
            nursery_id=nursery.id
        )
        db.add(branch)
        db.flush()

        # Create classrooms
        classroom1 = Classroom(
            name="Sunshine Room (Ages 2-3)",
            capacity=15,
            branch_id=branch.id
        )
        db.add(classroom1)

        classroom2 = Classroom(
            name="Rainbow Room (Ages 3-4)",
            capacity=15,
            branch_id=branch.id
        )
        db.add(classroom2)

        classroom3 = Classroom(
            name="Star Room (Ages 4-5)",
            capacity=15,
            branch_id=branch.id
        )
        db.add(classroom3)
        db.flush()

        # Create sample children
        children_data = [
            {
                "first_name": "Oliver",
                "last_name": "Smith",
                "date_of_birth": date(2021, 5, 15),
                "gender": "male",
                "emergency_contact": "John Smith",
                "emergency_phone": "+96275678901",
                "classroom_id": classroom1.id,
                "parent_id": parent_user.id
            },
            {
                "first_name": "Sophia",
                "last_name": "Brown",
                "date_of_birth": date(2020, 8, 22),
                "gender": "female",
                "emergency_contact": "Lisa Brown",
                "emergency_phone": "+96276789012",
                "classroom_id": classroom2.id,
                "parent_id": parent_user.id
            },
            {
                "first_name": "Liam",
                "last_name": "Johnson",
                "date_of_birth": date(2020, 12, 10),
                "gender": "male",
                "emergency_contact": "David Johnson",
                "emergency_phone": "+96277890123",
                "classroom_id": classroom3.id,
                "parent_id": parent_user.id
            },
            {
                "first_name": "Emma",
                "last_name": "Williams",
                "date_of_birth": date(2021, 3, 8),
                "gender": "female",
                "emergency_contact": "Sarah Williams",
                "emergency_phone": "+96278901234",
                "classroom_id": classroom1.id,
                "parent_id": parent_user.id
            },
            {
                "first_name": "Noah",
                "last_name": "Jones",
                "date_of_birth": date(2020, 11, 30),
                "gender": "male",
                "emergency_contact": "Michael Jones",
                "emergency_phone": "+96279012345",
                "classroom_id": classroom2.id,
                "parent_id": parent_user.id
            }
        ]

        for child_data in children_data:
            child = Child(**child_data)
            db.add(child)

        # Commit all changes
        db.commit()

        print("✓ Database seeded successfully!")
        print("\n📋 Test Accounts:")
        print("Admin: admin@nursery.com / Admin123!")
        print("Manager: manager@nursery.com / Manager123!")
        print("Supervisor: supervisor@nursery.com / Supervisor123!")
        print("Parent: parent@nursery.com / Parent123!")
        print("\n🏢 Created nursery: Little Stars Nursery")
        print("🏫 Created 3 classrooms with sample children")

    except Exception as e:
        print(f"❌ Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()