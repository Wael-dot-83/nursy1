-- Phase 2 Schema Updates
-- Fixes 5 critical gaps: supervisor scoping, manager CRUD, validations, audit logging

-- 1. CREATE SUPERVISORS_CLASSROOMS JOIN TABLE
CREATE TABLE IF NOT EXISTS supervisors_classrooms (
    supervisor_id INTEGER NOT NULL,
    classroom_id INTEGER NOT NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (supervisor_id, classroom_id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE CASCADE
);

CREATE INDEX idx_supervisors_classrooms_supervisor ON supervisors_classrooms(supervisor_id);
CREATE INDEX idx_supervisors_classrooms_classroom ON supervisors_classrooms(classroom_id);

-- 2. ADD MISSING CHILD FIELDS
ALTER TABLE children ADD COLUMN IF NOT EXISTS second_name VARCHAR(50);
ALTER TABLE children ADD COLUMN IF NOT EXISTS nationality VARCHAR(100);
ALTER TABLE children ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);
ALTER TABLE children ADD COLUMN IF NOT EXISTS passport_no VARCHAR(50);

CREATE INDEX idx_children_nationality ON children(nationality);

-- 3. ADD MISSING DAILY_REPORT FIELDS
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS manager_feedback TEXT;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS reviewed_by INTEGER;
ALTER TABLE daily_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;

CREATE INDEX idx_daily_reports_status ON daily_reports(status);

-- 4. ADD MISSING USER FIELDS
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100) UNIQUE;

CREATE INDEX idx_users_username ON users(username);

-- 5. ADD CORRELATION_ID TO AUDIT_LOGS
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS correlation_id VARCHAR(100);

CREATE INDEX idx_audit_logs_correlation ON audit_logs(correlation_id);
