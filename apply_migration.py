"""Apply branch_id migration using Python"""
import sqlite3
import os

DB_PATH = "nursery-system/backend/storage/nursery.db"
MIGRATION_PATH = "nursery-system/backend/migrations/004_add_branch_id_to_users.sql"

print("Applying branch_id migration...")

if not os.path.exists(DB_PATH):
    print(f"Error: Database not found at {DB_PATH}")
    exit(1)

if not os.path.exists(MIGRATION_PATH):
    print(f"Error: Migration file not found at {MIGRATION_PATH}")
    exit(1)

# Read migration SQL
with open(MIGRATION_PATH, 'r', encoding='utf-8') as f:
    migration_sql = f.read()

# Apply migration
try:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.executescript(migration_sql)
    conn.commit()
    print("✓ Migration applied successfully!")
    
    # Verify
    cursor.execute("PRAGMA table_info(users)")
    columns = cursor.fetchall()
    branch_id_exists = any('branch_id' in str(col) for col in columns)
    
    if branch_id_exists:
        print("✓ branch_id column exists")
    else:
        print("✗ branch_id column not found")
    
    conn.close()
    print("\nDone! Restart your backend to use the new schema.")
    
except Exception as e:
    print(f"✗ Migration failed: {e}")
    exit(1)
