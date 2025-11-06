-- ============================================================================
-- Nursery Management System - Supervisor Workflow Complete Migration
-- Database: MySQL 8.0+
-- Version: 2.0.0
-- Date: 2025-11-02
-- Status: Production Ready
-- ============================================================================
-- This migration adds all required columns, constraints, indexes, and triggers
-- for complete Supervisor workflow functionality with data integrity enforcement.
-- ============================================================================

-- Set MySQL configuration for safe migrations
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET SESSION sql_notes = 0;

-- ============================================================================
-- SECTION 1: ADD MISSING COLUMNS TO daily_reports (Report Approval Workflow)
-- ============================================================================

-- Add supervisor_id to track report authorship (CRITICAL)
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS supervisor_id INT UNSIGNED NULL 
    COMMENT 'Supervisor who created the report' 
    AFTER child_id;

-- Add status to enable draft → submitted → approved/rejected workflow (CRITICAL)
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'submitted', 'approved', 'revision_needed') 
    NOT NULL DEFAULT 'draft' 
    COMMENT 'Report approval status' 
    AFTER supervisor_id;

-- Add manager_notes for revision feedback
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS manager_notes TEXT NULL 
    COMMENT 'Manager feedback when requesting revisions' 
    AFTER status;

-- Add reviewed_by to track which manager reviewed
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS reviewed_by INT UNSIGNED NULL 
    COMMENT 'Manager who reviewed/approved the report' 
    AFTER manager_notes;

-- Add reviewed_at timestamp
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS reviewed_at DATETIME NULL 
    COMMENT 'When the report was reviewed' 
    AFTER reviewed_by;

-- Add nursery_id for nursery boundary enforcement
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery the report belongs to (denormalized for performance)' 
    AFTER reviewed_at;

-- Add foreign key constraints
ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES users(id) 
    ON DELETE RESTRICT 
    ON UPDATE CASCADE;

ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_reviewer 
    FOREIGN KEY (reviewed_by) REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 2: ADD MISSING COLUMNS TO classrooms (Supervisor Assignment & Age Validation)
-- ============================================================================

-- Add supervisor_id to assign supervisor to classroom (CRITICAL)
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS supervisor_id INT UNSIGNED NULL 
    COMMENT 'Assigned supervisor for this classroom' 
    AFTER capacity;

-- Add min_age_days for age validation (CRITICAL)
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS min_age_days INT UNSIGNED DEFAULT 0 
    COMMENT 'Minimum age in days (0 = newborn)' 
    AFTER supervisor_id;

-- Add max_age_months for age validation (CRITICAL)
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS max_age_months INT UNSIGNED DEFAULT 60 
    COMMENT 'Maximum age in months (60 = 5 years)' 
    AFTER min_age_days;

-- Add is_active status flag
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE 
    COMMENT 'Whether classroom accepts new enrollments' 
    AFTER max_age_months;

-- Add nursery_id for direct nursery boundary checks (denormalized)
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery the classroom belongs to (denormalized for performance)' 
    AFTER is_active;

-- Add foreign key for supervisor
ALTER TABLE classrooms
ADD CONSTRAINT IF NOT EXISTS fk_classrooms_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Add foreign key for nursery
ALTER TABLE classrooms
ADD CONSTRAINT IF NOT EXISTS fk_classrooms_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 3: ADD MISSING COLUMNS TO users (Branch Assignment)
-- ============================================================================

-- Add branch_id for supervisor assignment to specific branches
ALTER TABLE users
ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL 
    COMMENT 'Assigned branch for supervisors/managers' 
    AFTER nursery_id;

-- Add classroom_id for supervisor assignment (denormalized)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS classroom_id INT UNSIGNED NULL 
    COMMENT 'Primary classroom for supervisors (can have multiple via classrooms.supervisor_id)' 
    AFTER branch_id;

-- Add last_login tracking
ALTER TABLE users
ADD COLUMN IF NOT EXISTS last_login DATETIME NULL 
    COMMENT 'Last successful login timestamp' 
    AFTER is_active;

-- Add temp_password for initial account setup
ALTER TABLE users
ADD COLUMN IF NOT EXISTS temp_password VARCHAR(255) NULL 
    COMMENT 'Temporary password shown once after creation' 
    AFTER last_login;

-- Add foreign key for branch
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS fk_users_branch 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- Add foreign key for classroom
ALTER TABLE users
ADD CONSTRAINT IF NOT EXISTS fk_users_classroom 
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 4: ADD MISSING COLUMNS TO branches
-- ============================================================================

-- Add is_active status flag
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE 
    COMMENT 'Whether branch is operational' 
    AFTER nursery_id;

-- Add max_capacity for branch-level planning
ALTER TABLE branches
ADD COLUMN IF NOT EXISTS max_capacity INT UNSIGNED NULL 
    COMMENT 'Maximum children capacity across all classrooms' 
    AFTER is_active;

-- ============================================================================
-- SECTION 5: ADD MISSING COLUMNS TO attendance (Notes & Nursery Boundary)
-- ============================================================================

-- Add notes field for attendance context
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS notes TEXT NULL 
    COMMENT 'Additional notes (illness, late reason, pickup person, etc.)' 
    AFTER check_out_time;

-- Add nursery_id for nursery boundary enforcement
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery the attendance belongs to (denormalized for performance)' 
    AFTER notes;

-- Add classroom_id for classroom filtering
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS classroom_id INT UNSIGNED NULL 
    COMMENT 'Classroom the attendance belongs to (denormalized for performance)' 
    AFTER nursery_id;

-- Add picked_by for checkout tracking
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS picked_by VARCHAR(100) NULL 
    COMMENT 'Name and relationship of pickup person' 
    AFTER classroom_id;

-- Add foreign keys
ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS fk_attendance_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS fk_attendance_classroom 
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 6: ADD MISSING COLUMNS TO notifications (Nursery Scoping & Broadcast)
-- ============================================================================

-- Add nursery_id for nursery-scoped notifications (CRITICAL)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery scope for notification (NULL = system-wide admin notification)' 
    AFTER user_id;

-- Add target_role for broadcast notifications (CRITICAL)
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_role ENUM('admin', 'manager', 'supervisor', 'parent') NULL 
    COMMENT 'Target role for broadcast notifications (NULL = single user)' 
    AFTER nursery_id;

-- Add sender_id to track who sent the notification
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS sender_id INT UNSIGNED NULL 
    COMMENT 'User who sent the notification' 
    AFTER target_role;

-- Add priority level
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS priority ENUM('low', 'normal', 'high', 'emergency') NOT NULL DEFAULT 'normal' 
    COMMENT 'Notification priority level' 
    AFTER sender_id;

-- Add foreign keys
ALTER TABLE notifications
ADD CONSTRAINT IF NOT EXISTS fk_notifications_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

ALTER TABLE notifications
ADD CONSTRAINT IF NOT EXISTS fk_notifications_sender 
    FOREIGN KEY (sender_id) REFERENCES users(id) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 7: ADD UNIQUE CONSTRAINTS FOR DATA INTEGRITY
-- ============================================================================

-- Ensure one attendance record per child per day
ALTER TABLE attendance
ADD UNIQUE INDEX IF NOT EXISTS uk_attendance_child_date (child_id, date);

-- Ensure one daily report per child per day
ALTER TABLE daily_reports
ADD UNIQUE INDEX IF NOT EXISTS uk_daily_reports_child_date (child_id, date);

-- Ensure unique classroom names within a branch
ALTER TABLE classrooms
ADD UNIQUE INDEX IF NOT EXISTS uk_classrooms_branch_name (branch_id, name);

-- Ensure unique branch names within a nursery
ALTER TABLE branches
ADD UNIQUE INDEX IF NOT EXISTS uk_branches_nursery_name (nursery_id, name);

-- ============================================================================
-- SECTION 8: ADD CHECK CONSTRAINTS FOR BUSINESS RULES
-- ============================================================================

-- Classroom capacity must be positive
ALTER TABLE classrooms
ADD CONSTRAINT IF NOT EXISTS chk_classrooms_capacity_positive 
    CHECK (capacity > 0);

-- Age range must be logical
ALTER TABLE classrooms
ADD CONSTRAINT IF NOT EXISTS chk_classrooms_age_range_valid 
    CHECK (min_age_days >= 0 AND max_age_months > 0 AND max_age_months <= 72);

-- Child date of birth must be in the past
ALTER TABLE children
ADD CONSTRAINT IF NOT EXISTS chk_children_dob_past 
    CHECK (date_of_birth < CURRENT_DATE);

-- Check-out time must be after check-in time (when both exist)
ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS chk_attendance_times_logical 
    CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time > check_in_time);

-- Branch capacity must be positive if set
ALTER TABLE branches
ADD CONSTRAINT IF NOT EXISTS chk_branches_capacity_positive 
    CHECK (max_capacity IS NULL OR max_capacity > 0);

-- Report status transitions must be valid
ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS chk_daily_reports_status_valid 
    CHECK (status IN ('draft', 'submitted', 'approved', 'revision_needed'));

-- ============================================================================
-- SECTION 9: ADD COMPOSITE INDEXES FOR SUPERVISOR PERFORMANCE
-- ============================================================================

-- Supervisor children list: children by nursery, classroom, status
CREATE INDEX IF NOT EXISTS idx_children_nursery_classroom_status 
    ON children(nursery_id, classroom_id, status);

-- Supervisor attendance list: attendance by nursery, classroom, date
CREATE INDEX IF NOT EXISTS idx_attendance_nursery_classroom_date 
    ON attendance(nursery_id, classroom_id, date DESC);

-- Supervisor reports list: daily reports by nursery, classroom, date, status
CREATE INDEX IF NOT EXISTS idx_daily_reports_nursery_classroom_date_status 
    ON daily_reports(nursery_id, classroom_id, date DESC, status);

-- Supervisor dashboard: children by classroom
CREATE INDEX IF NOT EXISTS idx_children_classroom_status_active 
    ON children(classroom_id, status);

-- Manager approval queue: reports by nursery, status, date
CREATE INDEX IF NOT EXISTS idx_daily_reports_nursery_status_date 
    ON daily_reports(nursery_id, status, date DESC);

-- Notifications filtering by nursery, role, and read status
CREATE INDEX IF NOT EXISTS idx_notifications_nursery_user_read_created 
    ON notifications(nursery_id, user_id, is_read, created_at DESC);

-- Supervisor performance tracking: reports by supervisor, status
CREATE INDEX IF NOT EXISTS idx_daily_reports_supervisor_status_date 
    ON daily_reports(supervisor_id, status, date DESC);

-- Classroom ownership lookup
CREATE INDEX IF NOT EXISTS idx_classrooms_supervisor_active 
    ON classrooms(supervisor_id, is_active);

-- Attendance today lookup (hot query)
CREATE INDEX IF NOT EXISTS idx_attendance_date_status 
    ON attendance(date DESC, status);

-- User role and nursery lookup
CREATE INDEX IF NOT EXISTS idx_users_nursery_role_active 
    ON users(nursery_id, role, is_active);

-- Branch active classrooms
CREATE INDEX IF NOT EXISTS idx_classrooms_branch_nursery_active 
    ON classrooms(branch_id, nursery_id, is_active);

-- Audit logs by user and resource
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_resource_action_created 
    ON audit_logs(user_id, resource_type, action, created_at DESC);

-- ============================================================================
-- SECTION 10: CREATE TRIGGERS FOR CAPACITY ENFORCEMENT
-- ============================================================================

DELIMITER $$

-- Trigger: Prevent over-enrollment when inserting children
DROP TRIGGER IF EXISTS trg_children_before_insert_capacity_check$$
CREATE TRIGGER trg_children_before_insert_capacity_check
BEFORE INSERT ON children
FOR EACH ROW
BEGIN
    DECLARE current_enrollment INT;
    DECLARE classroom_capacity INT;
    DECLARE classroom_active BOOLEAN;
    
    -- Get classroom capacity and status
    SELECT capacity, is_active 
    INTO classroom_capacity, classroom_active
    FROM classrooms 
    WHERE id = NEW.classroom_id;
    
    -- Check if classroom exists
    IF classroom_capacity IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Classroom does not exist';
    END IF;
    
    -- Check if classroom is active
    IF NOT classroom_active THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Classroom is not accepting enrollments';
    END IF;
    
    -- Get current enrollment count (only active children)
    SELECT COUNT(*) INTO current_enrollment
    FROM children 
    WHERE classroom_id = NEW.classroom_id 
      AND status = 'active';
    
    -- Check capacity
    IF current_enrollment >= classroom_capacity THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Classroom capacity exceeded. Cannot enroll child.';
    END IF;
END$$

-- Trigger: Prevent over-enrollment when updating child's classroom
DROP TRIGGER IF EXISTS trg_children_before_update_capacity_check$$
CREATE TRIGGER trg_children_before_update_capacity_check
BEFORE UPDATE ON children
FOR EACH ROW
BEGIN
    DECLARE current_enrollment INT;
    DECLARE classroom_capacity INT;
    DECLARE classroom_active BOOLEAN;
    
    -- Only check if classroom is changing and child is becoming active
    IF NEW.classroom_id != OLD.classroom_id OR (NEW.status = 'active' AND OLD.status != 'active') THEN
        -- Get new classroom capacity and status
        SELECT capacity, is_active 
        INTO classroom_capacity, classroom_active
        FROM classrooms 
        WHERE id = NEW.classroom_id;
        
        -- Check if classroom is active
        IF NOT classroom_active THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Classroom is not accepting enrollments';
        END IF;
        
        -- Get current enrollment count (exclude the child being updated)
        SELECT COUNT(*) INTO current_enrollment
        FROM children 
        WHERE classroom_id = NEW.classroom_id 
          AND status = 'active'
          AND id != NEW.id;
        
        -- Check capacity
        IF current_enrollment >= classroom_capacity THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Classroom capacity exceeded. Cannot transfer child.';
        END IF;
    END IF;
END$$

-- ============================================================================
-- SECTION 11: CREATE TRIGGERS FOR AGE VALIDATION
-- ============================================================================

-- Trigger: Validate child age fits classroom age range on insert
DROP TRIGGER IF EXISTS trg_children_before_insert_age_check$$
CREATE TRIGGER trg_children_before_insert_age_check
BEFORE INSERT ON children
FOR EACH ROW
BEGIN
    DECLARE min_age_days_req INT;
    DECLARE max_age_months_req INT;
    DECLARE child_age_days INT;
    DECLARE child_age_months INT;
    
    -- Get classroom age requirements
    SELECT min_age_days, max_age_months 
    INTO min_age_days_req, max_age_months_req
    FROM classrooms 
    WHERE id = NEW.classroom_id;
    
    -- Calculate child's age
    SET child_age_days = DATEDIFF(CURDATE(), NEW.date_of_birth);
    SET child_age_months = TIMESTAMPDIFF(MONTH, NEW.date_of_birth, CURDATE());
    
    -- Validate age range
    IF child_age_days < min_age_days_req THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Child is too young for this classroom';
    END IF;
    
    IF child_age_months > max_age_months_req THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Child is too old for this classroom';
    END IF;
END$$

-- Trigger: Validate child age fits classroom age range on update
DROP TRIGGER IF EXISTS trg_children_before_update_age_check$$
CREATE TRIGGER trg_children_before_update_age_check
BEFORE UPDATE ON children
FOR EACH ROW
BEGIN
    DECLARE min_age_days_req INT;
    DECLARE max_age_months_req INT;
    DECLARE child_age_days INT;
    DECLARE child_age_months INT;
    
    -- Only check if classroom is changing
    IF NEW.classroom_id != OLD.classroom_id THEN
        -- Get new classroom age requirements
        SELECT min_age_days, max_age_months 
        INTO min_age_days_req, max_age_months_req
        FROM classrooms 
        WHERE id = NEW.classroom_id;
        
        -- Calculate child's age
        SET child_age_days = DATEDIFF(CURDATE(), NEW.date_of_birth);
        SET child_age_months = TIMESTAMPDIFF(MONTH, NEW.date_of_birth, CURDATE());
        
        -- Validate age range
        IF child_age_days < min_age_days_req THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Child is too young for this classroom';
        END IF;
        
        IF child_age_months > max_age_months_req THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Child is too old for this classroom';
        END IF;
    END IF;
END$$

-- ============================================================================
-- SECTION 12: CREATE TRIGGER FOR REPORT STATUS DEFAULTS
-- ============================================================================

-- Trigger: Set default status and supervisor_id on report creation
DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_defaults$$
CREATE TRIGGER trg_daily_reports_before_insert_defaults
BEFORE INSERT ON daily_reports
FOR EACH ROW
BEGIN
    -- Ensure status defaults to 'draft'
    IF NEW.status IS NULL THEN
        SET NEW.status = 'draft';
    END IF;
    
    -- Set nursery_id from child's nursery (denormalized for performance)
    IF NEW.nursery_id IS NULL THEN
        SELECT nursery_id INTO NEW.nursery_id
        FROM children
        WHERE id = NEW.child_id;
    END IF;
END$$

-- Trigger: Validate status transitions on update
DROP TRIGGER IF EXISTS trg_daily_reports_before_update_status_check$$
CREATE TRIGGER trg_daily_reports_before_update_status_check
BEFORE UPDATE ON daily_reports
FOR EACH ROW
BEGIN
    -- Validate status transitions
    -- draft → submitted (supervisor submits)
    -- submitted → approved (manager approves)
    -- submitted → revision_needed (manager requests changes)
    -- revision_needed → submitted (supervisor resubmits)
    
    IF OLD.status != NEW.status THEN
        -- draft can only go to submitted
        IF OLD.status = 'draft' AND NEW.status NOT IN ('draft', 'submitted') THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid status transition: draft can only be submitted';
        END IF;
        
        -- submitted can only go to approved or revision_needed
        IF OLD.status = 'submitted' AND NEW.status NOT IN ('submitted', 'approved', 'revision_needed') THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid status transition: submitted can only be approved or sent for revision';
        END IF;
        
        -- revision_needed can only go back to submitted
        IF OLD.status = 'revision_needed' AND NEW.status NOT IN ('revision_needed', 'submitted') THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Invalid status transition: revision_needed can only be resubmitted';
        END IF;
        
        -- approved cannot be changed
        IF OLD.status = 'approved' THEN
            SIGNAL SQLSTATE '45000' 
            SET MESSAGE_TEXT = 'Cannot modify approved report status';
        END IF;
    END IF;
END$$

DELIMITER ;

-- ============================================================================
-- SECTION 13: CREATE STORED PROCEDURES FOR SUPERVISOR OPERATIONS
-- ============================================================================

DELIMITER $$

-- Procedure: Get classroom capacity statistics
DROP PROCEDURE IF EXISTS sp_get_classroom_capacity_stats$$
CREATE PROCEDURE sp_get_classroom_capacity_stats(IN p_nursery_id INT)
BEGIN
    SELECT 
        cl.id AS classroom_id,
        cl.name AS classroom_name,
        cl.capacity,
        COUNT(CASE WHEN c.status = 'active' THEN 1 END) AS current_enrollment,
        cl.capacity - COUNT(CASE WHEN c.status = 'active' THEN 1 END) AS available_spaces,
        ROUND((COUNT(CASE WHEN c.status = 'active' THEN 1 END) / cl.capacity) * 100, 1) AS occupancy_rate,
        CONCAT(u.first_name, ' ', u.last_name) AS supervisor_name,
        cl.is_active
    FROM classrooms cl
    LEFT JOIN children c ON cl.id = c.classroom_id
    LEFT JOIN users u ON cl.supervisor_id = u.id
    WHERE cl.nursery_id = p_nursery_id
    GROUP BY cl.id, cl.name, cl.capacity, cl.is_active, u.first_name, u.last_name
    ORDER BY occupancy_rate DESC;
END$$

-- Procedure: Get supervisor performance metrics
DROP PROCEDURE IF EXISTS sp_get_supervisor_performance$$
CREATE PROCEDURE sp_get_supervisor_performance(
    IN p_supervisor_id INT,
    IN p_date_from DATE,
    IN p_date_to DATE
)
BEGIN
    SELECT 
        u.id AS supervisor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS supervisor_name,
        COUNT(DISTINCT dr.id) AS total_reports,
        COUNT(DISTINCT CASE WHEN dr.status = 'approved' THEN dr.id END) AS approved_reports,
        COUNT(DISTINCT CASE WHEN dr.status = 'revision_needed' THEN dr.id END) AS revision_requests,
        COUNT(DISTINCT CASE WHEN dr.status = 'submitted' THEN dr.id END) AS pending_reports,
        ROUND(COUNT(DISTINCT CASE WHEN dr.status = 'approved' THEN dr.id END) / 
              NULLIF(COUNT(DISTINCT dr.id), 0) * 100, 1) AS approval_rate,
        COUNT(DISTINCT a.id) AS attendance_records,
        COUNT(DISTINCT c.id) AS children_count
    FROM users u
    LEFT JOIN daily_reports dr ON u.id = dr.supervisor_id 
        AND dr.date BETWEEN p_date_from AND p_date_to
    LEFT JOIN classrooms cl ON u.id = cl.supervisor_id
    LEFT JOIN children c ON cl.id = c.classroom_id AND c.status = 'active'
    LEFT JOIN attendance a ON c.id = a.child_id 
        AND a.date BETWEEN p_date_from AND p_date_to
    WHERE u.id = p_supervisor_id
    GROUP BY u.id, u.first_name, u.last_name;
END$$

-- Procedure: Get today's attendance summary for supervisor
DROP PROCEDURE IF EXISTS sp_get_today_attendance_summary$$
CREATE PROCEDURE sp_get_today_attendance_summary(IN p_supervisor_id INT)
BEGIN
    DECLARE p_today DATE DEFAULT CURDATE();
    
    SELECT 
        cl.id AS classroom_id,
        cl.name AS classroom_name,
        COUNT(c.id) AS total_children,
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) AS present,
        COUNT(CASE WHEN a.status = 'absent' THEN 1 END) AS absent,
        COUNT(CASE WHEN a.status = 'late' THEN 1 END) AS late,
        COUNT(CASE WHEN a.id IS NULL THEN 1 END) AS not_recorded,
        ROUND(COUNT(CASE WHEN a.status = 'present' THEN 1 END) / 
              NULLIF(COUNT(c.id), 0) * 100, 1) AS attendance_rate
    FROM classrooms cl
    LEFT JOIN children c ON cl.id = c.classroom_id AND c.status = 'active'
    LEFT JOIN attendance a ON c.id = a.child_id AND a.date = p_today
    WHERE cl.supervisor_id = p_supervisor_id
    GROUP BY cl.id, cl.name
    ORDER BY cl.name;
END$$

DELIMITER ;

-- ============================================================================
-- SECTION 14: BACKFILL EXISTING DATA
-- ============================================================================

-- Backfill nursery_id in classrooms from branch
UPDATE classrooms cl
JOIN branches b ON cl.branch_id = b.id
SET cl.nursery_id = b.nursery_id
WHERE cl.nursery_id IS NULL;

-- Backfill nursery_id in daily_reports from children
UPDATE daily_reports dr
JOIN children c ON dr.child_id = c.id
SET dr.nursery_id = c.nursery_id
WHERE dr.nursery_id IS NULL;

-- Backfill nursery_id in attendance from children
UPDATE attendance a
JOIN children c ON a.child_id = c.id
SET a.nursery_id = c.nursery_id
WHERE a.nursery_id IS NULL;

-- Backfill classroom_id in attendance from children
UPDATE attendance a
JOIN children c ON a.child_id = c.id
SET a.classroom_id = c.classroom_id
WHERE a.classroom_id IS NULL;

-- Backfill supervisor_id in daily_reports (set to classroom supervisor if available)
UPDATE daily_reports dr
JOIN children c ON dr.child_id = c.id
JOIN classrooms cl ON c.classroom_id = cl.id
SET dr.supervisor_id = cl.supervisor_id
WHERE dr.supervisor_id IS NULL AND cl.supervisor_id IS NOT NULL;

-- Backfill status for existing reports (set all to 'approved' since they're historical)
UPDATE daily_reports
SET status = 'approved'
WHERE status IS NULL OR status = 'draft';

-- Backfill nursery_id in notifications from users
UPDATE notifications n
JOIN users u ON n.user_id = u.id
SET n.nursery_id = u.nursery_id
WHERE n.nursery_id IS NULL AND u.nursery_id IS NOT NULL;

-- ============================================================================
-- SECTION 15: VERIFY MIGRATION
-- ============================================================================

-- Verify all columns exist
SELECT 
    'daily_reports' AS table_name,
    COUNT(CASE WHEN COLUMN_NAME = 'supervisor_id' THEN 1 END) AS supervisor_id,
    COUNT(CASE WHEN COLUMN_NAME = 'status' THEN 1 END) AS status,
    COUNT(CASE WHEN COLUMN_NAME = 'manager_notes' THEN 1 END) AS manager_notes,
    COUNT(CASE WHEN COLUMN_NAME = 'reviewed_by' THEN 1 END) AS reviewed_by,
    COUNT(CASE WHEN COLUMN_NAME = 'reviewed_at' THEN 1 END) AS reviewed_at,
    COUNT(CASE WHEN COLUMN_NAME = 'nursery_id' THEN 1 END) AS nursery_id
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'daily_reports'

UNION ALL

SELECT 
    'classrooms',
    COUNT(CASE WHEN COLUMN_NAME = 'supervisor_id' THEN 1 END),
    COUNT(CASE WHEN COLUMN_NAME = 'min_age_days' THEN 1 END),
    COUNT(CASE WHEN COLUMN_NAME = 'max_age_months' THEN 1 END),
    COUNT(CASE WHEN COLUMN_NAME = 'is_active' THEN 1 END),
    COUNT(CASE WHEN COLUMN_NAME = 'nursery_id' THEN 1 END),
    0
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'classrooms';

-- Verify all triggers exist
SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE
FROM INFORMATION_SCHEMA.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND TRIGGER_NAME LIKE 'trg_%'
ORDER BY TRIGGER_NAME;

-- Verify all indexes exist
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND INDEX_NAME LIKE 'idx_%'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- ROLLBACK SCRIPT (USE ONLY IF MIGRATION FAILS)
-- ============================================================================

/*

-- WARNING: This will remove all added columns, constraints, and triggers
-- Only use this if you need to completely rollback the migration

SET FOREIGN_KEY_CHECKS = 0;

-- Remove triggers
DROP TRIGGER IF EXISTS trg_children_before_insert_capacity_check;
DROP TRIGGER IF EXISTS trg_children_before_update_capacity_check;
DROP TRIGGER IF EXISTS trg_children_before_insert_age_check;
DROP TRIGGER IF EXISTS trg_children_before_update_age_check;
DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_defaults;
DROP TRIGGER IF EXISTS trg_daily_reports_before_update_status_check;

-- Remove stored procedures
DROP PROCEDURE IF EXISTS sp_get_classroom_capacity_stats;
DROP PROCEDURE IF EXISTS sp_get_supervisor_performance;
DROP PROCEDURE IF EXISTS sp_get_today_attendance_summary;

-- Remove indexes
DROP INDEX IF EXISTS idx_children_nursery_classroom_status ON children;
DROP INDEX IF EXISTS idx_attendance_nursery_classroom_date ON attendance;
DROP INDEX IF EXISTS idx_daily_reports_nursery_classroom_date_status ON daily_reports;
DROP INDEX IF EXISTS idx_children_classroom_status_active ON children;
DROP INDEX IF EXISTS idx_daily_reports_nursery_status_date ON daily_reports;
DROP INDEX IF EXISTS idx_notifications_nursery_user_read_created ON notifications;
DROP INDEX IF EXISTS idx_daily_reports_supervisor_status_date ON daily_reports;
DROP INDEX IF EXISTS idx_classrooms_supervisor_active ON classrooms;
DROP INDEX IF EXISTS idx_attendance_date_status ON attendance;
DROP INDEX IF EXISTS idx_users_nursery_role_active ON users;
DROP INDEX IF EXISTS idx_classrooms_branch_nursery_active ON classrooms;
DROP INDEX IF EXISTS idx_audit_logs_user_resource_action_created ON audit_logs;

-- Remove unique constraints
DROP INDEX IF EXISTS uk_attendance_child_date ON attendance;
DROP INDEX IF EXISTS uk_daily_reports_child_date ON daily_reports;
DROP INDEX IF EXISTS uk_classrooms_branch_name ON classrooms;
DROP INDEX IF EXISTS uk_branches_nursery_name ON branches;

-- Remove foreign keys
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_supervisor;
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_reviewer;
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_nursery;
ALTER TABLE classrooms DROP FOREIGN KEY IF EXISTS fk_classrooms_supervisor;
ALTER TABLE classrooms DROP FOREIGN KEY IF EXISTS fk_classrooms_nursery;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_branch;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_classroom;
ALTER TABLE attendance DROP FOREIGN KEY IF EXISTS fk_attendance_nursery;
ALTER TABLE attendance DROP FOREIGN KEY IF EXISTS fk_attendance_classroom;
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS fk_notifications_nursery;
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS fk_notifications_sender;

-- Remove check constraints
ALTER TABLE classrooms DROP CHECK IF EXISTS chk_classrooms_capacity_positive;
ALTER TABLE classrooms DROP CHECK IF EXISTS chk_classrooms_age_range_valid;
ALTER TABLE children DROP CHECK IF EXISTS chk_children_dob_past;
ALTER TABLE attendance DROP CHECK IF EXISTS chk_attendance_times_logical;
ALTER TABLE branches DROP CHECK IF EXISTS chk_branches_capacity_positive;
ALTER TABLE daily_reports DROP CHECK IF EXISTS chk_daily_reports_status_valid;

-- Remove columns from daily_reports
ALTER TABLE daily_reports DROP COLUMN IF EXISTS nursery_id;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS manager_notes;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS status;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS supervisor_id;

-- Remove columns from classrooms
ALTER TABLE classrooms DROP COLUMN IF EXISTS nursery_id;
ALTER TABLE classrooms DROP COLUMN IF EXISTS is_active;
ALTER TABLE classrooms DROP COLUMN IF EXISTS max_age_months;
ALTER TABLE classrooms DROP COLUMN IF EXISTS min_age_days;
ALTER TABLE classrooms DROP COLUMN IF EXISTS supervisor_id;

-- Remove columns from users
ALTER TABLE users DROP COLUMN IF EXISTS temp_password;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS classroom_id;
ALTER TABLE users DROP COLUMN IF EXISTS branch_id;

-- Remove columns from branches
ALTER TABLE branches DROP COLUMN IF EXISTS max_capacity;
ALTER TABLE branches DROP COLUMN IF EXISTS is_active;

-- Remove columns from attendance
ALTER TABLE attendance DROP COLUMN IF EXISTS picked_by;
ALTER TABLE attendance DROP COLUMN IF EXISTS classroom_id;
ALTER TABLE attendance DROP COLUMN IF EXISTS nursery_id;
ALTER TABLE attendance DROP COLUMN IF EXISTS notes;

-- Remove columns from notifications
ALTER TABLE notifications DROP COLUMN IF EXISTS priority;
ALTER TABLE notifications DROP COLUMN IF EXISTS sender_id;
ALTER TABLE notifications DROP COLUMN IF EXISTS target_role;
ALTER TABLE notifications DROP COLUMN IF EXISTS nursery_id;

SET FOREIGN_KEY_CHECKS = 1;

*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;
SET SESSION sql_notes = 1;

SELECT 'Migration completed successfully!' AS status;
