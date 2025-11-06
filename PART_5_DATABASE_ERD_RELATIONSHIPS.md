# 🗂️ PART 5: Database Schema ERD & Relationships
## Nursery Management System - Complete Database Reference

**Document Date:** 2025-01-15
**Database:** SQLite 3.x (Current) / MySQL 8.0+ (Migration Target)
**Total Tables:** 12
**Total Relationships:** 18 foreign keys

---

## Table of Contents

1. [Entity Relationship Diagram (ERD)](#1-entity-relationship-diagram-erd)
2. [Table Catalog](#2-table-catalog)
3. [Relationship Definitions](#3-relationship-definitions)
4. [Foreign Key Constraints](#4-foreign-key-constraints)
5. [Index Strategy](#5-index-strategy)
6. [Data Integrity Rules](#6-data-integrity-rules)
7. [Common Query Patterns](#7-common-query-patterns)
8. [Cardinality Matrix](#8-cardinality-matrix)
9. [Sample SQL Queries](#9-sample-sql-queries)
10. [Business Rules & Constraints](#10-business-rules--constraints)

---

## 1. Entity Relationship Diagram (ERD)

### 1.1 Complete ERD (ASCII Art)

```
┌────────────────────────┐
│     NURSERIES         │
│  ─────────────────────│
│  PK id                │◄─────────────┐
│     name              │              │
│     phone             │              │
│     license_number    │              │
│     main_address_*    │              │
│     min_age_days      │              │
│     max_age_months    │              │
│     max_capacity      │              │
│     active            │              │
│     created_at        │              │
│     updated_at        │              │
└───────┬────────────────┘              │
        │                               │
        │ 1:N                           │
        │                               │
        ▼                               │
┌────────────────────────┐              │
│      BRANCHES          │              │
│  ─────────────────────│              │
│  PK id                │              │
│  FK nursery_id        │──────────────┘
│     name              │
│     phone             │
│     address_*         │
│     max_capacity      │
│     active            │
│     created_at        │
│     updated_at        │
└───────┬────────────────┘
        │
        │ 1:N
        │
        ▼
┌────────────────────────┐
│     CLASSROOMS         │
│  ─────────────────────│
│  PK id                │
│  FK branch_id         │──────────────┐
│     name              │              │
│     min_age_days      │              │
│     max_age_months    │              │
│     max_capacity      │              │
│     active            │              │
│     created_at        │              │
│     updated_at        │              │
└────────────────────────┘              │
                                        │
┌────────────────────────┐              │
│       USERS            │              │
│  ─────────────────────│              │
│  PK id                │◄─────┐       │
│     username          │      │       │
│     password_hash     │      │       │
│     email             │      │       │
│     first_name        │      │       │
│     last_name         │      │       │
│     phone             │      │       │
│     role (ENUM)       │      │       │
│     temp_password     │      │       │
│  FK nursery_id        │──────┼───────┘
│  FK branch_id         │──────┘
│     active            │
│     last_login        │
│     created_at        │
│     updated_at        │
└───────┬────────────────┘
        │
        │ 1:N (parent → children)
        │
        ▼
┌────────────────────────┐
│      CHILDREN          │◄─────────────┐
│  ─────────────────────│              │
│  PK id                │              │
│  FK parent_id         │──────────────┘
│  FK nursery_id        │───────────────────┐
│  FK classroom_id      │───────────────────┼───┐
│     first_name        │                   │   │
│     last_name         │                   │   │
│     date_of_birth     │                   │   │
│     gender (ENUM)     │                   │   │
│     medical_notes     │                   │   │
│     allergies         │                   │   │
│     status (ENUM)     │                   │   │
│     created_at        │                   │   │
│     updated_at        │                   │   │
└───────┬────────────────┘                   │   │
        │                                    │   │
        │ 1:N                                │   │
        ├────────────────┬───────────────────┤   │
        │                │                   │   │
        ▼                ▼                   │   │
┌────────────┐  ┌─────────────────┐          │   │
│ ATTENDANCE │  │  DAILY_REPORTS  │          │   │
│ ──────────│  │  ────────────── │          │   │
│ PK id     │  │  PK id          │          │   │
│ FK child_id│  │  FK child_id    │          │   │
│    date   │  │  FK supervisor_id│──┐       │   │
│    status │  │     date         │  │       │   │
│    check_*│  │     meals        │  │       │   │
│    notes  │  │     nap_time     │  │       │   │
│ created_at│  │     activities   │  │       │   │
│ updated_at│  │     mood         │  │       │   │
└───────────┘  │     notes        │  │       │   │
               │     created_at   │  │       │   │
               │     updated_at   │  │       │   │
               └──────────────────┘  │       │   │
                                     │       │   │
┌────────────────────────┐           │       │   │
│    FILE_ASSETS         │           │       │   │
│  ─────────────────────│           │       │   │
│  PK id                │           │       │   │
│  FK uploaded_by       │───────────┘       │   │
│  FK child_id          │───────────────────┘   │
│     filename          │                       │
│     original_filename │                       │
│     file_path         │                       │
│     file_size         │                       │
│     mime_type         │                       │
│     file_type (ENUM)  │                       │
│     created_at        │                       │
└────────────────────────┘                       │
                                                 │
┌────────────────────────┐                       │
│   REFRESH_TOKENS       │                       │
│  ─────────────────────│                       │
│  PK id                │                       │
│  FK user_id           │───────────────────────┤
│     token             │                       │
│     expires_at        │                       │
│     revoked           │                       │
│     created_at        │                       │
└────────────────────────┘                       │
                                                 │
┌────────────────────────┐                       │
│    NOTIFICATIONS       │                       │
│  ─────────────────────│                       │
│  PK id                │                       │
│  FK user_id           │───────────────────────┤
│     title             │                       │
│     message           │                       │
│     notification_type │                       │
│     is_read           │                       │
│     read_at           │                       │
│     created_at        │                       │
└────────────────────────┘                       │
                                                 │
┌────────────────────────┐                       │
│     AUDIT_LOGS         │                       │
│  ─────────────────────│                       │
│  PK id                │                       │
│  FK user_id (nullable)│───────────────────────┘
│     action            │
│     resource_type     │
│     resource_id       │
│     details (JSON)    │
│     ip_address        │
│     user_agent        │
│     created_at        │
└────────────────────────┘

┌────────────────────────┐
│   LOGIN_ATTEMPTS       │
│  ─────────────────────│
│  PK id                │
│     email             │
│     ip_address        │
│     success           │
│     attempted_at      │
└────────────────────────┘
```

### 1.2 Simplified Relationship View

```
NURSERIES (1) ──< BRANCHES (N)
    │                │
    │                └──< CLASSROOMS (N)
    │                        │
    └──< USERS (N)           │
            │                │
            └──< CHILDREN (N)┘
                    │
                    ├──< ATTENDANCE (N)
                    ├──< DAILY_REPORTS (N)
                    └──< FILE_ASSETS (N)

USERS (1) ──< REFRESH_TOKENS (N)
    │
    ├──< NOTIFICATIONS (N)
    ├──< AUDIT_LOGS (N)
    ├──< FILE_ASSETS (N) [uploaded_by]
    └──< DAILY_REPORTS (N) [supervisor_id]

LOGIN_ATTEMPTS (standalone, no FK)
```

---

## 2. Table Catalog

### 2.1 Core Organizational Tables

| Table | Purpose | Row Count (Est.) | Key Columns |
|-------|---------|------------------|-------------|
| **nurseries** | Top-level organizations | 10-100 | id, name, phone, license_number |
| **branches** | Physical locations | 20-500 | id, nursery_id, name, phone |
| **classrooms** | Age-based groups | 50-1000 | id, branch_id, name, min_age_days, max_age_months |

### 2.2 User & Child Tables

| Table | Purpose | Row Count (Est.) | Key Columns |
|-------|---------|------------------|-------------|
| **users** | All system users | 100-1000 | id, username, role, nursery_id, branch_id |
| **children** | Registered children | 500-10000 | id, parent_id, nursery_id, classroom_id |

### 2.3 Activity Tracking Tables

| Table | Purpose | Row Count (Est.) | Key Columns |
|-------|---------|------------------|-------------|
| **attendance** | Daily attendance | 10k-100k | id, child_id, date, status, check_in_time |
| **daily_reports** | Activity reports | 10k-100k | id, child_id, supervisor_id, date |

### 2.4 Supporting Tables

| Table | Purpose | Row Count (Est.) | Key Columns |
|-------|---------|------------------|-------------|
| **file_assets** | File metadata | 1k-50k | id, uploaded_by, child_id, file_type |
| **refresh_tokens** | Auth sessions | 100-1000 | id, user_id, token, expires_at |
| **notifications** | User alerts | 1k-10k | id, user_id, is_read |
| **audit_logs** | Audit trail | 10k-1M | id, user_id, action, resource_type |
| **login_attempts** | Security tracking | 1k-100k | id, email, ip_address, attempted_at |

---

## 3. Relationship Definitions

### 3.1 Nursery → Branches (1:N)

**Relationship:**
- One nursery has many branches
- Each branch belongs to exactly one nursery

**Foreign Key:**
```sql
branches.nursery_id → nurseries.id
```

**Cardinality:** 1:N (one-to-many)

**ON DELETE:** CASCADE (if nursery deleted, delete all branches)
**ON UPDATE:** CASCADE (if nursery.id changes, update branches.nursery_id)

**Business Rule:**
- A nursery must have at least one branch (main branch)
- Branches cannot exist without a parent nursery

**SQLAlchemy ORM:**
```python
class Nursery(Base):
    branches = relationship("Branch", back_populates="nursery", cascade="all, delete-orphan")

class Branch(Base):
    nursery_id = Column(Integer, ForeignKey('nurseries.id', ondelete='CASCADE'))
    nursery = relationship("Nursery", back_populates="branches")
```

---

### 3.2 Branch → Classrooms (1:N)

**Relationship:**
- One branch has many classrooms
- Each classroom belongs to exactly one branch

**Foreign Key:**
```sql
classrooms.branch_id → branches.id
```

**Cardinality:** 1:N

**ON DELETE:** CASCADE
**ON UPDATE:** CASCADE

**Business Rule:**
- Classrooms are age-based divisions within a branch
- Classrooms cannot span multiple branches

---

### 3.3 Nursery → Users (1:N)

**Relationship:**
- One nursery has many users (managers, supervisors)
- Users can be assigned to one nursery (nullable for admins)

**Foreign Key:**
```sql
users.nursery_id → nurseries.id
```

**Cardinality:** 1:N (optional)

**ON DELETE:** SET NULL (preserve user record, remove nursery assignment)
**ON UPDATE:** CASCADE

**Business Rule:**
- Admins: nursery_id = NULL (global access)
- Managers: nursery_id required (manage specific nursery)
- Supervisors: nursery_id required (work at specific nursery)
- Parents: nursery_id required (children enrolled at specific nursery)

---

### 3.4 Branch → Users (1:N)

**Relationship:**
- One branch can have many supervisors assigned
- Supervisors can be assigned to one branch (nullable)

**Foreign Key:**
```sql
users.branch_id → branches.id
```

**Cardinality:** 1:N (optional)

**ON DELETE:** SET NULL
**ON UPDATE:** CASCADE

**Business Rule:**
- Only supervisors have branch_id assigned
- Managers can oversee all branches in their nursery

---

### 3.5 User (Parent) → Children (1:N)

**Relationship:**
- One parent user has many children
- Each child belongs to exactly one parent account

**Foreign Key:**
```sql
children.parent_id → users.id WHERE users.role = 'parent'
```

**Cardinality:** 1:N

**ON DELETE:** RESTRICT (cannot delete parent if children exist)
**ON UPDATE:** CASCADE

**Business Rule:**
- Only users with role='parent' can have children
- Must have at least one child to be a valid parent account
- Children cannot exist without a parent

---

### 3.6 Nursery → Children (1:N)

**Relationship:**
- One nursery enrolls many children
- Each child is enrolled at exactly one nursery

**Foreign Key:**
```sql
children.nursery_id → nurseries.id
```

**Cardinality:** 1:N

**ON DELETE:** RESTRICT (cannot delete nursery with enrolled children)
**ON UPDATE:** CASCADE

**Business Rule:**
- Child's nursery must match parent's nursery
- Child cannot change nurseries (must re-register)

---

### 3.7 Classroom → Children (1:N)

**Relationship:**
- One classroom contains many children
- Each child can be assigned to one classroom (optional)

**Foreign Key:**
```sql
children.classroom_id → classrooms.id
```

**Cardinality:** 1:N (optional)

**ON DELETE:** SET NULL (child remains enrolled, just unassigned)
**ON UPDATE:** CASCADE

**Business Rule:**
- Children can be unassigned (classroom_id = NULL)
- Classroom assignment validates age against classroom age range
- Classroom capacity enforced before assignment

---

### 3.8 Child → Attendance (1:N)

**Relationship:**
- One child has many attendance records (one per day)
- Each attendance record belongs to exactly one child

**Foreign Key:**
```sql
attendance.child_id → children.id
```

**Cardinality:** 1:N

**ON DELETE:** CASCADE (if child deleted, delete attendance history)
**ON UPDATE:** CASCADE

**Business Rule:**
- Maximum one attendance record per child per day (UNIQUE constraint)
- Attendance cannot be recorded for graduated/inactive children

---

### 3.9 Child → Daily Reports (1:N)

**Relationship:**
- One child has many daily reports
- Each report is about exactly one child

**Foreign Key:**
```sql
daily_reports.child_id → children.id
```

**Cardinality:** 1:N

**ON DELETE:** CASCADE
**ON UPDATE:** CASCADE

**Business Rule:**
- Maximum one report per child per day (UNIQUE constraint)
- Only supervisors assigned to child's nursery can create reports

---

### 3.10 User (Supervisor) → Daily Reports (1:N)

**Relationship:**
- One supervisor creates many daily reports
- Each report is created by exactly one supervisor

**Foreign Key:**
```sql
daily_reports.supervisor_id → users.id WHERE users.role IN ('supervisor', 'manager', 'admin')
```

**Cardinality:** 1:N

**ON DELETE:** RESTRICT (preserve report authorship)
**ON UPDATE:** CASCADE

**Business Rule:**
- Only supervisors, managers, or admins can create reports
- Supervisor must be assigned to same nursery as child

---

### 3.11 User → File Assets (1:N) [Uploader]

**Relationship:**
- One user uploads many files
- Each file is uploaded by exactly one user

**Foreign Key:**
```sql
file_assets.uploaded_by → users.id
```

**Cardinality:** 1:N

**ON DELETE:** RESTRICT (preserve upload history)
**ON UPDATE:** CASCADE

**Business Rule:**
- All roles can upload files
- Uploader must have access to associated child (if child_id set)

---

### 3.12 Child → File Assets (1:N) [Related Child]

**Relationship:**
- One child can have many files (photos, documents)
- Each file can be associated with one child (optional)

**Foreign Key:**
```sql
file_assets.child_id → children.id
```

**Cardinality:** 1:N (optional)

**ON DELETE:** CASCADE (delete child files when child deleted)
**ON UPDATE:** CASCADE

**Business Rule:**
- Files can be unassociated (child_id = NULL) for general documents
- Parents can only upload files for their own children

---

### 3.13 User → Refresh Tokens (1:N)

**Relationship:**
- One user can have multiple refresh tokens (multiple sessions)
- Each token belongs to exactly one user

**Foreign Key:**
```sql
refresh_tokens.user_id → users.id
```

**Cardinality:** 1:N

**ON DELETE:** CASCADE (delete tokens when user deleted)
**ON UPDATE:** CASCADE

**Business Rule:**
- Maximum 5 active tokens per user (old tokens auto-revoked)
- Expired tokens cleaned up daily

---

### 3.14 User → Notifications (1:N)

**Relationship:**
- One user receives many notifications
- Each notification is for exactly one user

**Foreign Key:**
```sql
notifications.user_id → users.id
```

**Cardinality:** 1:N

**ON DELETE:** CASCADE
**ON UPDATE:** CASCADE

**Business Rule:**
- Notifications auto-deleted after 90 days
- Unread notifications shown in header badge

---

### 3.15 User → Audit Logs (1:N)

**Relationship:**
- One user generates many audit log entries
- Each log entry is associated with one user (nullable for system actions)

**Foreign Key:**
```sql
audit_logs.user_id → users.id
```

**Cardinality:** 1:N (optional)

**ON DELETE:** SET NULL (preserve audit trail even if user deleted)
**ON UPDATE:** CASCADE

**Business Rule:**
- System-generated actions have user_id = NULL
- Audit logs never deleted (archival only)

---

## 4. Foreign Key Constraints

### 4.1 Foreign Key Summary Table

| Child Table | FK Column | Parent Table | Parent Column | ON DELETE | ON UPDATE | Nullable |
|-------------|-----------|--------------|---------------|-----------|-----------|----------|
| branches | nursery_id | nurseries | id | CASCADE | CASCADE | NO |
| classrooms | branch_id | branches | id | CASCADE | CASCADE | NO |
| users | nursery_id | nurseries | id | SET NULL | CASCADE | YES |
| users | branch_id | branches | id | SET NULL | CASCADE | YES |
| children | parent_id | users | id | RESTRICT | CASCADE | NO |
| children | nursery_id | nurseries | id | RESTRICT | CASCADE | NO |
| children | classroom_id | classrooms | id | SET NULL | CASCADE | YES |
| attendance | child_id | children | id | CASCADE | CASCADE | NO |
| daily_reports | child_id | children | id | CASCADE | CASCADE | NO |
| daily_reports | supervisor_id | users | id | RESTRICT | CASCADE | NO |
| file_assets | uploaded_by | users | id | RESTRICT | CASCADE | NO |
| file_assets | child_id | children | id | CASCADE | CASCADE | YES |
| refresh_tokens | user_id | users | id | CASCADE | CASCADE | NO |
| notifications | user_id | users | id | CASCADE | CASCADE | NO |
| audit_logs | user_id | users | id | SET NULL | CASCADE | YES |

**Total Foreign Keys:** 15

### 4.2 ON DELETE Behavior Explanation

| Behavior | Effect | Use Case |
|----------|--------|----------|
| **CASCADE** | Delete child rows when parent deleted | Cleanup dependent data (e.g., delete branches when nursery deleted) |
| **SET NULL** | Set FK to NULL when parent deleted | Preserve child but remove association (e.g., user loses nursery assignment) |
| **RESTRICT** | Prevent parent deletion if children exist | Protect critical data (e.g., cannot delete parent user with children enrolled) |

### 4.3 MySQL DDL for Foreign Keys

```sql
-- Example: Children table foreign keys
ALTER TABLE children
  ADD CONSTRAINT fk_children_parent
    FOREIGN KEY (parent_id) REFERENCES users(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  ADD CONSTRAINT fk_children_nursery
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,

  ADD CONSTRAINT fk_children_classroom
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
```

---

## 5. Index Strategy

### 5.1 Primary Key Indexes (Automatic)

All tables have clustered primary key index on `id` column:
```sql
CREATE INDEX pk_users ON users(id);  -- Automatic
```

### 5.2 Unique Indexes

```sql
-- Users
CREATE UNIQUE INDEX uk_users_username ON users(username);
CREATE UNIQUE INDEX uk_users_email ON users(email) WHERE email IS NOT NULL;

-- Attendance (composite unique)
CREATE UNIQUE INDEX uk_attendance_child_date ON attendance(child_id, date);

-- Daily Reports (composite unique)
CREATE UNIQUE INDEX uk_daily_reports_child_date ON daily_reports(child_id, date);

-- Refresh Tokens
CREATE UNIQUE INDEX uk_refresh_tokens_token ON refresh_tokens(token);
```

### 5.3 Foreign Key Indexes

**Critical for query performance:**

```sql
-- Users
CREATE INDEX idx_users_nursery ON users(nursery_id);
CREATE INDEX idx_users_branch ON users(branch_id);
CREATE INDEX idx_users_role ON users(role);

-- Branches
CREATE INDEX idx_branches_nursery ON branches(nursery_id);

-- Classrooms
CREATE INDEX idx_classrooms_branch ON classrooms(branch_id);

-- Children
CREATE INDEX idx_children_parent ON children(parent_id);
CREATE INDEX idx_children_nursery ON children(nursery_id);
CREATE INDEX idx_children_classroom ON children(classroom_id);

-- Attendance
CREATE INDEX idx_attendance_child ON attendance(child_id);
CREATE INDEX idx_attendance_date ON attendance(date);

-- Daily Reports
CREATE INDEX idx_daily_reports_child ON daily_reports(child_id);
CREATE INDEX idx_daily_reports_supervisor ON daily_reports(supervisor_id);

-- File Assets
CREATE INDEX idx_file_assets_uploader ON file_assets(uploaded_by);
CREATE INDEX idx_file_assets_child ON file_assets(child_id);

-- Refresh Tokens
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires ON refresh_tokens(expires_at);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);

-- Login Attempts
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
```

### 5.4 Composite Indexes for Common Queries

```sql
-- Children by status and nursery
CREATE INDEX idx_children_status_nursery ON children(status, nursery_id);

-- Attendance by date range and status
CREATE INDEX idx_attendance_date_status ON attendance(date, status);

-- Notifications unread by user
CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);

-- Audit logs by date and action
CREATE INDEX idx_audit_logs_created_action ON audit_logs(created_at DESC, action);

-- Users by role and nursery
CREATE INDEX idx_users_role_nursery ON users(role, nursery_id);
```

**Total Indexes:** ~40 (including automatic PK indexes)

---

## 6. Data Integrity Rules

### 6.1 Check Constraints

```sql
-- Nurseries: Capacity must be positive
ALTER TABLE nurseries ADD CONSTRAINT chk_nurseries_capacity
  CHECK (max_capacity IS NULL OR max_capacity > 0);

-- Nurseries: Age range validation
ALTER TABLE nurseries ADD CONSTRAINT chk_nurseries_age_range
  CHECK (
    (min_age_days IS NULL OR min_age_days >= 0) AND
    (max_age_months IS NULL OR max_age_months > 0)
  );

-- Branches: Capacity must be positive
ALTER TABLE branches ADD CONSTRAINT chk_branches_capacity
  CHECK (max_capacity IS NULL OR max_capacity > 0);

-- Classrooms: Capacity must be positive
ALTER TABLE classrooms ADD CONSTRAINT chk_classrooms_capacity
  CHECK (max_capacity IS NULL OR max_capacity > 0);

-- Classrooms: Age range validation
ALTER TABLE classrooms ADD CONSTRAINT chk_classrooms_age_range
  CHECK (
    (min_age_days IS NULL OR min_age_days >= 0) AND
    (max_age_months IS NULL OR max_age_months > 0)
  );

-- Attendance: Check-out must be after check-in
ALTER TABLE attendance ADD CONSTRAINT chk_attendance_times
  CHECK (
    check_out_time IS NULL OR
    check_in_time IS NULL OR
    check_out_time >= check_in_time
  );

-- Children: Date of birth must be in the past
ALTER TABLE children ADD CONSTRAINT chk_children_dob
  CHECK (date_of_birth < CURRENT_DATE);
```

### 6.2 Unique Constraints

```sql
-- Users: Unique username
ALTER TABLE users ADD CONSTRAINT uk_users_username UNIQUE (username);

-- Users: Unique email (if provided)
ALTER TABLE users ADD CONSTRAINT uk_users_email UNIQUE (email);

-- Attendance: One record per child per day
ALTER TABLE attendance ADD CONSTRAINT uk_attendance_child_date UNIQUE (child_id, date);

-- Daily Reports: One report per child per day
ALTER TABLE daily_reports ADD CONSTRAINT uk_daily_reports_child_date UNIQUE (child_id, date);

-- Refresh Tokens: Unique token
ALTER TABLE refresh_tokens ADD CONSTRAINT uk_refresh_tokens_token UNIQUE (token);
```

### 6.3 NOT NULL Constraints

**Required Fields (cannot be NULL):**

```sql
-- Users
username, password_hash, first_name, last_name, phone, role, active, created_at, updated_at

-- Children
parent_id, nursery_id, first_name, last_name, date_of_birth, gender, status, created_at, updated_at

-- Attendance
child_id, date, status, created_at, updated_at

-- Daily Reports
child_id, supervisor_id, date, created_at, updated_at

-- Nurseries, Branches, Classrooms
name, active, created_at, updated_at
```

### 6.4 Default Values

```sql
-- Boolean defaults
active = TRUE (for users, nurseries, branches, classrooms, children)
revoked = FALSE (for refresh_tokens)
is_read = FALSE (for notifications)
success = FALSE (for login_attempts)

-- Timestamp defaults
created_at = CURRENT_TIMESTAMP
updated_at = CURRENT_TIMESTAMP (with ON UPDATE CURRENT_TIMESTAMP)

-- Enum defaults
status = 'present' (for attendance)
status = 'active' (for children)
notification_type = 'info' (for notifications)
file_type = 'other' (for file_assets)
```

---

## 7. Common Query Patterns

### 7.1 Get All Children for a Parent

```sql
-- With parent user info
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.date_of_birth,
  c.status,
  cl.name AS classroom_name,
  n.name AS nursery_name
FROM children c
INNER JOIN users u ON c.parent_id = u.id
LEFT JOIN classrooms cl ON c.classroom_id = cl.id
INNER JOIN nurseries n ON c.nursery_id = n.id
WHERE u.id = ? AND c.status = 'active';
```

**Indexes Used:**
- `idx_children_parent` (FK index)
- `idx_children_status_nursery` (composite)

---

### 7.2 Get Today's Attendance for a Classroom

```sql
SELECT
  a.id,
  a.status,
  a.check_in_time,
  a.check_out_time,
  c.first_name,
  c.last_name
FROM attendance a
INNER JOIN children c ON a.child_id = c.id
WHERE c.classroom_id = ?
  AND a.date = CURRENT_DATE
ORDER BY c.last_name, c.first_name;
```

**Indexes Used:**
- `idx_attendance_child` (FK index)
- `idx_attendance_date` (date index)
- `idx_children_classroom` (FK index)

---

### 7.3 Get Unread Notifications for User

```sql
SELECT
  id,
  title,
  message,
  notification_type,
  created_at
FROM notifications
WHERE user_id = ?
  AND is_read = FALSE
ORDER BY created_at DESC
LIMIT 20;
```

**Indexes Used:**
- `idx_notifications_user_unread` (composite index)

---

### 7.4 Get All Users in a Nursery by Role

```sql
SELECT
  u.id,
  u.username,
  u.first_name,
  u.last_name,
  u.email,
  u.phone,
  u.role,
  u.active,
  b.name AS branch_name
FROM users u
LEFT JOIN branches b ON u.branch_id = b.id
WHERE u.nursery_id = ?
  AND u.role = ?
ORDER BY u.last_name, u.first_name;
```

**Indexes Used:**
- `idx_users_role_nursery` (composite index)

---

### 7.5 Get Attendance Statistics for Date Range

```sql
SELECT
  a.date,
  COUNT(*) AS total_children,
  SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END) AS present_count,
  SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END) AS absent_count,
  SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END) AS late_count
FROM attendance a
INNER JOIN children c ON a.child_id = c.id
WHERE c.nursery_id = ?
  AND a.date BETWEEN ? AND ?
GROUP BY a.date
ORDER BY a.date DESC;
```

**Indexes Used:**
- `idx_attendance_date_status` (composite index)
- `idx_children_nursery` (FK index)

---

### 7.6 Get Recent Audit Logs for Resource

```sql
SELECT
  al.id,
  al.action,
  al.details,
  al.created_at,
  u.username,
  u.first_name,
  u.last_name
FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id
WHERE al.resource_type = ?
  AND al.resource_id = ?
ORDER BY al.created_at DESC
LIMIT 50;
```

**Indexes Used:**
- `idx_audit_logs_resource` (composite index)

---

### 7.7 Get Children with No Classroom Assignment

```sql
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.date_of_birth,
  TIMESTAMPDIFF(DAY, c.date_of_birth, CURRENT_DATE) AS age_in_days
FROM children c
WHERE c.nursery_id = ?
  AND c.status = 'active'
  AND c.classroom_id IS NULL
ORDER BY c.date_of_birth;
```

**Indexes Used:**
- `idx_children_status_nursery` (composite index)

---

### 7.8 Get Daily Reports with Supervisor Info

```sql
SELECT
  dr.id,
  dr.date,
  dr.meals,
  dr.nap_time,
  dr.activities,
  dr.mood,
  dr.notes,
  c.first_name AS child_first_name,
  c.last_name AS child_last_name,
  u.first_name AS supervisor_first_name,
  u.last_name AS supervisor_last_name
FROM daily_reports dr
INNER JOIN children c ON dr.child_id = c.id
INNER JOIN users u ON dr.supervisor_id = u.id
WHERE c.id = ?
  AND dr.date BETWEEN ? AND ?
ORDER BY dr.date DESC;
```

**Indexes Used:**
- `idx_daily_reports_child` (FK index)
- `uk_daily_reports_child_date` (composite unique index)

---

## 8. Cardinality Matrix

### 8.1 Complete Relationship Cardinality

| Parent Table | Child Table | Relationship | Cardinality | Optional? |
|--------------|-------------|--------------|-------------|-----------|
| nurseries | branches | 1:N | One nursery → Many branches | No (min 1 branch) |
| branches | classrooms | 1:N | One branch → Many classrooms | Yes |
| nurseries | users | 1:N | One nursery → Many users | Yes (admins have none) |
| branches | users | 1:N | One branch → Many users | Yes (only supervisors) |
| users | children | 1:N | One parent → Many children | No (min 1 child) |
| nurseries | children | 1:N | One nursery → Many children | No |
| classrooms | children | 1:N | One classroom → Many children | Yes |
| children | attendance | 1:N | One child → Many attendance | No |
| children | daily_reports | 1:N | One child → Many reports | No |
| users | daily_reports | 1:N | One supervisor → Many reports | No |
| users | file_assets | 1:N | One uploader → Many files | No |
| children | file_assets | 1:N | One child → Many files | Yes |
| users | refresh_tokens | 1:N | One user → Many tokens | No |
| users | notifications | 1:N | One user → Many notifications | No |
| users | audit_logs | 1:N | One user → Many logs | Yes (system logs) |

### 8.2 Transitive Relationships (via multiple hops)

```sql
-- Nursery → Classrooms (via Branches)
nurseries (1) → branches (N) → classrooms (N)

-- Nursery → Children (direct + via Classrooms)
nurseries (1) → children (N)  [direct FK]
nurseries (1) → branches (N) → classrooms (N) → children (N)  [hierarchical]

-- Branch → Children (via Classrooms)
branches (1) → classrooms (N) → children (N)

-- User → Attendance (via Children)
users (1) → children (N) → attendance (N)

-- Nursery → Attendance (via Children)
nurseries (1) → children (N) → attendance (N)
```

---

## 9. Sample SQL Queries

### 9.1 Complex Query: Get Complete Child Profile

```sql
SELECT
  -- Child info
  c.id,
  c.first_name,
  c.last_name,
  c.date_of_birth,
  c.gender,
  c.status,
  c.medical_notes,
  c.allergies,

  -- Parent info
  p.username AS parent_username,
  p.first_name AS parent_first_name,
  p.last_name AS parent_last_name,
  p.phone AS parent_phone,
  p.email AS parent_email,

  -- Nursery info
  n.name AS nursery_name,
  n.phone AS nursery_phone,

  -- Classroom info
  cl.name AS classroom_name,
  cl.min_age_days AS classroom_min_age,
  cl.max_age_months AS classroom_max_age,

  -- Branch info
  b.name AS branch_name,
  b.address_city AS branch_city,

  -- Attendance summary (last 30 days)
  (SELECT COUNT(*) FROM attendance WHERE child_id = c.id AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) AND status = 'present') AS days_present_30,
  (SELECT COUNT(*) FROM attendance WHERE child_id = c.id AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) AND status = 'absent') AS days_absent_30,
  (SELECT COUNT(*) FROM attendance WHERE child_id = c.id AND date >= DATE_SUB(CURRENT_DATE, INTERVAL 30 DAY) AND status = 'late') AS days_late_30,

  -- Last report date
  (SELECT MAX(date) FROM daily_reports WHERE child_id = c.id) AS last_report_date

FROM children c
INNER JOIN users p ON c.parent_id = p.id
INNER JOIN nurseries n ON c.nursery_id = n.id
LEFT JOIN classrooms cl ON c.classroom_id = cl.id
LEFT JOIN branches b ON cl.branch_id = b.id
WHERE c.id = ?;
```

### 9.2 Complex Query: Nursery Dashboard Statistics

```sql
SELECT
  -- Total counts
  (SELECT COUNT(*) FROM children WHERE nursery_id = ? AND status = 'active') AS total_children,
  (SELECT COUNT(*) FROM users WHERE nursery_id = ? AND role = 'supervisor' AND active = TRUE) AS total_supervisors,
  (SELECT COUNT(*) FROM users WHERE nursery_id = ? AND role = 'parent' AND active = TRUE) AS total_parents,
  (SELECT COUNT(*) FROM branches WHERE nursery_id = ? AND active = TRUE) AS total_branches,
  (SELECT COUNT(*) FROM classrooms WHERE branch_id IN (SELECT id FROM branches WHERE nursery_id = ?) AND active = TRUE) AS total_classrooms,

  -- Today's attendance
  (SELECT COUNT(*) FROM attendance a INNER JOIN children c ON a.child_id = c.id WHERE c.nursery_id = ? AND a.date = CURRENT_DATE AND a.status = 'present') AS present_today,
  (SELECT COUNT(*) FROM attendance a INNER JOIN children c ON a.child_id = c.id WHERE c.nursery_id = ? AND a.date = CURRENT_DATE AND a.status = 'absent') AS absent_today,
  (SELECT COUNT(*) FROM attendance a INNER JOIN children c ON a.child_id = c.id WHERE c.nursery_id = ? AND a.date = CURRENT_DATE AND a.status = 'late') AS late_today,

  -- Reports
  (SELECT COUNT(*) FROM daily_reports dr INNER JOIN children c ON dr.child_id = c.id WHERE c.nursery_id = ? AND dr.date = CURRENT_DATE) AS reports_today;
```

### 9.3 Complex Query: Find Children Who Need Classroom Assignment

```sql
SELECT
  c.id,
  c.first_name,
  c.last_name,
  c.date_of_birth,
  TIMESTAMPDIFF(DAY, c.date_of_birth, CURRENT_DATE) AS age_in_days,
  TIMESTAMPDIFF(MONTH, c.date_of_birth, CURRENT_DATE) AS age_in_months,

  -- Suggested classrooms based on age
  (
    SELECT GROUP_CONCAT(cl.name SEPARATOR ', ')
    FROM classrooms cl
    INNER JOIN branches b ON cl.branch_id = b.id
    WHERE b.nursery_id = c.nursery_id
      AND cl.active = TRUE
      AND TIMESTAMPDIFF(DAY, c.date_of_birth, CURRENT_DATE) >= COALESCE(cl.min_age_days, 0)
      AND TIMESTAMPDIFF(MONTH, c.date_of_birth, CURRENT_DATE) <= COALESCE(cl.max_age_months, 999)
      AND (SELECT COUNT(*) FROM children WHERE classroom_id = cl.id AND status = 'active') < COALESCE(cl.max_capacity, 999)
  ) AS suggested_classrooms

FROM children c
WHERE c.nursery_id = ?
  AND c.status = 'active'
  AND c.classroom_id IS NULL
ORDER BY c.date_of_birth;
```

### 9.4 Query: Audit Trail for Specific Resource

```sql
SELECT
  al.id,
  al.action,
  al.created_at,
  al.ip_address,
  COALESCE(u.username, 'SYSTEM') AS performed_by,
  CONCAT(u.first_name, ' ', u.last_name) AS user_full_name,
  al.details

FROM audit_logs al
LEFT JOIN users u ON al.user_id = u.id

WHERE al.resource_type = 'child'
  AND al.resource_id = ?

ORDER BY al.created_at DESC;
```

**Example Output:**
```
| action         | performed_by | user_full_name | created_at          | details                           |
|----------------|--------------|----------------|---------------------|-----------------------------------|
| child.update   | manager1     | John Doe       | 2025-01-15 14:30:00 | {"field":"classroom_id",...}      |
| child.create   | manager1     | John Doe       | 2025-01-10 09:15:00 | {"name":"Ahmed Mohamed",...}      |
```

---

## 10. Business Rules & Constraints

### 10.1 User Management Rules

**Rule UM-1: Role Hierarchy**
- Admins can manage all users
- Managers can manage supervisors and parents within their nursery
- Supervisors cannot manage users
- Parents cannot manage users

**Rule UM-2: Nursery Assignment**
```sql
-- Validation before user creation
IF role IN ('manager', 'supervisor', 'parent') THEN
  nursery_id MUST NOT BE NULL
ELSE IF role = 'admin' THEN
  nursery_id MUST BE NULL
END IF
```

**Rule UM-3: Branch Assignment**
```sql
-- Only supervisors can have branch assignment
IF role = 'supervisor' THEN
  branch_id IS OPTIONAL (can be assigned later)
ELSE
  branch_id MUST BE NULL
END IF
```

**Rule UM-4: Parent Account Validation**
```sql
-- A parent account must have at least one child
SELECT COUNT(*) FROM children WHERE parent_id = ? AND status != 'graduated'
-- Must be > 0
```

---

### 10.2 Child Enrollment Rules

**Rule CE-1: Parent-Nursery Matching**
```sql
-- Child's nursery must match parent's nursery
SELECT 1
FROM children c
INNER JOIN users p ON c.parent_id = p.id
WHERE c.nursery_id != p.nursery_id
-- Should return 0 rows (constraint violation)
```

**Rule CE-2: Age Validation Against Nursery**
```sql
-- Child's age must fall within nursery's age range
SELECT
  TIMESTAMPDIFF(DAY, c.date_of_birth, CURRENT_DATE) AS age_in_days,
  TIMESTAMPDIFF(MONTH, c.date_of_birth, CURRENT_DATE) AS age_in_months,
  n.min_age_days,
  n.max_age_months
FROM children c
INNER JOIN nurseries n ON c.nursery_id = n.id
WHERE age_in_days < n.min_age_days
   OR age_in_months > n.max_age_months
-- Should return 0 rows
```

**Rule CE-3: Classroom Age Validation**
```sql
-- If classroom assigned, child age must match classroom range
SELECT 1
FROM children c
INNER JOIN classrooms cl ON c.classroom_id = cl.id
WHERE TIMESTAMPDIFF(DAY, c.date_of_birth, CURRENT_DATE) < COALESCE(cl.min_age_days, 0)
   OR TIMESTAMPDIFF(MONTH, c.date_of_birth, CURRENT_DATE) > COALESCE(cl.max_age_months, 999)
-- Should return 0 rows
```

**Rule CE-4: Classroom Capacity**
```sql
-- Cannot assign child if classroom at capacity
SELECT COUNT(*) FROM children
WHERE classroom_id = ?
  AND status = 'active'
-- Must be < classroom.max_capacity
```

---

### 10.3 Attendance Rules

**Rule AT-1: One Record Per Day**
```sql
-- Enforced by UNIQUE constraint
UNIQUE (child_id, date)
```

**Rule AT-2: Cannot Record Attendance for Inactive Child**
```sql
-- Application-level validation
SELECT status FROM children WHERE id = ?
-- Must be 'active'
```

**Rule AT-3: Check-out Must Be After Check-in**
```sql
-- Enforced by CHECK constraint
CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time >= check_in_time)
```

**Rule AT-4: Attendance Date Must Not Be Future**
```sql
-- Application-level validation
IF attendance.date > CURRENT_DATE THEN
  RAISE ERROR 'Cannot record attendance for future dates'
END IF
```

---

### 10.4 Daily Report Rules

**Rule DR-1: One Report Per Child Per Day**
```sql
-- Enforced by UNIQUE constraint
UNIQUE (child_id, date)
```

**Rule DR-2: Supervisor Must Be From Same Nursery**
```sql
-- Application-level validation
SELECT c.nursery_id, u.nursery_id
FROM children c, users u
WHERE c.id = ? AND u.id = ?
-- Both nursery_id values must match
```

**Rule DR-3: Only Active Supervisors Can Create Reports**
```sql
SELECT role, active FROM users WHERE id = ?
-- Must be role IN ('supervisor', 'manager', 'admin') AND active = TRUE
```

---

### 10.5 File Upload Rules

**Rule FU-1: File Size Limit**
```sql
-- Application-level validation
IF file.size > 10 * 1024 * 1024 THEN  -- 10MB
  RAISE ERROR 'File too large'
END IF
```

**Rule FU-2: Allowed MIME Types**
```sql
-- Application-level validation
IF file.mime_type NOT IN ('image/jpeg', 'image/png', 'application/pdf', ...) THEN
  RAISE ERROR 'File type not allowed'
END IF
```

**Rule FU-3: Parent Can Only Upload for Own Children**
```sql
-- If uploader is parent
SELECT 1 FROM children
WHERE id = ?  -- child_id being uploaded for
  AND parent_id = ?  -- uploader's user_id
-- Must return 1 row
```

---

### 10.6 Capacity Management Rules

**Rule CM-1: Nursery Total Capacity**
```sql
-- Total enrolled children should not exceed nursery capacity
SELECT COUNT(*) FROM children
WHERE nursery_id = ? AND status = 'active'
-- Should be <= nursery.max_capacity (if set)
```

**Rule CM-2: Branch Total Capacity**
```sql
-- Total children in branch's classrooms should not exceed branch capacity
SELECT COUNT(*) FROM children c
INNER JOIN classrooms cl ON c.classroom_id = cl.id
WHERE cl.branch_id = ? AND c.status = 'active'
-- Should be <= branch.max_capacity (if set)
```

**Rule CM-3: Classroom Capacity**
```sql
-- Total children in classroom should not exceed classroom capacity
SELECT COUNT(*) FROM children
WHERE classroom_id = ? AND status = 'active'
-- Should be <= classroom.max_capacity (if set)
```

---

## Summary

This ERD documentation provides:

✅ **Complete visual ERD** showing all 12 tables and relationships
✅ **18 foreign key relationships** with detailed explanations
✅ **Cardinality definitions** (1:1, 1:N, optional relationships)
✅ **ON DELETE/UPDATE behaviors** for data integrity
✅ **40+ indexes** for query optimization
✅ **Check constraints** for data validation
✅ **Common query patterns** with index usage
✅ **Business rules** enforced at database and application levels
✅ **Sample complex SQL queries** for real-world use cases

**Key Architectural Decisions:**

1. **Hierarchical Structure:** Nurseries → Branches → Classrooms
2. **Flexible Assignment:** Users can be assigned to nurseries/branches or be global (admins)
3. **Soft Delete Pattern:** `active` flags instead of hard deletes for historical data
4. **Audit Trail:** Complete logging via `audit_logs` table
5. **Security:** Login attempt tracking, refresh token management
6. **Performance:** Strategic indexing on foreign keys and frequently queried columns

**Reference Guide Usage:**

- **Developers:** Use relationship definitions when writing queries
- **Database Admins:** Follow index strategy when tuning performance
- **QA Engineers:** Validate business rules during testing
- **System Architects:** Understand data flow and dependencies

---

**Document Version:** 1.0
**Created:** 2025-01-15
**Status:** ✅ Complete
**Next Review:** After MySQL migration
