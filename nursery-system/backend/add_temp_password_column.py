#!/usr/bin/env python3
"""
Add temp_password column to users table
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Fix encoding for Windows console
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

from sqlalchemy import text
from app.database import SessionLocal, engine

def add_temp_password_column():
    """Add temp_password column to users table"""
    db = SessionLocal()

    try:
        print("Adding temp_password column to users table...")

        # Check if column already exists
        result = db.execute(text("PRAGMA table_info(users)")).fetchall()
        column_names = [row[1] for row in result]

        if 'temp_password' in column_names:
            print("✓ Column already exists")
            return

        # Add the column
        db.execute(text("ALTER TABLE users ADD COLUMN temp_password VARCHAR(255)"))
        db.commit()

        print("✓ Successfully added temp_password column")

    except Exception as e:
        print(f"❌ Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    add_temp_password_column()
