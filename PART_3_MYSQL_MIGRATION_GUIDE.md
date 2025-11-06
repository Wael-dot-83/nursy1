# 🔄 PART 3: MySQL 8.0+ Migration Guide
## Nursery Management System - SQLite to MySQL Migration

**Migration Date:** 2025-01-15
**Source Database:** SQLite 3.x
**Target Database:** MySQL 8.0.30+
**Migration Type:** Full schema + data migration
**Downtime Required:** Yes (estimated 2-4 hours for production)
**Rollback Strategy:** Database snapshot + application rollback

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Prerequisites](#2-prerequisites)
3. [MySQL Schema DDL](#3-mysql-schema-ddl)
4. [Data Migration Scripts](#4-data-migration-scripts)
5. [Application Layer Changes](#5-application-layer-changes)
6. [Configuration Updates](#6-configuration-updates)
7. [Performance Tuning](#7-performance-tuning)
8. [Security Hardening](#8-security-hardening)
9. [Backup & Disaster Recovery](#9-backup--disaster-recovery)
10. [Testing & Validation](#10-testing--validation)
11. [Migration Execution Plan](#11-migration-execution-plan)
12. [Rollback Plan](#12-rollback-plan)
13. [Post-Migration Checklist](#13-post-migration-checklist)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Executive Summary

### 1.1 Why Migrate to MySQL?

| Factor | SQLite | MySQL 8.0+ | Improvement |
|--------|--------|------------|-------------|
| **Concurrent Users** | Limited (write locks) | Thousands (row-level locking) | ⬆️ 100x |
| **Database Size** | Max 281 TB (impractical) | Petabytes | ⬆️ Scale |
| **Replication** | Not supported | Master-slave, multi-master | ⬆️ High availability |
| **Backup (Hot)** | Not supported | Supported | ⬆️ Zero downtime |
| **Query Optimizer** | Basic | Advanced (query cache, optimizer hints) | ⬆️ Performance |
| **Full-Text Search** | Limited | Native FTS with ranking | ⬆️ Search quality |
| **Transactions** | ACID (single connection) | ACID (multi-connection) | ⬆️ Concurrency |
| **User Management** | File-level | Role-based access control | ⬆️ Security |

### 1.2 Migration Scope

**Tables to Migrate:** 12
**Estimated Data Volume:** < 1GB (initial), scalable to 100GB+
**Estimated Migration Time:** 30-60 minutes (data transfer) + 60-90 minutes (validation)
**Total Downtime:** 2-4 hours (includes testing and rollback buffer)

### 1.3 Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data loss during migration | Low | Critical | Full backup + dry run + validation |
| Character encoding issues | Medium | High | Force UTF8MB4 everywhere |
| Foreign key constraint violations | Low | High | Pre-migration data cleaning |
| Application compatibility issues | Medium | Medium | Thorough testing in staging |
| Performance degradation | Low | Medium | Index optimization + query tuning |
| Extended downtime | Medium | High | Detailed execution plan + rehearsal |

---

## 2. Prerequisites

### 2.1 MySQL Server Requirements

**Minimum Version:** MySQL 8.0.30 or higher
**Recommended Version:** MySQL 8.0.36 (latest stable as of 2025-01)

**Required MySQL Features:**
- InnoDB storage engine ✅
- JSON data type support ✅
- Full UTF8MB4 support ✅
- `validate_password` plugin (for security) ✅

**Installation:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server-8.0

# Verify version
mysql --version  # Should show 8.0.30+
```

### 2.2 Database User Setup

```sql
-- Create dedicated application user
CREATE USER 'nursery_app'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';

-- Create admin user for migrations
CREATE USER 'nursery_admin'@'localhost' IDENTIFIED BY 'STRONG_ADMIN_PASSWORD';

-- Grant privileges (do this AFTER creating database)
GRANT SELECT, INSERT, UPDATE, DELETE, EXECUTE ON nursery_db.* TO 'nursery_app'@'localhost';
GRANT ALL PRIVILEGES ON nursery_db.* TO 'nursery_admin'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;
```

### 2.3 Python Dependencies

Update `requirements.txt`:
```txt
# Replace sqlite driver with MySQL
# OLD: No specific driver needed for SQLite
# NEW: Add MySQL connector
pymysql==1.1.0           # Pure Python MySQL client
cryptography==42.0.0      # Required for pymysql with MySQL 8.0
```

Install:
```bash
cd nursery-system/backend
./venv/Scripts/pip install pymysql cryptography
```

### 2.4 Pre-Migration Checklist

- [ ] MySQL 8.0.30+ installed and running
- [ ] Database users created with proper privileges
- [ ] Full SQLite backup created
- [ ] Python dependencies installed
- [ ] Staging environment ready for testing
- [ ] Downtime maintenance window scheduled
- [ ] Stakeholders notified

---

## 3. MySQL Schema DDL

### 3.1 Database Creation

```sql
-- ============================================
-- Create Database with UTF8MB4
-- ============================================
CREATE DATABASE IF NOT EXISTS nursery_db
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE nursery_db;

-- Set session variables for migration
SET FOREIGN_KEY_CHECKS = 0;  -- Temporarily disable for table creation
SET UNIQUE_CHECKS = 0;
SET AUTOCOMMIT = 0;
```

### 3.2 Table DDL (All 12 Tables)

#### 3.2.1 Users Table

```sql
-- ============================================
-- Table: users
-- Description: System users (Admin, Manager, Supervisor, Parent)
-- ============================================
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Authentication
  username VARCHAR(50) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  email VARCHAR(150) DEFAULT NULL UNIQUE,

  -- Profile
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  role ENUM('admin', 'manager', 'supervisor', 'parent') NOT NULL,

  -- Temporary password for first login
  temp_password VARCHAR(255) DEFAULT NULL COMMENT 'Cleartext for one-time display',

  -- Assignment
  nursery_id INT UNSIGNED DEFAULT NULL COMMENT 'Assigned nursery (for managers/supervisors)',
  branch_id INT UNSIGNED DEFAULT NULL COMMENT 'Assigned branch (for supervisors)',

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login DATETIME DEFAULT NULL,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_users_role (role),
  INDEX idx_users_nursery (nursery_id),
  INDEX idx_users_branch (branch_id),
  INDEX idx_users_active (active),
  INDEX idx_users_email (email),

  -- Foreign Keys
  CONSTRAINT fk_users_nursery
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,

  CONSTRAINT fk_users_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='System users with role-based access';
```

#### 3.2.2 Nurseries Table

```sql
-- ============================================
-- Table: nurseries
-- Description: Main nursery organizations
-- ============================================
CREATE TABLE nurseries (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  license_number VARCHAR(50) DEFAULT NULL,

  -- Main Address (flat columns)
  main_street VARCHAR(200) DEFAULT NULL,
  main_city VARCHAR(100) DEFAULT NULL,
  main_governorate VARCHAR(100) DEFAULT NULL,
  main_postal_code VARCHAR(20) DEFAULT NULL,

  -- Age Range (in days and months)
  min_age_days INT DEFAULT NULL COMMENT 'Minimum age in days',
  max_age_months INT DEFAULT NULL COMMENT 'Maximum age in months',

  -- Capacity
  max_capacity INT DEFAULT NULL,

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_nurseries_name (name),
  INDEX idx_nurseries_active (active),
  INDEX idx_nurseries_city (main_city),
  INDEX idx_nurseries_governorate (main_governorate),

  -- Constraints
  CONSTRAINT chk_nurseries_capacity CHECK (max_capacity IS NULL OR max_capacity > 0),
  CONSTRAINT chk_nurseries_age_range CHECK (
    (min_age_days IS NULL OR min_age_days >= 0) AND
    (max_age_months IS NULL OR max_age_months > 0)
  )

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Nursery organizations';
```

#### 3.2.3 Branches Table

```sql
-- ============================================
-- Table: branches
-- Description: Nursery branch locations
-- ============================================
CREATE TABLE branches (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Parent Nursery
  nursery_id INT UNSIGNED NOT NULL,

  -- Basic Info
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) NOT NULL,

  -- Address (with address_ prefix)
  address_street VARCHAR(200) DEFAULT NULL,
  address_city VARCHAR(100) DEFAULT NULL,
  address_governorate VARCHAR(100) DEFAULT NULL,
  address_postal_code VARCHAR(20) DEFAULT NULL,

  -- Capacity
  max_capacity INT DEFAULT NULL,

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_branches_nursery (nursery_id),
  INDEX idx_branches_name (name),
  INDEX idx_branches_active (active),
  INDEX idx_branches_city (address_city),

  -- Foreign Keys
  CONSTRAINT fk_branches_nursery
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Constraints
  CONSTRAINT chk_branches_capacity CHECK (max_capacity IS NULL OR max_capacity > 0)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Branch locations within nurseries';
```

#### 3.2.4 Classrooms Table

```sql
-- ============================================
-- Table: classrooms
-- Description: Classrooms within branches
-- ============================================
CREATE TABLE classrooms (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Parent Branch
  branch_id INT UNSIGNED NOT NULL,

  -- Basic Info
  name VARCHAR(100) NOT NULL,

  -- Age Range
  min_age_days INT DEFAULT NULL COMMENT 'Minimum age in days',
  max_age_months INT DEFAULT NULL COMMENT 'Maximum age in months',

  -- Capacity
  max_capacity INT DEFAULT NULL,

  -- Status
  active BOOLEAN NOT NULL DEFAULT TRUE,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_classrooms_branch (branch_id),
  INDEX idx_classrooms_active (active),

  -- Foreign Keys
  CONSTRAINT fk_classrooms_branch
    FOREIGN KEY (branch_id) REFERENCES branches(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Constraints
  CONSTRAINT chk_classrooms_capacity CHECK (max_capacity IS NULL OR max_capacity > 0),
  CONSTRAINT chk_classrooms_age_range CHECK (
    (min_age_days IS NULL OR min_age_days >= 0) AND
    (max_age_months IS NULL OR max_age_months > 0)
  )

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Classrooms for organizing children by age group';
```

#### 3.2.5 Children Table

```sql
-- ============================================
-- Table: children
-- Description: Registered children
-- ============================================
CREATE TABLE children (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  parent_id INT UNSIGNED NOT NULL COMMENT 'Parent user',
  nursery_id INT UNSIGNED NOT NULL COMMENT 'Assigned nursery',
  classroom_id INT UNSIGNED DEFAULT NULL COMMENT 'Optional classroom assignment',

  -- Basic Info
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female') NOT NULL,

  -- Medical
  medical_notes TEXT DEFAULT NULL,
  allergies TEXT DEFAULT NULL,

  -- Status
  status ENUM('active', 'inactive', 'graduated') NOT NULL DEFAULT 'active',

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_children_parent (parent_id),
  INDEX idx_children_nursery (nursery_id),
  INDEX idx_children_classroom (classroom_id),
  INDEX idx_children_status (status),
  INDEX idx_children_dob (date_of_birth),
  INDEX idx_children_name (last_name, first_name),

  -- Foreign Keys
  CONSTRAINT fk_children_parent
    FOREIGN KEY (parent_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_children_nursery
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_children_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Registered children in the nursery system';
```

#### 3.2.6 Attendance Table

```sql
-- ============================================
-- Table: attendance
-- Description: Daily attendance records
-- ============================================
CREATE TABLE attendance (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  child_id INT UNSIGNED NOT NULL,

  -- Attendance Data
  date DATE NOT NULL,
  status ENUM('present', 'absent', 'late') NOT NULL DEFAULT 'present',
  check_in_time DATETIME DEFAULT NULL,
  check_out_time DATETIME DEFAULT NULL,
  notes TEXT DEFAULT NULL COMMENT 'Attendance notes',

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_attendance_child (child_id),
  INDEX idx_attendance_date (date),
  INDEX idx_attendance_child_date (child_id, date),
  INDEX idx_attendance_status (status),

  -- Foreign Keys
  CONSTRAINT fk_attendance_child
    FOREIGN KEY (child_id) REFERENCES children(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  -- Constraints
  UNIQUE KEY uk_attendance_child_date (child_id, date),
  CONSTRAINT chk_attendance_times CHECK (
    check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time
  )

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Daily attendance tracking for children';
```

#### 3.2.7 Daily Reports Table

```sql
-- ============================================
-- Table: daily_reports
-- Description: Daily activity reports for children
-- ============================================
CREATE TABLE daily_reports (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  child_id INT UNSIGNED NOT NULL,
  supervisor_id INT UNSIGNED NOT NULL COMMENT 'Supervisor who created report',

  -- Report Data
  date DATE NOT NULL,
  meals TEXT DEFAULT NULL COMMENT 'Meal information',
  nap_time VARCHAR(100) DEFAULT NULL COMMENT 'Nap duration/time',
  activities TEXT DEFAULT NULL COMMENT 'Daily activities',
  mood VARCHAR(50) DEFAULT NULL COMMENT 'Child mood/behavior',
  notes TEXT DEFAULT NULL COMMENT 'General notes',

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_daily_reports_child (child_id),
  INDEX idx_daily_reports_supervisor (supervisor_id),
  INDEX idx_daily_reports_date (date),
  INDEX idx_daily_reports_child_date (child_id, date),

  -- Foreign Keys
  CONSTRAINT fk_daily_reports_child
    FOREIGN KEY (child_id) REFERENCES children(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,

  CONSTRAINT fk_daily_reports_supervisor
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  -- Constraints
  UNIQUE KEY uk_daily_reports_child_date (child_id, date)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Daily activity and care reports';
```

#### 3.2.8 File Assets Table

```sql
-- ============================================
-- Table: file_assets
-- Description: Uploaded files (documents, photos)
-- ============================================
CREATE TABLE file_assets (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  uploaded_by INT UNSIGNED NOT NULL COMMENT 'User who uploaded',
  child_id INT UNSIGNED DEFAULT NULL COMMENT 'Related child (optional)',

  -- File Info
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  file_size INT UNSIGNED NOT NULL COMMENT 'Size in bytes',
  mime_type VARCHAR(100) NOT NULL,

  -- File Type
  file_type ENUM('document', 'photo', 'other') NOT NULL DEFAULT 'other',

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_file_assets_uploader (uploaded_by),
  INDEX idx_file_assets_child (child_id),
  INDEX idx_file_assets_type (file_type),
  INDEX idx_file_assets_created (created_at),

  -- Foreign Keys
  CONSTRAINT fk_file_assets_uploader
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  CONSTRAINT fk_file_assets_child
    FOREIGN KEY (child_id) REFERENCES children(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='File storage metadata';
```

#### 3.2.9 Refresh Tokens Table

```sql
-- ============================================
-- Table: refresh_tokens
-- Description: JWT refresh tokens for authentication
-- ============================================
CREATE TABLE refresh_tokens (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  user_id INT UNSIGNED NOT NULL,

  -- Token Data
  token VARCHAR(512) NOT NULL UNIQUE COMMENT 'Hashed refresh token',
  expires_at DATETIME NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_refresh_tokens_user (user_id),
  INDEX idx_refresh_tokens_expires (expires_at),
  INDEX idx_refresh_tokens_token (token),
  INDEX idx_refresh_tokens_revoked (revoked),

  -- Foreign Keys
  CONSTRAINT fk_refresh_tokens_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='JWT refresh tokens for secure authentication';
```

#### 3.2.10 Notifications Table

```sql
-- ============================================
-- Table: notifications
-- Description: User notifications
-- ============================================
CREATE TABLE notifications (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  user_id INT UNSIGNED NOT NULL COMMENT 'Recipient user',

  -- Notification Data
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  notification_type ENUM('info', 'warning', 'success', 'error') NOT NULL DEFAULT 'info',

  -- Status
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  read_at DATETIME DEFAULT NULL,

  -- Timestamps
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_notifications_user (user_id),
  INDEX idx_notifications_read (is_read),
  INDEX idx_notifications_type (notification_type),
  INDEX idx_notifications_created (created_at),
  INDEX idx_notifications_user_read (user_id, is_read),

  -- Foreign Keys
  CONSTRAINT fk_notifications_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='User notifications and alerts';
```

#### 3.2.11 Audit Logs Table

```sql
-- ============================================
-- Table: audit_logs
-- Description: System audit trail
-- ============================================
CREATE TABLE audit_logs (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Relationships
  user_id INT UNSIGNED DEFAULT NULL COMMENT 'User who performed action',

  -- Action Data
  action VARCHAR(100) NOT NULL COMMENT 'Action performed (e.g., user.create, child.update)',
  resource_type VARCHAR(50) DEFAULT NULL COMMENT 'Resource type (e.g., user, child, nursery)',
  resource_id INT UNSIGNED DEFAULT NULL COMMENT 'Resource ID',

  -- Details
  details JSON DEFAULT NULL COMMENT 'Additional context (changed fields, old/new values)',

  -- Request Metadata
  ip_address VARCHAR(45) DEFAULT NULL COMMENT 'IPv4 or IPv6',
  user_agent TEXT DEFAULT NULL,

  -- Timestamp
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_audit_logs_user (user_id),
  INDEX idx_audit_logs_action (action),
  INDEX idx_audit_logs_resource (resource_type, resource_id),
  INDEX idx_audit_logs_created (created_at),
  INDEX idx_audit_logs_ip (ip_address),

  -- Foreign Keys
  CONSTRAINT fk_audit_logs_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Complete audit trail of system actions';
```

#### 3.2.12 Login Attempts Table

```sql
-- ============================================
-- Table: login_attempts
-- Description: Failed login tracking for security
-- ============================================
CREATE TABLE login_attempts (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,

  -- Attempt Data
  email VARCHAR(150) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  success BOOLEAN NOT NULL DEFAULT FALSE,

  -- Timestamps
  attempted_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_login_attempts_email (email),
  INDEX idx_login_attempts_ip (ip_address),
  INDEX idx_login_attempts_attempted_at (attempted_at),
  INDEX idx_login_attempts_email_ip (email, ip_address, attempted_at)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='Login attempt tracking for brute-force protection';
```

### 3.3 Re-enable Constraints

```sql
-- ============================================
-- Re-enable Foreign Key and Unique Checks
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;
SET UNIQUE_CHECKS = 1;
COMMIT;
```

---

## 4. Data Migration Scripts

### 4.1 Python Migration Script

Create `nursery-system/backend/migrate_sqlite_to_mysql.py`:

```python
#!/usr/bin/env python3
"""
SQLite to MySQL Migration Script
Migrates all data from SQLite to MySQL while preserving relationships
"""

import os
import sys
from datetime import datetime
from sqlalchemy import create_engine, MetaData, Table
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment
load_dotenv()

# Database URLs
SQLITE_URL = "sqlite:///./nursery.db"
MYSQL_URL = os.getenv("DATABASE_URL")  # Will be set in .env

if not MYSQL_URL:
    print("ERROR: DATABASE_URL not set in .env file")
    sys.exit(1)

print(f"Migration started at {datetime.now()}")
print(f"Source: {SQLITE_URL}")
print(f"Target: {MYSQL_URL.split('@')[1] if '@' in MYSQL_URL else 'MySQL'}")  # Hide credentials

# Create engines
sqlite_engine = create_engine(SQLITE_URL, echo=False)
mysql_engine = create_engine(MYSQL_URL, echo=False)

# Create sessions
SQLiteSession = sessionmaker(bind=sqlite_engine)
MySQLSession = sessionmaker(bind=mysql_engine)

sqlite_session = SQLiteSession()
mysql_session = MySQLSession()

# Reflect metadata
sqlite_metadata = MetaData()
sqlite_metadata.reflect(bind=sqlite_engine)

# Migration order (respecting foreign keys)
TABLE_ORDER = [
    'nurseries',      # No dependencies
    'branches',       # Depends on nurseries
    'classrooms',     # Depends on branches
    'users',          # Depends on nurseries, branches
    'children',       # Depends on users, nurseries, classrooms
    'attendance',     # Depends on children
    'daily_reports',  # Depends on children, users
    'file_assets',    # Depends on users, children
    'refresh_tokens', # Depends on users
    'notifications',  # Depends on users
    'audit_logs',     # Depends on users
    'login_attempts', # No dependencies
]

def migrate_table(table_name):
    """Migrate a single table from SQLite to MySQL"""
    print(f"\n📋 Migrating table: {table_name}")

    # Get SQLite table
    sqlite_table = Table(table_name, sqlite_metadata, autoload_with=sqlite_engine)

    # Get MySQL table
    mysql_metadata = MetaData()
    mysql_table = Table(table_name, mysql_metadata, autoload_with=mysql_engine)

    # Fetch all rows from SQLite
    sqlite_rows = sqlite_session.execute(sqlite_table.select()).fetchall()
    total_rows = len(sqlite_rows)

    if total_rows == 0:
        print(f"   ⚠️  No data to migrate")
        return 0

    print(f"   Found {total_rows} rows")

    # Prepare data for MySQL
    migrated_count = 0
    batch_size = 100

    for i in range(0, total_rows, batch_size):
        batch = sqlite_rows[i:i+batch_size]
        data_to_insert = []

        for row in batch:
            row_dict = dict(row._mapping)

            # Handle SQLite boolean (0/1) to MySQL BOOLEAN
            for column in mysql_table.columns:
                if column.name in row_dict:
                    if column.type.python_type == bool and isinstance(row_dict[column.name], int):
                        row_dict[column.name] = bool(row_dict[column.name])

            data_to_insert.append(row_dict)

        # Insert batch
        mysql_session.execute(mysql_table.insert(), data_to_insert)
        mysql_session.commit()

        migrated_count += len(batch)
        print(f"   ✅ Migrated {migrated_count}/{total_rows} rows", end='\r')

    print(f"   ✅ Migrated {migrated_count}/{total_rows} rows - COMPLETE")
    return migrated_count

def verify_migration():
    """Verify row counts match between SQLite and MySQL"""
    print("\n\n🔍 Verifying migration...")

    all_match = True

    for table_name in TABLE_ORDER:
        sqlite_table = Table(table_name, sqlite_metadata, autoload_with=sqlite_engine)
        mysql_metadata = MetaData()
        mysql_table = Table(table_name, mysql_metadata, autoload_with=mysql_engine)

        sqlite_count = sqlite_session.execute(sqlite_table.select()).rowcount
        mysql_count = mysql_session.execute(mysql_table.select()).rowcount

        status = "✅" if sqlite_count == mysql_count else "❌"
        print(f"{status} {table_name}: SQLite={sqlite_count}, MySQL={mysql_count}")

        if sqlite_count != mysql_count:
            all_match = False

    return all_match

def main():
    """Main migration execution"""
    try:
        print("\n" + "="*60)
        print("🚀 Starting Migration")
        print("="*60)

        # Migrate tables in order
        total_migrated = 0
        for table_name in TABLE_ORDER:
            try:
                count = migrate_table(table_name)
                total_migrated += count
            except Exception as e:
                print(f"\n❌ ERROR migrating {table_name}: {e}")
                raise

        # Verify
        if verify_migration():
            print("\n" + "="*60)
            print("✅ Migration SUCCESSFUL")
            print(f"   Total rows migrated: {total_migrated}")
            print(f"   Completed at: {datetime.now()}")
            print("="*60)
            return 0
        else:
            print("\n❌ Migration verification FAILED - row counts don't match")
            return 1

    except Exception as e:
        print(f"\n❌ Migration FAILED: {e}")
        mysql_session.rollback()
        return 1
    finally:
        sqlite_session.close()
        mysql_session.close()

if __name__ == "__main__":
    sys.exit(main())
```

### 4.2 Pre-Migration Data Cleaning

Create `nursery-system/backend/pre_migration_cleanup.py`:

```python
#!/usr/bin/env python3
"""
Pre-migration data cleaning script
Fixes data integrity issues before migrating to MySQL
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import User, Child, Attendance, Base

SQLITE_URL = "sqlite:///./nursery.db"
engine = create_engine(SQLITE_URL)
Session = sessionmaker(bind=engine)
session = Session()

def cleanup_orphaned_children():
    """Remove children with invalid parent_id or nursery_id"""
    orphaned = session.query(Child).filter(
        (Child.parent_id == None) | (Child.nursery_id == None)
    ).all()

    if orphaned:
        print(f"⚠️  Found {len(orphaned)} orphaned children - removing")
        for child in orphaned:
            session.delete(child)
        session.commit()
    else:
        print("✅ No orphaned children found")

def cleanup_duplicate_attendance():
    """Remove duplicate attendance records (same child + date)"""
    from sqlalchemy import func

    duplicates = session.query(
        Attendance.child_id,
        Attendance.date,
        func.count(Attendance.id).label('count')
    ).group_by(
        Attendance.child_id,
        Attendance.date
    ).having(
        func.count(Attendance.id) > 1
    ).all()

    if duplicates:
        print(f"⚠️  Found {len(duplicates)} duplicate attendance records")
        for child_id, date, count in duplicates:
            # Keep first, delete rest
            records = session.query(Attendance).filter_by(
                child_id=child_id, date=date
            ).order_by(Attendance.id).all()

            for record in records[1:]:
                session.delete(record)

        session.commit()
        print("✅ Duplicates removed")
    else:
        print("✅ No duplicate attendance records")

def main():
    print("🧹 Running pre-migration cleanup...")
    cleanup_orphaned_children()
    cleanup_duplicate_attendance()
    print("✅ Cleanup complete")

if __name__ == "__main__":
    main()
```

---

## 5. Application Layer Changes

### 5.1 Update Database URL Configuration

**File:** `nursery-system/backend/.env`

```env
# OLD (SQLite)
# DATABASE_URL=sqlite:///./nursery.db

# NEW (MySQL)
DATABASE_URL=mysql+pymysql://nursery_app:YOUR_PASSWORD@localhost:3306/nursery_db?charset=utf8mb4

# MySQL-specific settings
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=nursery_app
MYSQL_PASSWORD=YOUR_STRONG_PASSWORD
MYSQL_DATABASE=nursery_db
```

### 5.2 Update SQLAlchemy Engine Configuration

**File:** `nursery-system/backend/app/database.py`

```python
from sqlalchemy import create_engine, pool
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.getenv("DATABASE_URL")

# MySQL-specific engine configuration
engine = create_engine(
    DATABASE_URL,

    # Connection pooling (important for MySQL)
    poolclass=pool.QueuePool,
    pool_size=10,                    # Number of persistent connections
    max_overflow=20,                 # Additional connections when pool full
    pool_pre_ping=True,              # Verify connections before using
    pool_recycle=3600,               # Recycle connections after 1 hour

    # MySQL-specific settings
    connect_args={
        "charset": "utf8mb4",
        "connect_timeout": 10,       # Connection timeout in seconds
        "read_timeout": 30,          # Query read timeout
        "write_timeout": 30,         # Query write timeout
    },

    # Logging (disable in production)
    echo=False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """Dependency for FastAPI routes"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

### 5.3 Update Model Definitions (Minor Changes)

**File:** `nursery-system/backend/app/models.py`

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Text, JSON, Enum
from sqlalchemy import ForeignKey, Index, CheckConstraint, UniqueConstraint
from sqlalchemy.dialects.mysql import INTEGER as MySQL_INTEGER
from app.database import Base
import enum as python_enum

# Change Integer to MySQL_INTEGER(unsigned=True) for primary keys
class User(Base):
    __tablename__ = "users"

    # Use UNSIGNED INT for MySQL
    id = Column(MySQL_INTEGER(unsigned=True), primary_key=True, autoincrement=True)

    # ... rest of columns remain the same
```

**Note:** This change is optional. SQLAlchemy will handle INT vs INT UNSIGNED automatically, but explicit declaration ensures consistency.

### 5.4 Update Alembic Migrations (If Using)

**File:** `nursery-system/backend/alembic.ini`

```ini
# Update database URL
sqlalchemy.url = mysql+pymysql://nursery_app:YOUR_PASSWORD@localhost:3306/nursery_db?charset=utf8mb4
```

---

## 6. Configuration Updates

### 6.1 MySQL Server Configuration

**File:** `/etc/mysql/mysql.conf.d/mysqld.cnf` (Linux) or `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini` (Windows)

```ini
[mysqld]
# Character set and collation
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# InnoDB settings for performance
innodb_buffer_pool_size=1G           # 50-70% of available RAM
innodb_log_file_size=256M
innodb_flush_log_at_trx_commit=2     # Better performance, slight risk on crash
innodb_flush_method=O_DIRECT

# Query cache (disabled in MySQL 8.0, but keep for reference)
# query_cache_type=0
# query_cache_size=0

# Connection settings
max_connections=200
wait_timeout=600
interactive_timeout=600

# Binary logging (for backups and replication)
log_bin=/var/log/mysql/mysql-bin.log
binlog_expire_logs_seconds=604800    # 7 days
binlog_format=ROW

# Slow query log (for optimization)
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow-query.log
long_query_time=2                    # Log queries taking > 2 seconds

# Security
local_infile=0                       # Disable LOAD DATA LOCAL INFILE
```

**Apply changes:**
```bash
sudo systemctl restart mysql
```

### 6.2 Environment Variable Template

**File:** `nursery-system/backend/.env.example`

```env
# ============================================
# Database Configuration
# ============================================

# MySQL Connection (Production)
DATABASE_URL=mysql+pymysql://nursery_app:CHANGE_THIS_PASSWORD@localhost:3306/nursery_db?charset=utf8mb4

# MySQL Connection Details (for backup scripts)
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=nursery_app
MYSQL_PASSWORD=CHANGE_THIS_PASSWORD
MYSQL_DATABASE=nursery_db

# ============================================
# Application Settings
# ============================================
SECRET_KEY=your-secret-key-here-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# ============================================
# CORS Settings
# ============================================
CORS_ORIGINS=http://localhost:5174,http://localhost:3000

# ============================================
# File Upload
# ============================================
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10
```

---

## 7. Performance Tuning

### 7.1 Query Optimization

**Add Composite Indexes for Common Queries:**

```sql
-- Users filtered by role and nursery
CREATE INDEX idx_users_role_nursery ON users(role, nursery_id);

-- Children by status and nursery
CREATE INDEX idx_children_status_nursery ON children(status, nursery_id);

-- Attendance by date range
CREATE INDEX idx_attendance_date_status ON attendance(date, status);

-- Audit logs by date and action
CREATE INDEX idx_audit_logs_created_action ON audit_logs(created_at DESC, action);

-- Notifications unread by user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
```

### 7.2 Application-Level Optimizations

**File:** `nursery-system/backend/app/query_optimizer.py` (existing file)

Add MySQL-specific hints:

```python
from sqlalchemy import text

def get_users_with_hint(db, role=None):
    """Example of using MySQL query hints for optimization"""
    query = db.query(User)

    if role:
        # Force index usage for role queries
        query = query.filter(User.role == role).with_hint(
            User, 'USE INDEX (idx_users_role)', 'mysql'
        )

    return query.all()
```

### 7.3 Connection Pooling Best Practices

```python
# Adjust pool size based on expected concurrent users
# Formula: pool_size = (concurrent_requests * avg_connections_per_request) + buffer

# For ~100 concurrent users:
pool_size=20
max_overflow=40

# For ~500 concurrent users:
pool_size=50
max_overflow=100

# For ~1000+ concurrent users:
pool_size=100
max_overflow=200
```

---

## 8. Security Hardening

### 8.1 MySQL User Privileges (Principle of Least Privilege)

```sql
-- Application user (limited privileges)
REVOKE ALL PRIVILEGES ON nursery_db.* FROM 'nursery_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON nursery_db.* TO 'nursery_app'@'localhost';
FLUSH PRIVILEGES;

-- Admin user (full privileges for migrations only)
GRANT ALL PRIVILEGES ON nursery_db.* TO 'nursery_admin'@'localhost';
FLUSH PRIVILEGES;

-- Read-only user (for reporting/analytics)
CREATE USER 'nursery_readonly'@'localhost' IDENTIFIED BY 'READONLY_PASSWORD';
GRANT SELECT ON nursery_db.* TO 'nursery_readonly'@'localhost';
FLUSH PRIVILEGES;
```

### 8.2 Enable SSL/TLS for Database Connections

**Generate SSL certificates:**
```bash
# On MySQL server
sudo mysql_ssl_rsa_setup --uid=mysql
```

**Update connection string:**
```env
DATABASE_URL=mysql+pymysql://nursery_app:PASSWORD@localhost:3306/nursery_db?charset=utf8mb4&ssl_ca=/etc/mysql/ca.pem&ssl_cert=/etc/mysql/client-cert.pem&ssl_key=/etc/mysql/client-key.pem
```

### 8.3 Audit Logging Enhancement

```sql
-- Enable MySQL general query log (for auditing)
SET GLOBAL general_log = 'ON';
SET GLOBAL general_log_file = '/var/log/mysql/general-query.log';

-- Log only specific users
-- (Better: use application-level audit_logs table, already implemented)
```

---

## 9. Backup & Disaster Recovery

### 9.1 Automated Backup Script

**File:** `nursery-system/backend/scripts/backup_mysql.sh`

```bash
#!/bin/bash
# MySQL Database Backup Script
# Usage: ./backup_mysql.sh

# Configuration
BACKUP_DIR="/var/backups/nursery_db"
DATE=$(date +"%Y%m%d_%H%M%S")
MYSQL_USER="nursery_admin"
MYSQL_PASSWORD="YOUR_ADMIN_PASSWORD"
MYSQL_DATABASE="nursery_db"
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup filename
BACKUP_FILE="$BACKUP_DIR/nursery_db_backup_$DATE.sql.gz"

# Perform backup with compression
mysqldump -u $MYSQL_USER -p$MYSQL_PASSWORD \
  --single-transaction \
  --routines \
  --triggers \
  --events \
  --hex-blob \
  $MYSQL_DATABASE | gzip > $BACKUP_FILE

# Verify backup
if [ $? -eq 0 ]; then
  echo "✅ Backup successful: $BACKUP_FILE"

  # Remove old backups
  find $BACKUP_DIR -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete
  echo "🧹 Cleaned up backups older than $RETENTION_DAYS days"
else
  echo "❌ Backup FAILED"
  exit 1
fi
```

**Schedule with cron:**
```bash
# Daily backup at 2 AM
0 2 * * * /path/to/backup_mysql.sh >> /var/log/mysql_backup.log 2>&1
```

### 9.2 Point-in-Time Recovery Setup

```bash
# Enable binary logging (already in mysql.conf.d/mysqld.cnf)
log_bin=/var/log/mysql/mysql-bin.log
binlog_expire_logs_seconds=604800  # 7 days

# To restore to a specific point in time:
# 1. Restore latest full backup
gunzip < nursery_db_backup_20250115_020000.sql.gz | mysql -u nursery_admin -p nursery_db

# 2. Apply binary logs up to specific timestamp
mysqlbinlog --stop-datetime="2025-01-15 14:30:00" /var/log/mysql/mysql-bin.* | mysql -u nursery_admin -p nursery_db
```

### 9.3 Disaster Recovery Checklist

- [ ] Daily automated backups configured
- [ ] Backups stored in separate location (off-server)
- [ ] Backup restoration tested monthly
- [ ] Binary logging enabled for point-in-time recovery
- [ ] Database replication configured (optional, for high availability)
- [ ] Recovery Time Objective (RTO) defined: < 2 hours
- [ ] Recovery Point Objective (RPO) defined: < 24 hours

---

## 10. Testing & Validation

### 10.1 Pre-Migration Testing (Staging Environment)

**Checklist:**

1. **Schema Validation**
   ```bash
   # Run migration on staging database
   python migrate_sqlite_to_mysql.py

   # Verify all tables exist
   mysql -u nursery_admin -p -e "SHOW TABLES FROM nursery_db;"

   # Verify foreign keys
   mysql -u nursery_admin -p -e "SELECT * FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA='nursery_db' AND CONSTRAINT_TYPE='FOREIGN KEY';"
   ```

2. **Data Integrity**
   ```bash
   # Compare row counts
   python verify_migration.py

   # Spot-check critical data
   mysql -u nursery_admin -p nursery_db -e "SELECT COUNT(*) FROM users WHERE role='admin';"
   ```

3. **Application Testing**
   ```bash
   # Update .env to use staging MySQL
   cd nursery-system/backend

   # Run application
   ./venv/Scripts/python run.py

   # Run automated tests
   pytest tests/
   ```

4. **Performance Testing**
   ```bash
   # Run load tests
   locust -f tests/load_test.py --host=http://localhost:8002
   ```

### 10.2 Post-Migration Validation

**Run this SQL script to validate migration:**

```sql
-- ============================================
-- Post-Migration Validation Script
-- ============================================

USE nursery_db;

-- 1. Verify table structure
SELECT
  TABLE_NAME,
  ENGINE,
  TABLE_COLLATION,
  AUTO_INCREMENT,
  TABLE_ROWS
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = 'nursery_db'
ORDER BY TABLE_NAME;

-- 2. Verify foreign keys
SELECT
  CONSTRAINT_NAME,
  TABLE_NAME,
  COLUMN_NAME,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = 'nursery_db'
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, CONSTRAINT_NAME;

-- 3. Verify indexes
SELECT
  TABLE_NAME,
  INDEX_NAME,
  GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS COLUMNS
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = 'nursery_db'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- 4. Check for orphaned records
SELECT 'Orphaned Children' AS issue, COUNT(*) AS count
FROM children c
LEFT JOIN users u ON c.parent_id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 'Orphaned Attendance', COUNT(*)
FROM attendance a
LEFT JOIN children c ON a.child_id = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 'Orphaned Daily Reports', COUNT(*)
FROM daily_reports dr
LEFT JOIN children c ON dr.child_id = c.id
WHERE c.id IS NULL;

-- 5. Verify data types
DESCRIBE users;
DESCRIBE nurseries;
DESCRIBE children;
DESCRIBE attendance;
```

Expected output:
- All tables should be `InnoDB` engine
- All tables should be `utf8mb4_unicode_ci` collation
- No orphaned records (count = 0)
- All foreign keys present

---

## 11. Migration Execution Plan

### 11.1 Pre-Migration (1 Week Before)

**Timeline: Day -7 to Day -1**

- [ ] **Day -7:** Announce maintenance window to all users
- [ ] **Day -6:** Set up staging MySQL server
- [ ] **Day -5:** Run full migration on staging + validation
- [ ] **Day -4:** Performance testing on staging
- [ ] **Day -3:** Application testing on staging
- [ ] **Day -2:** Fix any issues found in staging
- [ ] **Day -1:** Final staging test + migration rehearsal
- [ ] **Day -1:** Create full SQLite backup
- [ ] **Day -1:** Prepare rollback scripts

### 11.2 Migration Day (Estimated 2-4 Hours)

**Timeline: Hour by Hour**

**Hour 0:00 - Preparation**
```bash
# 1. Display maintenance message on frontend
# 2. Stop accepting new requests (enable maintenance mode)
# 3. Wait for active requests to complete (2-5 minutes)
# 4. Stop backend service
systemctl stop nursery-backend
```

**Hour 0:10 - Backup**
```bash
# 5. Create final SQLite backup
cp nursery.db nursery.db.backup.$(date +%Y%m%d_%H%M%S)

# 6. Export SQLite to SQL dump (safety backup)
sqlite3 nursery.db .dump > nursery_sqlite_dump.sql
```

**Hour 0:20 - MySQL Setup**
```bash
# 7. Create MySQL database and users
mysql -u root -p < create_database.sql

# 8. Run DDL to create schema
mysql -u root -p nursery_db < mysql_schema.sql

# 9. Verify schema
mysql -u root -p nursery_db -e "SHOW TABLES;"
```

**Hour 0:30 - Data Migration**
```bash
# 10. Run pre-migration cleanup
python pre_migration_cleanup.py

# 11. Execute migration script
python migrate_sqlite_to_mysql.py

# Expected output:
# ✅ Migration SUCCESSFUL
# Total rows migrated: XXXX
```

**Hour 1:00 - Validation**
```bash
# 12. Run post-migration validation
mysql -u root -p nursery_db < post_migration_validation.sql

# 13. Verify row counts
python verify_migration.py

# 14. Spot-check critical data
mysql -u root -p nursery_db -e "SELECT * FROM users WHERE role='admin';"
```

**Hour 1:30 - Application Update**
```bash
# 15. Update .env with MySQL connection
cp .env.mysql .env

# 16. Update SQLAlchemy configuration
# (Already done in preparation)

# 17. Test database connection
python -c "from app.database import engine; engine.connect()"
```

**Hour 2:00 - Application Testing**
```bash
# 18. Start backend in test mode
./venv/Scripts/python run.py

# 19. Run smoke tests
pytest tests/test_critical.py

# 20. Test critical workflows:
#     - Admin login
#     - User creation
#     - Nursery creation
#     - Child registration
#     - Attendance recording
```

**Hour 2:30 - Go Live**
```bash
# 21. Start production backend
systemctl start nursery-backend

# 22. Monitor logs
tail -f /var/log/nursery/app.log

# 23. Disable maintenance mode

# 24. Notify users that system is back online
```

**Hour 3:00 - Post-Launch Monitoring**
```bash
# 25. Monitor for errors (1 hour)
# 26. Check database performance
mysql -u root -p -e "SHOW PROCESSLIST;"

# 27. Verify backups are running
./scripts/backup_mysql.sh
```

### 11.3 Migration Success Criteria

**Migration is successful if:**
- ✅ All tables created with correct schema
- ✅ All data migrated (row counts match)
- ✅ No foreign key constraint violations
- ✅ No orphaned records
- ✅ Application starts without errors
- ✅ Critical workflows function correctly
- ✅ No performance degradation
- ✅ Automated backups working

---

## 12. Rollback Plan

### 12.1 When to Rollback

**Rollback if:**
- Data integrity issues discovered (orphaned records, missing data)
- Application errors after 30 minutes of troubleshooting
- Performance degradation > 50%
- Critical workflows broken
- Stakeholder decision

### 12.2 Rollback Procedure (30 Minutes)

```bash
# STEP 1: Stop MySQL-connected backend
systemctl stop nursery-backend

# STEP 2: Restore SQLite .env configuration
cp .env.sqlite .env

# STEP 3: Verify SQLite database intact
sqlite3 nursery.db "SELECT COUNT(*) FROM users;"

# STEP 4: Start backend with SQLite
./venv/Scripts/python run.py

# STEP 5: Verify application works
curl http://localhost:8002/health

# STEP 6: Notify users
# STEP 7: Schedule new migration date
```

### 12.3 Post-Rollback Analysis

- Document what went wrong
- Review logs for root cause
- Fix issues in staging
- Rehearse migration again
- Set new migration date

---

## 13. Post-Migration Checklist

### 13.1 Immediate (Day 1)

- [ ] Verify all critical workflows functional
- [ ] Monitor error logs for database-related issues
- [ ] Check query performance (slow query log)
- [ ] Verify automated backups running
- [ ] Update documentation with new connection strings
- [ ] Notify users migration complete

### 13.2 Short-term (Week 1)

- [ ] Monitor database growth rate
- [ ] Optimize slow queries identified in logs
- [ ] Set up database monitoring (e.g., Prometheus + Grafana)
- [ ] Configure database replication (if needed)
- [ ] Test backup restoration procedure
- [ ] Update disaster recovery plan

### 13.3 Long-term (Month 1)

- [ ] Review and optimize indexes based on actual usage
- [ ] Fine-tune MySQL configuration (buffer pool, cache sizes)
- [ ] Set up automated performance reports
- [ ] Plan for scaling (read replicas, sharding if needed)
- [ ] Archive old SQLite database (if migration stable)

---

## 14. Troubleshooting

### 14.1 Common Migration Issues

| Issue | Symptom | Solution |
|-------|---------|----------|
| **Character Encoding** | Arabic text shows as `???` | Ensure `charset=utf8mb4` in connection string AND `COLLATE utf8mb4_unicode_ci` in tables |
| **Foreign Key Violations** | Migration fails with FK error | Run `pre_migration_cleanup.py` to remove orphaned records |
| **Connection Timeout** | `Lost connection to MySQL server` | Increase `wait_timeout` and `interactive_timeout` in MySQL config |
| **Slow Queries** | Pages loading slowly | Check slow query log, add missing indexes |
| **Auto-increment Reset** | IDs start from 1 after migration | Manually set `AUTO_INCREMENT` to max ID + 1 |
| **Boolean Conversion** | Booleans showing as 0/1 | Migration script should handle this automatically |

### 14.2 Performance Troubleshooting

**Identify slow queries:**
```sql
-- Check slow query log
SELECT * FROM mysql.slow_log ORDER BY query_time DESC LIMIT 10;

-- Analyze query execution plan
EXPLAIN SELECT * FROM children WHERE parent_id = 123;

-- Check index usage
SHOW INDEX FROM children;
```

**Fix slow queries:**
```sql
-- Add missing index
CREATE INDEX idx_children_parent_status ON children(parent_id, status);

-- Update table statistics
ANALYZE TABLE children;

-- Optimize table
OPTIMIZE TABLE children;
```

### 14.3 Connection Pool Issues

**Symptom:** `QueuePool limit of size X overflow Y reached`

**Solution:**
```python
# Increase pool size in database.py
engine = create_engine(
    DATABASE_URL,
    pool_size=50,        # Increase from 10
    max_overflow=100,    # Increase from 20
)
```

### 14.4 Emergency Contacts

| Role | Name | Contact | Responsibility |
|------|------|---------|----------------|
| Database Admin | [Name] | [Email/Phone] | MySQL server management |
| Backend Lead | [Name] | [Email/Phone] | Application code changes |
| DevOps Engineer | [Name] | [Email/Phone] | Infrastructure, backups |
| Project Manager | [Name] | [Email/Phone] | Stakeholder communication |

---

## Summary

### Migration Checklist (Quick Reference)

**Pre-Migration:**
- [ ] MySQL 8.0.30+ installed
- [ ] Database and users created
- [ ] Full SQLite backup created
- [ ] Migration tested in staging
- [ ] Stakeholders notified

**Migration Day:**
- [ ] Maintenance mode enabled
- [ ] Backend stopped
- [ ] Final SQLite backup
- [ ] MySQL schema created
- [ ] Data migrated and verified
- [ ] Application updated (.env + config)
- [ ] Smoke tests passed
- [ ] Backend restarted
- [ ] Monitoring active

**Post-Migration:**
- [ ] Critical workflows verified
- [ ] Performance monitored
- [ ] Backups automated
- [ ] Documentation updated
- [ ] Users notified

---

**Estimated Total Effort:**
- Planning & Preparation: 8 hours
- Staging Testing: 16 hours
- Migration Execution: 4 hours
- Post-Migration Validation: 8 hours
- **Total:** 36 hours

**Recommended Team:**
- 1 Database Administrator
- 1 Backend Developer
- 1 DevOps Engineer
- 1 QA Tester

---

**Document Version:** 1.0
**Created:** 2025-01-15
**Status:** ✅ Ready for Review
**Next Update:** After staging migration test

---

## Appendix A: MySQL vs SQLite Feature Comparison

| Feature | SQLite | MySQL 8.0 | Migration Impact |
|---------|--------|-----------|------------------|
| **Concurrency** | File-level locking | Row-level locking | ⬆️ Massive improvement |
| **Max Database Size** | 281 TB (theoretical) | Petabytes | ⬆️ Future-proof |
| **Full-Text Search** | Basic FTS5 | Advanced with ranking | ⬆️ Better search |
| **Replication** | Not supported | Native support | ⬆️ High availability |
| **Stored Procedures** | Not supported | Supported | ➡️ Optional feature |
| **Triggers** | Supported | Supported | ✅ Compatible |
| **Views** | Supported | Supported | ✅ Compatible |
| **Transactions** | ACID | ACID | ✅ Compatible |
| **Foreign Keys** | Supported | Supported | ✅ Compatible |
| **JSON Data Type** | TEXT (JSON functions) | Native JSON | ⬆️ Better performance |
| **Backup (Hot)** | Not supported | Supported | ⬆️ Zero downtime backups |
| **User Management** | File permissions | RBAC | ⬆️ Better security |

## Appendix B: Complete Connection String Examples

```env
# Local Development
DATABASE_URL=mysql+pymysql://nursery_app:dev_password@localhost:3306/nursery_db?charset=utf8mb4

# Production (with SSL)
DATABASE_URL=mysql+pymysql://nursery_app:prod_password@db.example.com:3306/nursery_db?charset=utf8mb4&ssl_ca=/path/to/ca.pem

# Production (with connection pooling options)
DATABASE_URL=mysql+pymysql://nursery_app:prod_password@localhost:3306/nursery_db?charset=utf8mb4&pool_recycle=3600&pool_pre_ping=True

# Docker Compose
DATABASE_URL=mysql+pymysql://nursery_app:password@mysql:3306/nursery_db?charset=utf8mb4
```

---

**End of MySQL Migration Guide**
