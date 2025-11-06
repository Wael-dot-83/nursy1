"""
Database seeding with idempotent operations.
All seeds use UPSERT logic to prevent duplicates.
"""
import sys
from sqlalchemy.exc import IntegrityError

from .database import SessionLocal
from .models import Governorate, User, RoleEnum
from .security import hash_password


def seed_governorates(db):
    """Seed Jordan's 12 governorates (idempotent)."""
    governorates_data = [
        {"name_en": "Amman", "name_ar": "عمان", "code": "AM"},
        {"name_en": "Irbid", "name_ar": "إربد", "code": "IR"},
        {"name_en": "Zarqa", "name_ar": "الزرقاء", "code": "ZA"},
        {"name_en": "Balqa", "name_ar": "البلقاء", "code": "BA"},
        {"name_en": "Madaba", "name_ar": "مادبا", "code": "MA"},
        {"name_en": "Jerash", "name_ar": "جرش", "code": "JE"},
        {"name_en": "Ajloun", "name_ar": "عجلون", "code": "AJ"},
        {"name_en": "Karak", "name_ar": "الكرك", "code": "KA"},
        {"name_en": "Tafilah", "name_ar": "الطفيلة", "code": "TA"},
        {"name_en": "Ma'an", "name_ar": "معان", "code": "MN"},
        {"name_en": "Mafraq", "name_ar": "المفرق", "code": "MF"},
        {"name_en": "Aqaba", "name_ar": "العقبة", "code": "AQ"},
    ]
    
    inserted = 0
    for gov_data in governorates_data:
        # Check if governorate already exists (database-agnostic)
        existing = db.query(Governorate).filter(Governorate.code == gov_data["code"]).first()
        if not existing:
            gov = Governorate(**gov_data)
            db.add(gov)
            inserted += 1
    
    db.commit()
    print(f"  ✓ Governorates: {inserted} inserted, {len(governorates_data) - inserted} already exist")


def seed_admin_user(db):
    """Seed a default admin user (idempotent)."""
    admin_email = "admin@example.com"
    admin_password = "Admin123!"
    
    # Check if admin exists
    existing = db.query(User).filter(User.email_normalized == admin_email.lower()).first()
    if existing:
        print(f"  ✓ Admin user already exists: {admin_email}")
        return
    
    # Create admin user
    admin = User(
        email=admin_email,
        email_normalized=admin_email.lower(),
        hashed_password=hash_password(admin_password),
        temp_password=admin_password,
        must_reset_password=False,
        first_name="System",
        last_name="Administrator",
        phone="0790000000",
        role=RoleEnum.ADMIN,
        is_active=True,
    )
    db.add(admin)
    db.commit()
    print(f"  ✓ Admin user created: {admin_email} / {admin_password}")


def seed_database():
    """Run all seeds."""
    db = SessionLocal()
    try:
        print("Starting database seeding...")
        seed_governorates(db)
        seed_admin_user(db)
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
