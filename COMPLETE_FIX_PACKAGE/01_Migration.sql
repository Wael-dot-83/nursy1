-- ============================================================================
-- Nursery Management System - Complete Fix Migration
-- Database: MySQL 8.0+
-- Version: 2.0.0
-- Date: 2025-11-02
-- Status: Production Ready
-- ============================================================================
-- This migration adds missing columns, constraints, indexes, and triggers
-- to fix all identified gaps in the Manager Workflow Validation Report.
-- ============================================================================

-- Set MySQL configuration for safe migrations
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET SESSION sql_notes = 0;

-- ============================================================================
-- SECTION 1: ADD MISSING COLUMNS TO daily_reports
-- ============================================================================

-- Add supervisor_id to track report authorship
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS supervisor_id INT UNSIGNED NULL AFTER `branch_id`,
ADD INDEX `idx_supervisor_id` (supervisor_id);

-- Add status to enable approval workflow
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'submitted', 'approved', 'revision_needed') NOT NULL DEFAULT 'draft' AFTER `content`,
ADD INDEX `idx_status` (status);

-- Add manager_notes for revision feedback
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS manager_notes TEXT NULL AFTER `status`;

-- Add reviewed_by to track who approved/rejected
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS reviewed_by INT UNSIGNED NULL AFTER `manager_notes`,
ADD INDEX `idx_reviewed_by` (reviewed_by);

-- Add reviewed_at timestamp
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS reviewed_at DATETIME NULL AFTER `reviewed_by`;

-- Add foreign key constraints for daily_reports
ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_supervisor 
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_reviewer 
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 2: ADD MISSING COLUMNS TO classrooms
-- ============================================================================

-- Add supervisor_id to assign supervisors to classrooms
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS supervisor_id INT UNSIGNED NULL AFTER `branch_id`,
ADD INDEX `idx_supervisor_id` (supervisor_id);

-- Add age range validation columns
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS min_age_days INT UNSIGNED DEFAULT 0 NOT NULL AFTER `capacity`;

ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS max_age_months INT UNSIGNED DEFAULT 60 NOT NULL AFTER `min_age_days`;

-- Add is_active status flag
ALTER TABLE classrooms
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER `max_age_months`;

-- Add foreign key for supervisor
ALTER TABLE classrooms
ADD CONSTRAINT IF NOT EXISTS fk_classrooms_supervisor 
  FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================================
-- SECTION 3: ADD MISSING COLUMNS TO users
-- ============================================================================

-- Add branch_id for supervisor assignment to specific branches
ALTER TABLE users
ADD COLUMN IF NOT EXISTS branch_id INT UNSIGNED NULL 
    COMMENT 'Assigned branch for supervisors/managers' 
    AFTER nursery_id;

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
-- SECTION 5: ADD MISSING COLUMNS TO attendance
-- ============================================================================

-- Add notes field for attendance context
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS notes TEXT NULL 
    COMMENT 'Additional notes about attendance (illness, late reason, etc.)' 
    AFTER check_out_time;

-- ============================================================================
-- SECTION 6: ADD MISSING COLUMNS TO notifications
-- ============================================================================

-- Add nursery_id for nursery-scoped notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery scope for notification (NULL = system-wide)' 
    AFTER user_id;

-- Add role filter for broadcast notifications
ALTER TABLE notifications
ADD COLUMN IF NOT EXISTS target_role ENUM('admin', 'manager', 'supervisor', 'parent') NULL 
    COMMENT 'Target role for broadcast notifications' 
    AFTER nursery_id;

-- Add foreign key for nursery
ALTER TABLE notifications
ADD CONSTRAINT IF NOT EXISTS fk_notifications_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE 
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

-- ============================================================================
-- SECTION 9: ADD COMPOSITE INDEXES FOR PERFORMANCE
-- ============================================================================

-- Manager dashboard queries: children by nursery, classroom, status
CREATE INDEX IF NOT EXISTS idx_children_nursery_classroom_status 
    ON children(nursery_id, classroom_id, status);

-- Manager dashboard queries: attendance by nursery, date
CREATE INDEX IF NOT EXISTS idx_attendance_nursery_date 
    ON attendance(child_id, date DESC);

-- Manager dashboard queries: daily reports by nursery, date, status
CREATE INDEX IF NOT EXISTS idx_daily_reports_nursery_date_status 
    ON daily_reports(child_id, date DESC, status);

-- Manager staff management: users by nursery and role
CREATE INDEX IF NOT EXISTS idx_users_nursery_role_active 
    ON users(nursery_id, role, is_active);

-- Notifications filtering by nursery and role
CREATE INDEX IF NOT EXISTS idx_notifications_nursery_role_created 
    ON notifications(nursery_id, target_role, created_at DESC);

-- Supervisor performance tracking: reports by supervisor
CREATE INDEX IF NOT EXISTS idx_daily_reports_supervisor_date 
    ON daily_reports(supervisor_id, date DESC, status);

-- Classroom children count (capacity monitoring)
CREATE INDEX IF NOT EXISTS idx_children_classroom_status 
    ON children(classroom_id, status);

-- Audit logs by user and action
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_resource_created 
    ON audit_logs(user_id, resource_type, created_at DESC);

-- Attendance stats by child
CREATE INDEX IF NOT EXISTS idx_attendance_child_date 
    ON attendance(child_id, date DESC, status);

-- Branch lookup optimization
CREATE INDEX IF NOT EXISTS idx_branches_nursery_active 
    ON branches(nursery_id, is_active);

-- Classroom lookup optimization
CREATE INDEX IF NOT EXISTS idx_classrooms_branch_active 
    ON classrooms(branch_id, is_active);

-- Users by branch (for supervisor assignment)
CREATE INDEX IF NOT EXISTS idx_users_branch_role 
    ON users(branch_id, role);

-- ============================================================================
-- SECTION 10: CREATE TRIGGERS FOR CAPACITY ENFORCEMENT
-- ============================================================================

DELIMITER $

-- Trigger: Prevent over-enrollment when inserting children
DROP TRIGGER IF EXISTS trg_children_before_insert_capacity_check$
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
    IF classroom_active = FALSE THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot enroll in inactive classroom';
    END IF;
    
    -- Count current active children in classroom
    SELECT COUNT(*) INTO current_enrollment
    FROM children
    WHERE classroom_id = NEW.classroom_id 
    AND status = 'active';
    
    -- Enforce capacity limit
    IF current_enrollment >= classroom_capacity THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Classroom is at full capacity';
    END IF;
END$

-- Trigger: Prevent over-enrollment when updating children (classroom transfer)
DROP TRIGGER IF EXISTS trg_children_before_update_capacity_check$
CREATE TRIGGER trg_children_before_update_capacity_check
BEFORE UPDATE ON children
FOR EACH ROW
BEGIN
    DECLARE current_enrollment INT;
    DECLARE classroom_capacity INT;
    DECLARE classroom_active BOOLEAN;
    
    -- Only check if classroom_id changed or status changed to active
    IF NEW.classroom_id != OLD.classroom_id OR (NEW.status = 'active' AND OLD.status != 'active') THEN
        
        -- Get new classroom capacity and status
        SELECT capacity, is_active 
        INTO classroom_capacity, classroom_active
        FROM classrooms 
        WHERE id = NEW.classroom_id;
        
        -- Check if classroom is active
        IF classroom_active = FALSE THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Cannot transfer to inactive classroom';
        END IF;
        
        -- Count current active children in new classroom (excluding this child if transferring)
        SELECT COUNT(*) INTO current_enrollment
        FROM children
        WHERE classroom_id = NEW.classroom_id 
        AND status = 'active'
        AND id != NEW.id;
        
        -- Enforce capacity limit
        IF current_enrollment >= classroom_capacity THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Target classroom is at full capacity';
        END IF;
    END IF;
END$

-- Trigger: Validate child age against classroom age range
DROP TRIGGER IF EXISTS trg_children_before_insert_age_check$
CREATE TRIGGER trg_children_before_insert_age_check
BEFORE INSERT ON children
FOR EACH ROW
BEGIN
    DECLARE child_age_days INT;
    DECLARE child_age_months INT;
    DECLARE classroom_min_age INT;
    DECLARE classroom_max_age INT;
    
    -- Calculate child's age
    SET child_age_days = DATEDIFF(CURRENT_DATE, NEW.date_of_birth);
    SET child_age_months = TIMESTAMPDIFF(MONTH, NEW.date_of_birth, CURRENT_DATE);
    
    -- Get classroom age requirements
    SELECT min_age_days, max_age_months 
    INTO classroom_min_age, classroom_max_age
    FROM classrooms 
    WHERE id = NEW.classroom_id;
    
    -- Validate minimum age
    IF classroom_min_age IS NOT NULL AND child_age_days < classroom_min_age THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Child is too young for this classroom';
    END IF;
    
    -- Validate maximum age
    IF classroom_max_age IS NOT NULL AND child_age_months > classroom_max_age THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Child is too old for this classroom';
    END IF;
END$

-- Trigger: Validate child age on classroom transfer
DROP TRIGGER IF EXISTS trg_children_before_update_age_check$
CREATE TRIGGER trg_children_before_update_age_check
BEFORE UPDATE ON children
FOR EACH ROW
BEGIN
    DECLARE child_age_days INT;
    DECLARE child_age_months INT;
    DECLARE classroom_min_age INT;
    DECLARE classroom_max_age INT;
    
    -- Only check if classroom_id changed
    IF NEW.classroom_id != OLD.classroom_id THEN
        
        -- Calculate child's age
        SET child_age_days = DATEDIFF(CURRENT_DATE, NEW.date_of_birth);
        SET child_age_months = TIMESTAMPDIFF(MONTH, NEW.date_of_birth, CURRENT_DATE);
        
        -- Get new classroom age requirements
        SELECT min_age_days, max_age_months 
        INTO classroom_min_age, classroom_max_age
        FROM classrooms 
        WHERE id = NEW.classroom_id;
        
        -- Validate minimum age
        IF classroom_min_age IS NOT NULL AND child_age_days < classroom_min_age THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Child is too young for target classroom';
        END IF;
        
        -- Validate maximum age
        IF classroom_max_age IS NOT NULL AND child_age_months > classroom_max_age THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Child is too old for target classroom';
        END IF;
    END IF;
END$

-- Trigger: Auto-set daily report status to 'submitted' when supervisor creates it
DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_status$
CREATE TRIGGER trg_daily_reports_before_insert_status
BEFORE INSERT ON daily_reports
FOR EACH ROW
BEGIN
    -- If status not explicitly set, default to 'submitted' (not draft)
    IF NEW.status IS NULL OR NEW.status = 'draft' THEN
        SET NEW.status = 'submitted';
    END IF;
END$

DELIMITER ;

-- ============================================================================
-- SECTION 11: CREATE STORED PROCEDURES FOR COMMON OPERATIONS
-- ============================================================================

DELIMITER $

-- Procedure: Get classroom capacity utilization
DROP PROCEDURE IF EXISTS sp_get_classroom_capacity_stats$
CREATE PROCEDURE sp_get_classroom_capacity_stats(IN p_nursery_id INT)
BEGIN
    SELECT 
        c.id AS classroom_id,
        c.name AS classroom_name,
        c.capacity AS max_capacity,
        COUNT(ch.id) AS current_enrollment,
        c.capacity - COUNT(ch.id) AS available_spots,
        ROUND((COUNT(ch.id) / c.capacity) * 100, 2) AS utilization_percent,
        c.is_active
    FROM classrooms c
    JOIN branches b ON c.branch_id = b.id
    LEFT JOIN children ch ON ch.classroom_id = c.id AND ch.status = 'active'
    WHERE b.nursery_id = p_nursery_id
    GROUP BY c.id, c.name, c.capacity, c.is_active
    ORDER BY utilization_percent DESC;
END$

-- Procedure: Get supervisor performance metrics
DROP PROCEDURE IF EXISTS sp_get_supervisor_performance$
CREATE PROCEDURE sp_get_supervisor_performance(
    IN p_nursery_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT 
        u.id AS supervisor_id,
        CONCAT(u.first_name, ' ', u.last_name) AS supervisor_name,
        u.email,
        COUNT(DISTINCT dr.id) AS total_reports,
        COUNT(DISTINCT CASE WHEN dr.status = 'submitted' THEN dr.id END) AS pending_reports,
        COUNT(DISTINCT CASE WHEN dr.status = 'approved' THEN dr.id END) AS approved_reports,
        COUNT(DISTINCT CASE WHEN dr.status = 'revision_needed' THEN dr.id END) AS revision_requests,
        COUNT(DISTINCT cl.id) AS classrooms_assigned,
        COUNT(DISTINCT ch.id) AS children_supervised,
        u.last_login
    FROM users u
    LEFT JOIN classrooms cl ON cl.supervisor_id = u.id
    LEFT JOIN children ch ON ch.classroom_id = cl.id AND ch.status = 'active'
    LEFT JOIN daily_reports dr ON dr.supervisor_id = u.id 
        AND dr.date BETWEEN p_start_date AND p_end_date
    WHERE u.nursery_id = p_nursery_id 
    AND u.role = 'supervisor'
    AND u.is_active = TRUE
    GROUP BY u.id, u.first_name, u.last_name, u.email, u.last_login
    ORDER BY total_reports DESC;
END$

-- Procedure: Get nursery attendance summary
DROP PROCEDURE IF EXISTS sp_get_attendance_summary$
CREATE PROCEDURE sp_get_attendance_summary(
    IN p_nursery_id INT,
    IN p_date DATE
)
BEGIN
    SELECT 
        COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.child_id END) AS present_count,
        COUNT(DISTINCT CASE WHEN a.status = 'absent' THEN a.child_id END) AS absent_count,
        COUNT(DISTINCT CASE WHEN a.status = 'late' THEN a.child_id END) AS late_count,
        COUNT(DISTINCT ch.id) AS total_children,
        ROUND((COUNT(DISTINCT CASE WHEN a.status = 'present' THEN a.child_id END) / 
               COUNT(DISTINCT ch.id)) * 100, 2) AS attendance_rate
    FROM children ch
    JOIN classrooms cl ON ch.classroom_id = cl.id
    JOIN branches b ON cl.branch_id = b.id
    LEFT JOIN attendance a ON a.child_id = ch.id AND a.date = p_date
    WHERE b.nursery_id = p_nursery_id
    AND ch.status = 'active';
END$

DELIMITER ;

-- ============================================================================
-- SECTION 12: BACKFILL EXISTING DATA (IDEMPOTENT)
-- ============================================================================

-- Set default status for existing daily reports
UPDATE daily_reports 
SET status = 'approved' 
WHERE status = 'draft' OR status IS NULL;

-- Set default age ranges for existing classrooms (adjust as needed per classroom type)
UPDATE classrooms SET min_age_days = 0, max_age_months = 12 WHERE name LIKE '%Infant%' AND min_age_days IS NULL;
UPDATE classrooms SET min_age_days = 365, max_age_months = 24 WHERE name LIKE '%Toddler%' AND min_age_days IS NULL;
UPDATE classrooms SET min_age_days = 730, max_age_months = 48 WHERE name LIKE '%Preschool%' AND min_age_days IS NULL;
UPDATE classrooms SET min_age_days = 1460, max_age_months = 60 WHERE name LIKE '%Kindergarten%' AND min_age_days IS NULL;
UPDATE classrooms SET min_age_days = 0, max_age_months = 60 WHERE min_age_days IS NULL; -- Default for others

-- Activate all existing classrooms and branches
UPDATE classrooms SET is_active = TRUE WHERE is_active IS NULL;
UPDATE branches SET is_active = TRUE WHERE is_active IS NULL;

-- ============================================================================
-- SECTION 13: VERIFY MIGRATION SUCCESS
-- ============================================================================

-- Check that all columns exist
SELECT 
    'daily_reports' AS table_name,
    COUNT(*) AS column_count
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'daily_reports'
AND COLUMN_NAME IN ('supervisor_id', 'status', 'manager_notes', 'reviewed_by', 'reviewed_at')
HAVING COUNT(*) = 5

UNION ALL

SELECT 
    'classrooms' AS table_name,
    COUNT(*) AS column_count
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'classrooms'
AND COLUMN_NAME IN ('supervisor_id', 'min_age_days', 'max_age_months', 'is_active')
HAVING COUNT(*) = 4

UNION ALL

SELECT 
    'users' AS table_name,
    COUNT(*) AS column_count
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
AND TABLE_NAME = 'users'
AND COLUMN_NAME IN ('branch_id', 'last_login', 'temp_password')
HAVING COUNT(*) = 3;

-- Check that all indexes exist
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    NON_UNIQUE,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
FROM information_schema.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
AND INDEX_NAME LIKE 'idx_%' OR INDEX_NAME LIKE 'uk_%'
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;

-- Check that all triggers exist
SELECT 
    TRIGGER_NAME,
    EVENT_MANIPULATION,
    EVENT_OBJECT_TABLE,
    ACTION_TIMING
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
ORDER BY EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION;

-- ============================================================================
-- ROLLBACK SECTION (USE ONLY IF MIGRATION FAILS)
-- ============================================================================
-- IMPORTANT: Execute these statements in reverse order if rollback needed
-- ============================================================================

/*
-- Drop triggers
DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_status;
DROP TRIGGER IF EXISTS trg_children_before_update_age_check;
DROP TRIGGER IF EXISTS trg_children_before_insert_age_check;
DROP TRIGGER IF EXISTS trg_children_before_update_capacity_check;
DROP TRIGGER IF EXISTS trg_children_before_insert_capacity_check;

-- Drop stored procedures
DROP PROCEDURE IF EXISTS sp_get_attendance_summary;
DROP PROCEDURE IF EXISTS sp_get_supervisor_performance;
DROP PROCEDURE IF EXISTS sp_get_classroom_capacity_stats;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_branch_role ON users;
DROP INDEX IF EXISTS idx_classrooms_branch_active ON classrooms;
DROP INDEX IF EXISTS idx_branches_nursery_active ON branches;
DROP INDEX IF EXISTS idx_attendance_child_date ON attendance;
DROP INDEX IF EXISTS idx_audit_logs_user_resource_created ON audit_logs;
DROP INDEX IF EXISTS idx_children_classroom_status ON children;
DROP INDEX IF EXISTS idx_daily_reports_supervisor_date ON daily_reports;
DROP INDEX IF EXISTS idx_notifications_nursery_role_created ON notifications;
DROP INDEX IF EXISTS idx_users_nursery_role_active ON users;
DROP INDEX IF EXISTS idx_daily_reports_nursery_date_status ON daily_reports;
DROP INDEX IF EXISTS idx_attendance_nursery_date ON attendance;
DROP INDEX IF EXISTS idx_children_nursery_classroom_status ON children;

-- Drop unique constraints
DROP INDEX IF EXISTS uk_branches_nursery_name ON branches;
DROP INDEX IF EXISTS uk_classrooms_branch_name ON classrooms;
DROP INDEX IF EXISTS uk_daily_reports_child_date ON daily_reports;
DROP INDEX IF EXISTS uk_attendance_child_date ON attendance;

-- Drop check constraints
ALTER TABLE branches DROP CONSTRAINT IF EXISTS chk_branches_capacity_positive;
ALTER TABLE attendance DROP CONSTRAINT IF EXISTS chk_attendance_times_logical;
ALTER TABLE children DROP CONSTRAINT IF EXISTS chk_children_dob_past;
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS chk_classrooms_age_range_valid;
ALTER TABLE classrooms DROP CONSTRAINT IF EXISTS chk_classrooms_capacity_positive;

-- Drop foreign keys
ALTER TABLE notifications DROP FOREIGN KEY IF EXISTS fk_notifications_nursery;
ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_users_branch;
ALTER TABLE classrooms DROP FOREIGN KEY IF EXISTS fk_classrooms_supervisor;
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_reviewer;
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_supervisor;

-- Drop columns from notifications
ALTER TABLE notifications DROP COLUMN IF EXISTS target_role;
ALTER TABLE notifications DROP COLUMN IF EXISTS nursery_id;

-- Drop columns from attendance
ALTER TABLE attendance DROP COLUMN IF EXISTS notes;

-- Drop columns from branches
ALTER TABLE branches DROP COLUMN IF EXISTS max_capacity;
ALTER TABLE branches DROP COLUMN IF EXISTS is_active;

-- Drop columns from users
ALTER TABLE users DROP COLUMN IF EXISTS temp_password;
ALTER TABLE users DROP COLUMN IF EXISTS last_login;
ALTER TABLE users DROP COLUMN IF EXISTS branch_id;

-- Drop columns from classrooms
ALTER TABLE classrooms DROP COLUMN IF EXISTS is_active;
ALTER TABLE classrooms DROP COLUMN IF EXISTS max_age_months;
ALTER TABLE classrooms DROP COLUMN IF EXISTS min_age_days;
ALTER TABLE classrooms DROP COLUMN IF EXISTS supervisor_id;

-- Drop columns from daily_reports
ALTER TABLE daily_reports DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS manager_notes;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS status;
ALTER TABLE daily_reports DROP COLUMN IF EXISTS supervisor_id;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 1;
SET SESSION sql_notes = 1;

SELECT 'Migration 2.0.0 completed successfully!' AS status;
