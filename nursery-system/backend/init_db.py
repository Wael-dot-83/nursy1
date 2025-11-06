#!/usr/bin/env python3
"""Initialize the database with all tables"""
import sys
sys.path.insert(0, '/app')

from app.database import init_db

if __name__ == "__main__":
    print("Initializing database...")
    init_db()
    print("✓ Database tables created successfully")
