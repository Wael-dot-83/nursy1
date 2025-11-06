#!/usr/bin/env python3
"""
Database seeding script for Nursery Management System.
Creates a demo dataset with core roles, a nursery hierarchy, and sample children.
"""

import os
import sys
from datetime import date

# Ensure app package is importable when script executed from project root.
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Normalise stdout encoding on Windows PowerShell to avoid Unicode errors.
if sys.platform == "win32":
    import io  # noqa: E402

    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8")

from slugify import slugify  # noqa: E402

from app.database import SessionLocal, engine  # noqa: E402
from app.models import (  # noqa: E402
    Base,
    Branch,
    Child,
    Classroom,
    Nursery,
    RoleEnum,
    User,
)
from app.security import hash_password  # noqa: E402


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def normalize_phone(phone: str) -> str:
    return "".join(ch for ch in (phone or "") if ch.isdigit())


def normalize_name(value: str) -> str:
    return slugify(value or "", separator="_")


def seed_database() -> None:
    """Seed the database with demo data."""
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        print("[*] Seeding database...")

        admin_email = "admin@nursery.com"
        manager_email = "manager@nursery.com"
        supervisor_email = "supervisor@nursery.com"
        parent_email = "parent@nursery.com"

        admin_user = User(
            email=admin_email,
            email_normalized=normalize_email(admin_email),
            hashed_password=hash_password("Admin123!"),
            first_name="System",
            last_name="Administrator",
            phone="+96271234567",
            role=RoleEnum.ADMIN,
            is_active=True,
        )
        db.add(admin_user)
        print("[+] Created admin user: admin@nursery.com / Admin123!")

        nursery = Nursery(
            name="Little Stars Nursery",
            name_normalized=normalize_name("Little Stars Nursery"),
            branch_name=None,
            branch_normalized="",
            main_street="123 Main Street",
            main_city="Amman",
            main_governorate="Amman",
            main_postal_code="11183",
            main_phone="+96271234567",
            phone_normalized=normalize_phone("+96271234567"),
            email="info@littlestars.com",
            min_age_days=70,
            max_age_months=60,
            notes="Demo nursery created by seed_db.py",
            is_active=True,
        )
        db.add(nursery)
        db.flush()
        admin_user.nursery_id = nursery.id

        manager_user = User(
            email=manager_email,
            email_normalized=normalize_email(manager_email),
            hashed_password=hash_password("Manager123!"),
            first_name="Sarah",
            last_name="Johnson",
            phone="+96272345678",
            role=RoleEnum.MANAGER,
            nursery_id=nursery.id,
            is_active=True,
        )
        db.add(manager_user)

        supervisor_user = User(
            email=supervisor_email,
            email_normalized=normalize_email(supervisor_email),
            hashed_password=hash_password("Supervisor123!"),
            first_name="Mike",
            last_name="Wilson",
            phone="+96273456789",
            role=RoleEnum.SUPERVISOR,
            nursery_id=nursery.id,
            is_active=True,
        )
        db.add(supervisor_user)

        parent_user = User(
            email=parent_email,
            email_normalized=normalize_email(parent_email),
            hashed_password=hash_password("Parent123!"),
            first_name="Emily",
            last_name="Davis",
            phone="+96274567890",
            role=RoleEnum.PARENT,
            nursery_id=nursery.id,
            is_active=True,
        )
        db.add(parent_user)
        db.flush()

        branch = Branch(
            name="Main Branch",
            address_street="123 Main Street",
            address_city="Amman",
            address_governorate="Amman",
            address_postal_code="11183",
            nursery_id=nursery.id,
        )
        db.add(branch)
        db.flush()

        classroom1 = Classroom(
            name="Sunshine Room (Ages 2-3)",
            capacity=15,
            branch_id=branch.id,
        )
        db.add(classroom1)

        classroom2 = Classroom(
            name="Rainbow Room (Ages 3-4)",
            capacity=15,
            branch_id=branch.id,
        )
        db.add(classroom2)

        classroom3 = Classroom(
            name="Star Room (Ages 4-5)",
            capacity=15,
            branch_id=branch.id,
        )
        db.add(classroom3)
        db.flush()

        children_data = [
            {
                "first_name": "Oliver",
                "last_name": "Smith",
                "date_of_birth": date(2021, 5, 15),
                "gender": "male",
                "emergency_contact": "John Smith",
                "emergency_phone": "+96275678901",
                "classroom_id": classroom1.id,
                "parent_id": parent_user.id,
                "nursery_id": nursery.id,
            },
            {
                "first_name": "Sophia",
                "last_name": "Brown",
                "date_of_birth": date(2020, 8, 22),
                "gender": "female",
                "emergency_contact": "Lisa Brown",
                "emergency_phone": "+96276789012",
                "classroom_id": classroom2.id,
                "parent_id": parent_user.id,
                "nursery_id": nursery.id,
            },
            {
                "first_name": "Liam",
                "last_name": "Johnson",
                "date_of_birth": date(2020, 12, 10),
                "gender": "male",
                "emergency_contact": "David Johnson",
                "emergency_phone": "+96277890123",
                "classroom_id": classroom3.id,
                "parent_id": parent_user.id,
                "nursery_id": nursery.id,
            },
            {
                "first_name": "Emma",
                "last_name": "Williams",
                "date_of_birth": date(2021, 3, 8),
                "gender": "female",
                "emergency_contact": "Sarah Williams",
                "emergency_phone": "+96278901234",
                "classroom_id": classroom1.id,
                "parent_id": parent_user.id,
                "nursery_id": nursery.id,
            },
            {
                "first_name": "Noah",
                "last_name": "Jones",
                "date_of_birth": date(2020, 11, 30),
                "gender": "male",
                "emergency_contact": "Michael Jones",
                "emergency_phone": "+96279012345",
                "classroom_id": classroom2.id,
                "parent_id": parent_user.id,
                "nursery_id": nursery.id,
            },
        ]

        for payload in children_data:
            db.add(Child(**payload))

        db.commit()

        print("[+] Database seeded successfully!")
        print("\nAvailable test accounts:")
        print("  - Admin: admin@nursery.com / Admin123!")
        print("  - Manager: manager@nursery.com / Manager123!")
        print("  - Supervisor: supervisor@nursery.com / Supervisor123!")
        print("  - Parent: parent@nursery.com / Parent123!")
        print("\nCreated nursery: Little Stars Nursery")
        print("Created 3 classrooms with sample children")

    except Exception as exc:  # pragma: no cover - diagnostic aid
        db.rollback()
        print(f"[!] Error seeding database: {exc}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
