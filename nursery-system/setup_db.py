#!/usr/bin/env python3
"""
Database setup script for Nursery Management System
"""
import mysql.connector
from mysql.connector import Error

def create_database():
    try:
        # Connect without specifying database
        connection = mysql.connector.connect(
            host='localhost',
            user='root',
            password='83@Wael1'
        )

        if connection.is_connected():
            cursor = connection.cursor()

            # Create database if it doesn't exist
            cursor.execute("""
                CREATE DATABASE IF NOT EXISTS nursery_db
                CHARACTER SET utf8mb4
                COLLATE utf8mb4_unicode_ci
            """)

            print("✅ Database 'nursery_db' created successfully")

            # Verify database exists
            cursor.execute("SHOW DATABASES LIKE 'nursery_db'")
            result = cursor.fetchone()

            if result:
                print("✅ Database verification successful")
            else:
                print("❌ Database creation failed")

    except Error as e:
        print(f"❌ Error: {e}")
        return False

    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()
            print("✅ MySQL connection closed")

    return True

if __name__ == "__main__":
    print("🚀 Setting up Nursery Management System database...")
    success = create_database()
    if success:
        print("🎉 Database setup complete!")
    else:
        print("❌ Database setup failed!")
        exit(1)