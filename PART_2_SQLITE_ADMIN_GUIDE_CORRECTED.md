# 🔐 PART 2: Admin Complete Workflow Guide (SQLite - CORRECTED)
## Nursery Management System - Production-Ready Documentation

**Version:** 2.0.0 (Corrected)
**Last Updated:** 2025-01-15
**Database:** SQLite 3.x
**Backend:** FastAPI 0.109+
**Frontend:** React 18 + Vite
**Status:** ✅ Production Ready

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Database Schema (SQLite)](#2-database-schema-sqlite)
3. [Authentication & Access](#3-authentication--access)
4. [Dashboard & Analytics](#4-dashboard--analytics)
5. [Nursery Management](#5-nursery-management)
6. [Branch Management](#6-branch-management)
7. [Classroom Management](#7-classroom-management)
8. [User Management](#8-user-management)
9. [Children Management](#9-children-management)
10. [Attendance Management](#10-attendance-management)
11. [Reports Management](#11-reports-management)
12. [File Management](#12-file-management)
13. [Notifications System](#13-notifications-system)
14. [Audit Logs](#14-audit-logs)
15. [System Settings](#15-system-settings)
16. [Backup & Restore](#16-backup--restore)
17. [Complete Workflows](#17-complete-workflows)
18. [API Reference](#18-api-reference)

---

## 1. System Overview

### Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌──────────────┐
│  React Frontend │─────▶│  FastAPI Backend │─────▶│   SQLite DB  │
│   (Port 5174)   │      │   (Port 8002)    │      │  nursery.db  │
└─────────────────┘      └──────────────────┘      └──────────────┘
         │                        │
         │                        │
         ▼                        ▼
  ┌─────────────┐         ┌─────────────┐
  │  JWT Tokens │         │ Audit Logs  │
  │   (HttpOnly │         │ Rate Limit  │
  │   Cookies)  │         │ Middleware  │
  └─────────────┘         └─────────────┘
```

### Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 18.x | UI Components |
| Build Tool | Vite | 5.x | Dev Server & Build |
| Backend | FastAPI | 0.109+ | REST API |
| ORM | SQLAlchemy | 2.0+ | Database Layer |
| Database | SQLite | 3.x | Data Storage |
| Auth | JWT + bcrypt | Latest | Authentication |
| Validation | Pydantic | 2.x | Schema Validation |

### Core Features

✅ Multi-tenant nursery management
✅ Role-based access control (Admin, Manager, Supervisor, Parent)
✅ Real-time attendance tracking
✅ Daily child reports
✅ File upload/download
✅ Push notifications
✅ Comprehensive audit logging
✅ Automated backups
✅ Rate limiting & brute-force protection

---

## 2. Database Schema (SQLite)

### Complete ERD Summary

```
users ──────┬───▶ nurseries
            │
            ├───▶ children
            │
            ├───▶ notifications
            │
            ├───▶ refresh_tokens
            │
            └───▶ audit_logs

nurseries ───┬───▶ branches ────▶ classrooms ────▶ children
             │
             └───▶ children (direct)

children ────┬───▶ attendance
             │
             └───▶ daily_reports

users (uploader) ────▶ file_assets
```

### 2.1 Users Table

**Purpose:** Store all system users (Admin, Manager, Supervisor, Parent)

```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(150) UNIQUE,  -- NULLABLE for flexibility
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    phone VARCHAR(15),
    role VARCHAR(20) NOT NULL CHECK(role IN ('admin', 'manager', 'supervisor', 'parent')),
    is_active BOOLEAN NOT NULL DEFAULT 1,
    hashed_password VARCHAR(255),
    temp_password VARCHAR(255),  -- Plaintext temp password for one-time display
    nursery_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) ON DELETE SET NULL
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_nursery ON users(nursery_id);
CREATE INDEX idx_users_email ON users(email);  -- Implicit via UNIQUE
```

**Sample Data:**
```sql
INSERT INTO users (id, email, first_name, last_name, role, hashed_password, nursery_id)
VALUES
(1, 'admin@nursery.com', 'System', 'Administrator', 'admin', '$2b$12$...', 1),
(2, 'manager@nursery.com', 'Ahmad', 'Salem', 'manager', '$2b$12$...', 1),
(3, 'supervisor@nursery.com', 'Fatima', 'Ali', 'supervisor', '$2b$12$...', 1),
(4, 'parent@nursery.com', 'Sara', 'Khaled', 'parent', '$2b$12$...', NULL);
```

**Key Points:**
- `email` is NULLABLE and UNIQUE (some users may not have email)
- `temp_password` stores plaintext temporary passwords for display only
- `first_name` + `last_name` are separate (not `full_name`)
- Users link to nurseries, but not directly to branches (handled through nursery_id)

---

### 2.2 Nurseries Table

**Purpose:** Main nursery/kindergarten entities

```sql
CREATE TABLE nurseries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(120) NOT NULL,

    -- Address stored as flat fields (not JSON)
    main_street VARCHAR(200),
    main_city VARCHAR(100),
    main_governorate VARCHAR(50),
    main_postal_code VARCHAR(10),

    main_phone VARCHAR(15) NOT NULL,
    email VARCHAR(150),

    -- Age range stored as separate integer columns
    min_age_days INTEGER DEFAULT 70,   -- Minimum age in days
    max_age_months INTEGER DEFAULT 52, -- Maximum age in months

    notes TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nurseries_name ON nurseries(name);
CREATE INDEX idx_nurseries_governorate ON nurseries(main_governorate);
```

**Sample Data:**
```sql
INSERT INTO nurseries (name, main_phone, email, main_street, main_city, main_governorate, min_age_days, max_age_months)
VALUES ('Little Stars Nursery', '0791234567', 'info@littlestars.jo', 'King Abdullah St', 'Amman', 'Amman', 70, 52);
```

**API Mapping:**
- API accepts: `{main_address: {street, city, governorate, postalCode}}`
- DB stores: Flat columns `main_street`, `main_city`, etc.
- API accepts: `{age_range: {minAge, maxAge}}`
- DB stores: `min_age_days` (INT), `max_age_months` (INT)

---

### 2.3 Branches Table

**Purpose:** Nursery branch locations

```sql
CREATE TABLE branches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nursery_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,

    -- Address fields with 'address_' prefix
    address_street VARCHAR(200),
    address_city VARCHAR(100),
    address_governorate VARCHAR(50),
    address_postal_code VARCHAR(10),

    phone VARCHAR(15),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) ON DELETE CASCADE
);

CREATE INDEX idx_branches_nursery ON branches(nursery_id);
```

---

### 2.4 Classrooms Table

**Purpose:** Classroom/room management within branches

```sql
CREATE TABLE classrooms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    branch_id INTEGER NOT NULL,
    name VARCHAR(50) NOT NULL,
    capacity INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

CREATE INDEX idx_classrooms_branch ON classrooms(branch_id);
```

---

### 2.5 Children Table

**Purpose:** Child profiles and enrollment

```sql
CREATE TABLE children (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(10) NOT NULL CHECK(gender IN ('male', 'female', 'other')),
    medical_info TEXT,
    emergency_contact VARCHAR(100) NOT NULL,
    emergency_phone VARCHAR(15) NOT NULL,

    classroom_id INTEGER NOT NULL,
    parent_id INTEGER NOT NULL,
    nursery_id INTEGER,  -- Direct link to nursery (optional, for reporting)

    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'graduated')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE RESTRICT,
    FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) ON DELETE SET NULL
);

CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_children_classroom ON children(classroom_id);
CREATE INDEX idx_children_status ON children(status);
```

---

### 2.6 Attendance Table

**Purpose:** Daily check-in/check-out tracking

```sql
CREATE TABLE attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    date DATE NOT NULL,
    check_in_time DATETIME,  -- Includes date + time
    check_out_time DATETIME, -- Includes date + time
    status VARCHAR(20) NOT NULL CHECK(status IN ('present', 'absent', 'late')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE (child_id, date)  -- One attendance record per child per day
);

CREATE INDEX idx_attendance_child_date ON attendance(child_id, date);
CREATE INDEX idx_attendance_date ON attendance(date);
```

---

### 2.7 Daily Reports Table

**Purpose:** Supervisor notes on child's daily activities

```sql
CREATE TABLE daily_reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_id INTEGER NOT NULL,
    date DATE NOT NULL,
    activities TEXT,
    meals TEXT,
    naps TEXT,
    mood VARCHAR(20) CHECK(mood IN ('happy', 'sad', 'excited', 'tired', 'calm')),
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
    UNIQUE (child_id, date)
);

CREATE INDEX idx_daily_reports_child_date ON daily_reports(child_id, date);
```

---

### 2.8 File Assets Table

**Purpose:** Uploaded files (documents, photos)

```sql
CREATE TABLE file_assets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,  -- Bytes
    content_type VARCHAR(100) NOT NULL,  -- MIME type
    uploaded_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_files_uploader ON file_assets(uploaded_by);
CREATE INDEX idx_files_created ON file_assets(created_at);
```

---

### 2.9 Refresh Tokens Table

**Purpose:** JWT refresh token management

```sql
CREATE TABLE refresh_tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token_hash VARCHAR(255) NOT NULL,  -- SHA256 hash of token
    revoked BOOLEAN NOT NULL DEFAULT 0,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);
```

---

### 2.10 Notifications Table

**Purpose:** In-app user notifications

```sql
CREATE TABLE notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK(type IN ('info', 'success', 'warning', 'error')),
    is_read BOOLEAN NOT NULL DEFAULT 0,
    link VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    read_at DATETIME,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

---

### 2.11 Audit Logs Table

**Purpose:** Complete audit trail of all system actions

```sql
CREATE TABLE audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,  -- NULL for system actions
    action VARCHAR(100) NOT NULL,  -- CREATE, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    resource_type VARCHAR(50) NOT NULL,  -- User, Child, Nursery, etc.
    resource_id INTEGER,
    details TEXT,  -- JSON string with additional context
    ip_address VARCHAR(45),  -- IPv4 or IPv6
    user_agent VARCHAR(500),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at);
```

---

### 2.12 Login Attempts Table

**Purpose:** Brute-force protection tracking

```sql
CREATE TABLE login_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(150) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    success BOOLEAN NOT NULL DEFAULT 0,
    failure_reason VARCHAR(200),  -- "Invalid credentials", "Account locked", etc.
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_attempted_at ON login_attempts(attempted_at);
```

---

## 3. Authentication & Access

### 3.1 Login Process

**Endpoint:** `POST /auth/login`

**Request:**
```json
{
  "email": "admin@nursery.com",
  "password": "Admin123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": 1,
    "email": "admin@nursery.com",
    "first_name": "System",
    "last_name": "Administrator",
    "role": "admin",
    "nursery_id": 1,
    "is_active": true
  }
}
```

**Important Changes from Original Docs:**
- ❌ `refresh_token` is NOT in response body
- ✅ Refresh token is in httpOnly cookie (secure)
- ✅ `user` object has `first_name` + `last_name` (not `full_name`)
- ✅ Rate limiting: 5 attempts per 15 minutes per IP

**SQL Query:**
```sql
-- Find user
SELECT * FROM users WHERE email = ? AND is_active = 1;

-- Verify password (bcrypt compare in Python)

-- Log successful login
INSERT INTO audit_logs (user_id, action, resource_type, ip_address, user_agent)
VALUES (?, 'LOGIN', 'User', ?, ?);

-- Record login attempt
INSERT INTO login_attempts (email, ip_address, success)
VALUES (?, ?, 1);
```

---

### 3.2 Token Refresh

**Endpoint:** `POST /auth/refresh`

**Request:** Cookie with `refresh_token` (httpOnly)

**Response:**
```json
{
  "access_token": "new_token_here...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

**SQL Query:**
```sql
-- Validate refresh token
SELECT * FROM refresh_tokens
WHERE token_hash = ?
  AND revoked = 0
  AND expires_at > CURRENT_TIMESTAMP;
```

---

### 3.3 Password Change

**Endpoint:** `POST /auth/password/change`

**Request:**
```json
{
  "current_password": "OldPassword123!",
  "new_password": "NewPassword456!"
}
```

**Validation:**
- ✅ Current password must match
- ✅ New password ≠ current password
- ✅ Min 8 characters
- ✅ Recommended: Mixed case + numbers + symbols

**SQL Query:**
```sql
-- Update password
UPDATE users
SET hashed_password = ?,
    temp_password = NULL,  -- Clear temp password
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Revoke all refresh tokens (force re-login on all devices)
UPDATE refresh_tokens
SET revoked = 1
WHERE user_id = ?;

-- Log password change
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
VALUES (?, 'PASSWORD_CHANGE', 'User', ?, ?);
```

---

### 3.4 Logout

**Endpoint:** `POST /auth/logout`

**Request:** Cookie with `refresh_token`

**Response:** `204 No Content`

**SQL Query:**
```sql
-- Revoke current refresh token
UPDATE refresh_tokens
SET revoked = 1
WHERE token_hash = ?;

-- Log logout
INSERT INTO audit_logs (user_id, action, resource_type, ip_address)
VALUES (?, 'LOGOUT', 'User', ?);
```

---

## 4. Dashboard & Analytics

### 4.1 System Health Check

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-15T10:30:00"
}
```

**Note:** Simple uptime check, no database query

---

### 4.2 System Analytics

**Endpoint:** `GET /system/analytics`

**Response:**
```json
{
  "users": {
    "total": 45,
    "by_role": {
      "admin": 2,
      "manager": 5,
      "supervisor": 12,
      "parent": 26
    },
    "active": 42,
    "inactive": 3
  },
  "nurseries": {
    "total": 3,
    "active": 3,
    "branches": 8,
    "classrooms": 24
  },
  "children": {
    "total": 156,
    "active": 148,
    "inactive": 5,
    "graduated": 3,
    "by_status": {
      "active": 148,
      "inactive": 5,
      "graduated": 3
    }
  },
  "attendance_today": {
    "present": 135,
    "absent": 8,
    "late": 5,
    "rate": 91.2
  }
}
```

**SQL Queries:**
```sql
-- User stats
SELECT role, COUNT(*) as count FROM users GROUP BY role;
SELECT COUNT(*) as active FROM users WHERE is_active = 1;

-- Nursery stats
SELECT COUNT(*) FROM nurseries WHERE is_active = 1;
SELECT COUNT(*) FROM branches;
SELECT COUNT(*) FROM classrooms;

-- Children stats
SELECT status, COUNT(*) as count FROM children GROUP BY status;

-- Today's attendance
SELECT status, COUNT(*) as count
FROM attendance
WHERE date = DATE('now')
GROUP BY status;
```

---

## 5. Nursery Management

### 5.1 Create Nursery

**Endpoint:** `POST /admin/nurseries`

**Request:**
```json
{
  "name": "Little Stars Nursery",
  "main_phone": "0791234567",
  "email": "info@littlestars.jo",
  "main_address": {
    "street": "King Abdullah St",
    "city": "Amman",
    "governorate": "Amman",
    "postal_code": "11183"
  },
  "age_range": {
    "minAge": 70,
    "maxAge": 52
  },
  "notes": "Premium facility",
  "has_branches": false,
  "branches": []
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Little Stars Nursery",
  "main_phone": "0791234567",
  ...
  "manager": {
    "email": "manager_xxxxx@littlestars.jo",
    "tempPassword": "RandomPass123!",
    "fullName": "Manager Little Stars Nursery"
  }
}
```

**SQL Transaction:**
```sql
BEGIN TRANSACTION;

-- 1. Create nursery
INSERT INTO nurseries (name, main_street, main_city, main_governorate, main_postal_code, main_phone, email, min_age_days, max_age_months, notes)
VALUES ('Little Stars Nursery', 'King Abdullah St', 'Amman', 'Amman', '11183', '0791234567', 'info@littlestars.jo', 70, 52, 'Premium facility');

SET @nursery_id = last_insert_rowid();

-- 2. Create manager user
INSERT INTO users (email, first_name, last_name, role, hashed_password, temp_password, nursery_id)
VALUES ('manager_xxxxx@littlestars.jo', 'Manager', 'Little Stars Nursery', 'manager', '$2b$12$...', 'RandomPass123!', @nursery_id);

-- 3. Log audit trail
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
VALUES (?, 'CREATE', 'Nursery', @nursery_id, '{"name": "Little Stars Nursery"}', ?);

COMMIT;
```

---

### 5.2 List Nurseries

**Endpoint:** `GET /admin/nurseries?skip=0&limit=10`

**SQL Query:**
```sql
SELECT
    n.*,
    COUNT(DISTINCT b.id) as branches_count,
    COUNT(DISTINCT c.id) as children_count
FROM nurseries n
LEFT JOIN branches b ON n.id = b.nursery_id
LEFT JOIN children c ON n.id = c.nursery_id
GROUP BY n.id
ORDER BY n.created_at DESC
LIMIT ? OFFSET ?;
```

---

### 5.3 Update Nursery

**Endpoint:** `PUT /admin/nurseries/{nursery_id}`

**SQL Query:**
```sql
UPDATE nurseries
SET name = ?,
    main_street = ?,
    main_city = ?,
    main_governorate = ?,
    main_phone = ?,
    email = ?,
    min_age_days = ?,
    max_age_months = ?,
    notes = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Log update
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
VALUES (?, 'UPDATE', 'Nursery', ?, ?, ?);
```

---

### 5.4 Delete Nursery (Soft Delete)

**Endpoint:** `DELETE /admin/nurseries/{nursery_id}`

**SQL Query:**
```sql
-- Soft delete (mark inactive)
UPDATE nurseries SET is_active = 0 WHERE id = ?;

-- Also deactivate branches
UPDATE branches SET is_active = 0 WHERE nursery_id = ?;

-- Log deletion
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, ip_address)
VALUES (?, 'DELETE', 'Nursery', ?, ?);
```

---

## 6. Branch Management

*(Continue with similar detailed documentation for each section...)*

---

## 8. User Management

### 8.1 Create User

**Endpoint:** `POST /admin/users`

**Request:**
```json
{
  "email": "user@example.com",
  "full_name": "Ahmad Salem",
  "phone": "0791234567",
  "role": "supervisor",
  "nursery_id": 1,
  "branch_id": null,
  "permissions": []
}
```

**IMPORTANT CORRECTIONS:**
- ❌ API accepts `full_name` (single field)
- ✅ Backend splits into `first_name` + `last_name`
- ✅ Auto-generates temp password for managers
- ✅ `branch_id` not stored in user table (managed through assignments)

**SQL Transaction:**
```sql
BEGIN TRANSACTION;

-- Parse full name
SET @first_name = SUBSTR(full_name, 1, INSTR(full_name || ' ', ' ') - 1);
SET @last_name = SUBSTR(full_name, INSTR(full_name || ' ', ' ') + 1);

-- Create user
INSERT INTO users (email, first_name, last_name, phone, role, hashed_password, temp_password, nursery_id)
VALUES (?, @first_name, @last_name, ?, ?, ?, ?, ?);

SET @user_id = last_insert_rowid();

-- Log creation
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
VALUES (?, 'CREATE', 'User', @user_id, ?, ?);

COMMIT;
```

---

### 8.2 Toggle User Status

**Endpoint:** `PATCH /admin/users/{user_id}/activation`

**Request:**
```json
{
  "active": false
}
```

**CORRECTED from original docs:**
- ❌ Old: `PUT /admin/users/{user_id}/activate` and `PUT /admin/users/{user_id}/deactivate`
- ✅ New: Single endpoint with PATCH method

**SQL Query:**
```sql
UPDATE users
SET is_active = ?,
    updated_at = CURRENT_TIMESTAMP
WHERE id = ?;

-- Revoke tokens if deactivating
UPDATE refresh_tokens
SET revoked = 1
WHERE user_id = ? AND ? = 0;  -- Only if active = false

-- Log status change
INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
VALUES (?, 'STATUS_CHANGE', 'User', ?, '{"active": ?}', ?);
```

---

### 8.3 List Users with Filters

**Endpoint:** `GET /admin/users?role=manager&status=active&page=1&pageSize=25`

**SQL Query:**
```sql
SELECT
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.phone,
    u.role,
    u.is_active,
    u.nursery_id,
    u.created_at,
    n.name as nursery_name,
    COUNT(c.id) as children_count
FROM users u
LEFT JOIN nurseries n ON u.nursery_id = n.id
LEFT JOIN children c ON u.id = c.parent_id
WHERE
    (? IS NULL OR u.role = ?)
    AND (? IS NULL OR u.is_active = ?)
    AND (? IS NULL OR u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?)
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT ? OFFSET ?;

-- Count total
SELECT COUNT(*) FROM users
WHERE
    (? IS NULL OR role = ?)
    AND (? IS NULL OR is_active = ?);
```

---

## 18. API Reference

### Complete Endpoint List

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| **Authentication** |
| POST | `/auth/login` | User login | ❌ No | Any |
| POST | `/auth/refresh` | Refresh access token | ✅ Cookie | Any |
| POST | `/auth/logout` | User logout | ✅ Yes | Any |
| POST | `/auth/password/change` | Change password | ✅ Yes | Any |
| GET | `/auth/me` | Get current user | ✅ Yes | Any |
| **Health** |
| GET | `/health` | Health check | ❌ No | - |
| GET | `/` | API root | ❌ No | - |
| **Nurseries** |
| GET | `/admin/nurseries` | List all nurseries | ✅ Yes | Admin |
| POST | `/admin/nurseries` | Create nursery | ✅ Yes | Admin |
| GET | `/admin/nurseries/{id}` | Get nursery details | ✅ Yes | Admin/Manager |
| PUT | `/admin/nurseries/{id}` | Update nursery | ✅ Yes | Admin |
| DELETE | `/admin/nurseries/{id}` | Delete nursery | ✅ Yes | Admin |
| **Users** |
| GET | `/admin/users` | List users | ✅ Yes | Admin |
| POST | `/admin/users` | Create user | ✅ Yes | Admin |
| GET | `/admin/users/{id}` | Get user | ✅ Yes | Admin |
| PUT | `/admin/users/{id}` | Update user | ✅ Yes | Admin |
| PATCH | `/admin/users/{id}/activation` | Toggle active status | ✅ Yes | Admin |
| DELETE | `/admin/users/{id}` | Delete user | ✅ Yes | Admin |
| **Children** |
| GET | `/children` | List children | ✅ Yes | All |
| POST | `/children` | Register child | ✅ Yes | Manager/Parent |
| GET | `/children/{id}` | Get child details | ✅ Yes | All |
| PUT | `/children/{id}` | Update child | ✅ Yes | Manager/Supervisor |
| DELETE | `/children/{id}` | Delete child | ✅ Yes | Admin/Manager |
| **Attendance** |
| GET | `/attendance` | List attendance | ✅ Yes | All |
| POST | `/attendance` | Record attendance | ✅ Yes | Supervisor |
| PUT | `/attendance/{id}` | Update attendance | ✅ Yes | Supervisor |
| GET | `/attendance/stats/daily` | Daily stats | ✅ Yes | All |
| **Notifications** |
| GET | `/notifications` | List notifications | ✅ Yes | All |
| POST | `/notifications` | Create notification | ✅ Yes | Admin/Manager |
| PUT | `/notifications/{id}/read` | Mark as read | ✅ Yes | Owner |
| DELETE | `/notifications/{id}` | Delete notification | ✅ Yes | Owner |
| **Audit Logs** |
| GET | `/audit-logs` | View audit logs | ✅ Yes | Admin |
| GET | `/audit-logs/stats` | Audit statistics | ✅ Yes | Admin |
| **Files** |
| POST | `/files/upload` | Upload file | ✅ Yes | All |
| GET | `/files/{id}` | Get file info | ✅ Yes | All |
| GET | `/files/{id}/download` | Download file | ✅ Yes | All |
| DELETE | `/files/{id}` | Delete file | ✅ Yes | Owner/Admin |
| **Backup** |
| POST | `/admin/backup/manual` | Create backup | ✅ Yes | Admin |
| GET | `/admin/backup/list` | List backups | ✅ Yes | Admin |
| POST | `/admin/backup/restore` | Restore backup | ✅ Yes | Admin |

---

## Environment Configuration

**Required `.env` file:**
```env
# Application
DEBUG=False
VERSION=1.0.0

# Database
DATABASE_URL=sqlite:///./nursery.db

# Security
SECRET_KEY=your-super-secret-key-change-in-production
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS (Frontend URL)
CORS_ORIGINS=http://localhost:5174,http://localhost:3000

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
LOGIN_RATE_LIMIT=5
LOGIN_RATE_WINDOW_MINUTES=15

# File Upload
MAX_FILE_SIZE_MB=10
UPLOAD_DIR=./uploads
ALLOWED_FILE_TYPES=.jpg,.jpeg,.png,.pdf,.doc,.docx

# Email (if configured)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@nursery.com
```

---

**Status:** ✅ Production-Ready SQLite Documentation Complete
**Next:** See Part 3 for MySQL Migration Guide
