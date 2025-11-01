#!/usr/bin/env python3
"""
Add critical database constraints:
1. Unique constraint on attendance(child_id, date)
2. Unique constraint on daily_reports(child_id, date)
"""
import sys
import os

# Fix encoding for Windows
if sys.platform == "win32":
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.database import SessionLocal

def add_constraints():
    """Add unique constraints to attendance and daily_reports"""
    db = SessionLocal()

    try:
        print("🔧 Adding database constraints...")
        print()

        # Check and add attendance constraint
        print("1️⃣  Checking attendance table...")
        result = db.execute(text("""
            SELECT name FROM sqlite_master
            WHERE type='index'
            AND tbl_name='attendance'
            AND sql LIKE '%UNIQUE%'
            AND sql LIKE '%child_id%'
            AND sql LIKE '%date%'
        """)).fetchall()

        if result:
            print("✅ Unique constraint already exists on attendance(child_id, date)")
        else:
            print("   Adding unique constraint...")
            try:
                db.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_attendance_child_date
                    ON attendance(child_id, date)
                """))
                db.commit()
                print("✅ Successfully added unique constraint on attendance(child_id, date)")
            except Exception as e:
                if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
                    print("✅ Constraint already exists")
                else:
                    print(f"❌ Error adding constraint: {e}")
                    db.rollback()

        print()

        # Check and add daily_reports constraint
        print("2️⃣  Checking daily_reports table...")
        result = db.execute(text("""
            SELECT name FROM sqlite_master
            WHERE type='index'
            AND tbl_name='daily_reports'
            AND sql LIKE '%UNIQUE%'
            AND sql LIKE '%child_id%'
            AND sql LIKE '%date%'
        """)).fetchall()

        if result:
            print("✅ Unique constraint already exists on daily_reports(child_id, date)")
        else:
            print("   Adding unique constraint...")
            try:
                db.execute(text("""
                    CREATE UNIQUE INDEX IF NOT EXISTS uq_daily_reports_child_date
                    ON daily_reports(child_id, date)
                """))
                db.commit()
                print("✅ Successfully added unique constraint on daily_reports(child_id, date)")
            except Exception as e:
                if "UNIQUE constraint failed" in str(e) or "already exists" in str(e):
                    print("✅ Constraint already exists")
                else:
                    print(f"❌ Error adding constraint: {e}")
                    db.rollback()

        print()
        print("="*80)
        print("✨ Database constraints update complete!")
        print("="*80)

    except Exception as e:
        print(f"❌ Fatal error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    add_constraints()
