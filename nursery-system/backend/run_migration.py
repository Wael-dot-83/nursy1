"""Run Phase 2 migration - execute SQL statements one at a time for SQLite"""
from app.database import engine
from sqlalchemy import text

statements = [
    # 1. CREATE SUPERVISORS_CLASSROOMS JOIN TABLE
    """CREATE TABLE IF NOT EXISTS supervisors_classrooms (
        supervisor_id INTEGER NOT NULL,
        classroom_id INTEGER NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (supervisor_id, classroom_id),
        FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
    )""",
    "CREATE INDEX IF NOT EXISTS idx_supervisors_classrooms_supervisor ON supervisors_classrooms(supervisor_id)",
    "CREATE INDEX IF NOT EXISTS idx_supervisors_classrooms_classroom ON supervisors_classrooms(classroom_id)",
    
    # 2. ADD MISSING CHILD FIELDS
    "ALTER TABLE children ADD COLUMN second_name VARCHAR(50)",
    "ALTER TABLE children ADD COLUMN nationality VARCHAR(100)",
    "ALTER TABLE children ADD COLUMN national_id VARCHAR(50)",
    "ALTER TABLE children ADD COLUMN passport_no VARCHAR(50)",
    "CREATE INDEX IF NOT EXISTS idx_children_nationality ON children(nationality)",
    
    # 3. ADD MISSING DAILY_REPORT FIELDS
    "ALTER TABLE daily_reports ADD COLUMN status VARCHAR(20) DEFAULT 'pending'",
    "ALTER TABLE daily_reports ADD COLUMN manager_feedback TEXT",
    "ALTER TABLE daily_reports ADD COLUMN reviewed_by INTEGER",
    "ALTER TABLE daily_reports ADD COLUMN reviewed_at TIMESTAMP",
    "CREATE INDEX IF NOT EXISTS idx_daily_reports_status ON daily_reports(status)",
    
    # 4. ADD MISSING USER FIELDS
    "ALTER TABLE users ADD COLUMN username VARCHAR(100)",
    "CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_unique ON users(username)",
    
    # 5. ADD CORRELATION_ID TO AUDIT_LOGS
    "ALTER TABLE audit_logs ADD COLUMN correlation_id VARCHAR(100)",
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_correlation ON audit_logs(correlation_id)",
]

conn = engine.connect()
trans = conn.begin()

try:
    for i, stmt in enumerate(statements, 1):
        try:
            conn.execute(text(stmt))
            print(f"[OK] Statement {i}/{len(statements)}: {stmt[:60]}...")
        except Exception as e:
            if "duplicate column name" in str(e).lower() or "already exists" in str(e).lower():
                print(f"[SKIP] Statement {i}/{len(statements)}: Already exists")
            else:
                print(f"[ERROR] Statement {i}/{len(statements)}: {e}")
                raise
    
    trans.commit()
    print("\n[SUCCESS] Migration complete!")
    
except Exception as e:
    trans.rollback()
    print(f"\n[FAILED] Migration failed: {e}")
    raise
finally:
    conn.close()
