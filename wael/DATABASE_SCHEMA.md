# Database Schema & Relationships

## Overview
The Nursery Management System persists operational data in a relational MySQL schema modelled via SQLAlchemy ORM (`nursery-system/backend/app/models.py`). The schema centres around nurseries, their organisational hierarchy (branches, classrooms), enrolled children, operational records (attendance, daily reports), user accounts, and supporting subsystems (notifications, audit logging, authentication).

The database uses normalized tables with explicit foreign keys, enumerated status columns, and strategic indexes to optimise dashboard queries and filtering.

## Core Entities

### Users (`users`)
- **Purpose**: Stores credentials and profile data for all roles (admin, manager, supervisor, parent).
- **Key Columns**: `email`, `email_normalized`, `first_name`, `last_name`, `phone`, `role`, `is_active`, `hashed_password`, `temp_password`, `must_reset_password`, `nursery_id`.
- **Relationships**:
  - `nursery` → `nurseries.id` (nullable; managers/supervisors linked to a nursery).
  - `children` ← `children.parent_id` (for parent accounts).
  - `notifications` ← `notifications.user_id`.
  - Referenced by `file_assets.uploaded_by`, `refresh_tokens.user_id`, `audit_logs.user_id`.
- **Indexes**: `idx_users_role`, `idx_users_nursery` for role-based filtering and nursery scoping.

### Nurseries (`nurseries`)
- **Purpose**: Top-level organisation unit (may also represent main campus vs. branch).
- **Key Columns**: `name`, `name_normalized`, `is_branch`, `branch_name`, address fields, `min_age_days`, `max_age_months`, `phone_normalized`, `notes`, `is_active`.
- **Relationships**:
  - `users` (one-to-many) — managers and supervisors.
  - `branches` (one-to-many) — physical branches under the nursery.
  - `children` (one-to-many) — enrolled children linked for analytics.
- **Indexes**: `idx_nurseries_name_branch`, `idx_nurseries_phone` for uniqueness and lookups.

### Branches (`branches`)
- **Purpose**: Physical branches belonging to a nursery.
- **Key Columns**: `nursery_id`, `name`, address/phone metadata.
- **Relationships**:
  - `nursery` ← parent nursery.
  - `classrooms` → classrooms located in the branch.

### Classrooms (`classrooms`)
- **Purpose**: Classroom units with capacity tracking.
- **Key Columns**: `branch_id`, `name`, `capacity`.
- **Relationships**:
  - `branch` ← owning branch.
  - `children` → children assigned to the classroom.

### Children (`children`)
- **Purpose**: Student roster.
- **Key Columns**: `first_name`, `last_name`, `date_of_birth`, `gender`, `medical_info`, `emergency_contact`, `emergency_phone`, `classroom_id`, `parent_id`, `nursery_id`, `status` (`ChildStatus` enum: active, inactive, graduated).
- **Relationships**:
  - `parent` ← parent user (role `parent`).
  - `classroom` ← assigned classroom.
  - `nursery` ← owning nursery (denormalised for fast analytics).
  - `attendance_records` → `attendance`.
  - `daily_reports` → `daily_reports`.
- **Indexes**: `idx_children_parent`, `idx_children_classroom` for quick filtering.

### Attendance (`attendance`)
- **Purpose**: Daily attendance records per child.
- **Key Columns**: `child_id`, `date`, `check_in_time`, `check_out_time`, `status` (`AttendanceStatus`: present, absent, late).
- **Relationships**: `child` ← child record.
- **Indexes**: `idx_attendance_child_date` optimises range queries.

### Daily Reports (`daily_reports`)
- **Purpose**: Supervisor-submitted daily report content.
- **Key Columns**: `child_id`, `date`, `activities`, `meals`, `naps`, `mood`, `notes`; textual columns store JSON-serialised payloads.
- **Relationships**: `child` ← child record.
- **Indexes**: `idx_daily_reports_child_date` for chronological lookups.

### File Assets (`file_assets`)
- **Purpose**: Metadata about uploaded documents/media.
- **Key Columns**: `filename`, `original_filename`, `file_path`, `file_size`, `content_type`, `uploaded_by`.
- **Relationships**: Linked to uploading `User` via `uploaded_by` foreign key (no explicit SQLAlchemy relationship defined yet).

### Notifications (`notifications`)
- **Purpose**: User-scoped alerts and announcements.
- **Key Columns**: `user_id`, `title`, `message`, `type`, `is_read`, `link`, timestamps.
- **Relationships**: `user` ← receiving user.
- **Indexes**: `idx_notifications_user`, `idx_notifications_read`, `idx_notifications_created` for status filtering and chronological ordering.

### Audit Logs (`audit_logs`)
- **Purpose**: Immutable record of sensitive actions.
- **Key Columns**: `user_id`, `action`, `resource_type`, `resource_id`, `details` (JSON), `ip_address`, `user_agent`, `created_at`.
- **Relationships**: `user` ← actor (nullable for automated actions).
- **Indexes**: on user, action, resource, and creation timestamp to accelerate compliance queries.

### Authentication Tables
- **Refresh Tokens (`refresh_tokens`)**: hashed refresh tokens per user (`user_id`, `token_hash`, `revoked`, `expires_at`). Indexed on user and expiry.
- **Login Attempts (`login_attempts`)**: rate-limit support logging `email`, `ip_address`, `success`, `failure_reason`, `attempted_at`, with indexes on email/IP/timestamp.
- **Password Reset OTP (`password_reset_otps`)**: phone-based OTP storage (`phone`, `otp_hash`, `expires_at`, `attempts`, `used`), indexed for quick lookup by phone and expiry.
- **Password Reset Attempts (`password_reset_attempts`)**: audit trail of reset attempts (`phone`, `ip_address`, `user_agent`, `success`, `failure_reason`, `attempted_at`) with composite indexes by phone/timestamp and IP/timestamp.

## Enumerations
- `RoleEnum`: `admin`, `manager`, `supervisor`, `parent`.
- `AttendanceStatus`: `present`, `absent`, `late`.
- `ChildStatus`: `active`, `inactive`, `graduated`.

## Relationship Summary
```
Nursery 1 --- * Branch 1 --- * Classroom 1 --- * Child 1 --- * Attendance
                                               \
                                                \--- * DailyReport

User (parent) 1 --- * Child
User (manager/supervisor/admin) 1 --- * AuditLog
User 1 --- * Notification
User 1 --- * RefreshToken

Child 1 --- * Attendance
Child 1 --- * DailyReport
Child 1 --- * FileAsset (planned, via linking tables)
```

## Additional Considerations
- **Audit Hooks**: CRUD operations in routers call helpers (`app/audit_helper.py`) to persist structured JSON details into `audit_logs`.
- **Case-Insensitive Search**: Normalised columns (`email_normalized`, `name_normalized`, `branch_normalized`, `phone_normalized`) enable consistent filtering irrespective of user input casing.
- **Performance**: Selective `Index` definitions target frequent filters (role, nursery, date ranges). Bulk dashboard queries rely on aggregate SQL functions and join paths defined in routers.
- **Data Integrity**: SQLAlchemy relationships use `back_populates` to maintain bidirectional consistency. Foreign keys prevent orphan records (e.g., child must belong to an existing classroom and parent).
- **Extensibility**: `FileAsset` is currently metadata-only; future iterations may introduce association tables (e.g., `child_documents`, `report_attachments`). OTP models remain for potential reintroduction of SMS OTP flows.
