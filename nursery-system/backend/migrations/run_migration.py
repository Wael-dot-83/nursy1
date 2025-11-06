"""Run database migration"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from app.database import engine
from sqlalchemy import text

def run_migration():
    with open('migrations/001_add_nursery_normalization.sql', 'r', encoding='utf-8') as f:
        sql = f.read()
    
    with engine.connect() as conn:
        for statement in sql.split(';'):
            statement = statement.strip()
            if statement and not statement.startswith('--'):
                try:
                    conn.execute(text(statement))
                    conn.commit()
                    print(f"OK Executed: {statement[:50]}...")
                except Exception as e:
                    print(f"ERROR: {e}")
                    print(f"  Statement: {statement[:100]}")

if __name__ == '__main__':
    run_migration()
    print("\nMigration complete")
