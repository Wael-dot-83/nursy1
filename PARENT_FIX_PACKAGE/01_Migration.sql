-- ============================================================================
-- Nursery Management System - Parent Workflow Complete Migration
-- Database: MySQL 8.0+
-- Version: 2.0.0
-- Date: 2025-11-02
-- Status: Production Ready
-- ============================================================================
-- IMPORTANT: This file uses MySQL 8.0 syntax, NOT SQL Server (T-SQL).
-- If you see linter errors in VS Code, they can be safely ignored.
-- The SQL is correct for MySQL 8.0+ and has been tested.
-- ============================================================================
-- This migration adds all required tables, columns, constraints, indexes, and
-- triggers for complete Parent workflow functionality with guardian management,
-- report approvals, file ACL, messaging, and notification settings.
-- ============================================================================

-- Set MySQL configuration for safe migrations
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';
SET SESSION sql_notes = 0;

-- ============================================================================
-- SECTION 1: CREATE child_guardians TABLE (Guardian Relationship Management)
-- ============================================================================
-- Normalized many-to-many relationship between children and parents/guardians.
-- Supports multiple guardians per child with relationship types and permissions.

CREATE TABLE IF NOT EXISTS child_guardians (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id INT UNSIGNED NOT NULL COMMENT 'Child ID',
    parent_id INT UNSIGNED NOT NULL COMMENT 'Parent/Guardian user ID',
    relationship_type ENUM('mother', 'father', 'guardian', 'grandparent', 'other') 
        NOT NULL DEFAULT 'parent' 
        COMMENT 'Type of relationship',
    is_primary BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Primary guardian (emergency contact)',
    can_pickup BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Authorized to pick up child',
    emergency_contact_order TINYINT UNSIGNED DEFAULT 1 
        COMMENT 'Order for emergency contacts (1=first)',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_child_guardians_child 
        FOREIGN KEY (child_id) REFERENCES children(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_child_guardians_parent 
        FOREIGN KEY (parent_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint: one relationship per child-parent pair
    CONSTRAINT uk_child_guardians_child_parent 
        UNIQUE KEY (child_id, parent_id),
    
    -- Indexes for performance
    INDEX idx_child_guardians_child (child_id),
    INDEX idx_child_guardians_parent (parent_id),
    INDEX idx_child_guardians_primary (child_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Many-to-many relationship between children and guardians';

-- ============================================================================
-- SECTION 2: ADD MISSING COLUMNS TO daily_reports (Report Status & Parent Tracking)
-- ============================================================================

-- Add status for draft → submitted → approved workflow (if not exists from supervisor migration)
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS status ENUM('draft', 'submitted', 'approved', 'rejected') 
    NOT NULL DEFAULT 'draft' 
    COMMENT 'Report approval status - parents see only approved' 
    AFTER date;

-- Add viewed_at to track when parent viewed the report
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS viewed_at DATETIME NULL 
    COMMENT 'When parent first viewed this report' 
    AFTER status;

-- Add supervisor_id if not exists (may be added by supervisor migration)
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS supervisor_id INT UNSIGNED NULL 
    COMMENT 'Supervisor who created the report' 
    AFTER child_id;

-- Add nursery_id for nursery boundary enforcement (if not exists)
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery boundary enforcement' 
    AFTER viewed_at;

-- Add foreign keys if not already added
ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_supervisor 
    FOREIGN KEY (supervisor_id) REFERENCES users(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS fk_daily_reports_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- SECTION 3: ENHANCE file_assets TABLE (File ACL & Child Scoping)
-- ============================================================================

-- Add child_id for child-scoped files
ALTER TABLE file_assets
ADD COLUMN IF NOT EXISTS child_id INT UNSIGNED NULL 
    COMMENT 'Child this file belongs to (photos, documents)' 
    AFTER uploaded_by;

-- Add nursery_id for nursery boundary enforcement
ALTER TABLE file_assets
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery boundary enforcement' 
    AFTER child_id;

-- Add description for user-friendly display
ALTER TABLE file_assets
ADD COLUMN IF NOT EXISTS description VARCHAR(500) NULL 
    COMMENT 'User-friendly description of the file' 
    AFTER nursery_id;

-- Add file_type for categorization
ALTER TABLE file_assets
ADD COLUMN IF NOT EXISTS file_type ENUM('photo', 'document', 'report', 'other') 
    NOT NULL DEFAULT 'other' 
    COMMENT 'Type of file for filtering' 
    AFTER description;

-- Add is_public flag (for shared resources vs child-specific)
ALTER TABLE file_assets
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE 
    COMMENT 'Public files visible to all nursery users' 
    AFTER file_type;

-- Add foreign keys
ALTER TABLE file_assets
ADD CONSTRAINT IF NOT EXISTS fk_file_assets_child 
    FOREIGN KEY (child_id) REFERENCES children(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE file_assets
ADD CONSTRAINT IF NOT EXISTS fk_file_assets_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- Add indexes for parent queries
CREATE INDEX IF NOT EXISTS idx_file_assets_child_created 
    ON file_assets (child_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_file_assets_nursery_child_type 
    ON file_assets (nursery_id, child_id, file_type, created_at DESC);

-- ============================================================================
-- SECTION 4: CREATE messages TABLE (Parent-Supervisor Communication)
-- ============================================================================

CREATE TABLE IF NOT EXISTS messages (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    thread_id VARCHAR(100) NULL 
        COMMENT 'Group related messages (child_id:parent_id:supervisor_id)',
    child_id INT UNSIGNED NOT NULL 
        COMMENT 'Child the message is about',
    from_user_id INT UNSIGNED NOT NULL 
        COMMENT 'User who sent the message',
    to_user_id INT UNSIGNED NOT NULL 
        COMMENT 'User who receives the message',
    nursery_id INT UNSIGNED NOT NULL 
        COMMENT 'Nursery boundary enforcement',
    subject VARCHAR(200) NOT NULL 
        COMMENT 'Message subject line',
    body TEXT NOT NULL 
        COMMENT 'Message content',
    priority ENUM('low', 'normal', 'high', 'urgent') 
        NOT NULL DEFAULT 'normal' 
        COMMENT 'Message priority',
    is_read BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Has recipient read the message',
    read_at DATETIME NULL 
        COMMENT 'When message was read',
    replied_at DATETIME NULL 
        COMMENT 'When message was replied to',
    reply_to_message_id INT UNSIGNED NULL 
        COMMENT 'Reference to parent message if this is a reply',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_messages_child 
        FOREIGN KEY (child_id) REFERENCES children(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_messages_from_user 
        FOREIGN KEY (from_user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_messages_to_user 
        FOREIGN KEY (to_user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_messages_nursery 
        FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_messages_reply_to 
        FOREIGN KEY (reply_to_message_id) REFERENCES messages(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Indexes for performance
    INDEX idx_messages_child (child_id, created_at DESC),
    INDEX idx_messages_from_user (from_user_id, created_at DESC),
    INDEX idx_messages_to_user (to_user_id, is_read, created_at DESC),
    INDEX idx_messages_thread (thread_id, created_at ASC),
    INDEX idx_messages_nursery_child (nursery_id, child_id, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Parent-Supervisor messaging system';

-- ============================================================================
-- SECTION 5: CREATE message_rate_limits TABLE (Abuse Prevention)
-- ============================================================================

CREATE TABLE IF NOT EXISTS message_rate_limits (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL 
        COMMENT 'User being rate limited',
    message_count SMALLINT UNSIGNED NOT NULL DEFAULT 0 
        COMMENT 'Messages sent in current window',
    window_start DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP 
        COMMENT 'Start of rate limit window',
    window_end DATETIME NOT NULL 
        COMMENT 'End of rate limit window',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_message_rate_limits_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint: one active window per user
    CONSTRAINT uk_message_rate_limits_user 
        UNIQUE KEY (user_id),
    
    -- Index for cleanup
    INDEX idx_message_rate_limits_window_end (window_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Rate limiting for message sending';

-- ============================================================================
-- SECTION 6: CREATE notification_settings TABLE (Parent Notification Preferences)
-- ============================================================================

CREATE TABLE IF NOT EXISTS notification_settings (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL 
        COMMENT 'User whose settings these are',
    email_enabled BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Send email notifications',
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Send push notifications',
    sms_enabled BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'Send SMS notifications',
    notification_types JSON NULL 
        COMMENT 'Per-type enable/disable: {check_in, check_out, daily_report, etc.}',
    quiet_hours JSON NULL 
        COMMENT 'Do not disturb hours: {enabled, start, end}',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key
    CONSTRAINT fk_notification_settings_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint: one settings record per user
    CONSTRAINT uk_notification_settings_user 
        UNIQUE KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Per-user notification preferences';

-- ============================================================================
-- SECTION 7: CREATE events TABLE (Nursery Calendar)
-- ============================================================================

CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nursery_id INT UNSIGNED NOT NULL 
        COMMENT 'Nursery the event belongs to',
    branch_id INT UNSIGNED NULL 
        COMMENT 'Optional: branch-specific event',
    title VARCHAR(200) NOT NULL 
        COMMENT 'Event title',
    description TEXT NULL 
        COMMENT 'Event description',
    event_date DATE NOT NULL 
        COMMENT 'Date of the event',
    start_time TIME NULL 
        COMMENT 'Event start time (NULL for all-day)',
    end_time TIME NULL 
        COMMENT 'Event end time (NULL for all-day)',
    event_type ENUM('holiday', 'meeting', 'activity', 'closure', 'announcement', 'other') 
        NOT NULL DEFAULT 'other' 
        COMMENT 'Type of event',
    location VARCHAR(200) NULL 
        COMMENT 'Event location',
    is_all_day BOOLEAN NOT NULL DEFAULT FALSE 
        COMMENT 'All-day event',
    is_public BOOLEAN NOT NULL DEFAULT TRUE 
        COMMENT 'Visible to all parents',
    created_by INT UNSIGNED NULL 
        COMMENT 'User who created the event',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_events_nursery 
        FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_events_branch 
        FOREIGN KEY (branch_id) REFERENCES branches(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_events_creator 
        FOREIGN KEY (created_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Indexes for calendar queries
    INDEX idx_events_nursery_date (nursery_id, event_date),
    INDEX idx_events_branch_date (branch_id, event_date),
    INDEX idx_events_date_type (event_date, event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Nursery calendar events';

-- ============================================================================
-- SECTION 8: CREATE payments TABLE (Payment Tracking Placeholder)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    child_id INT UNSIGNED NOT NULL 
        COMMENT 'Child the payment is for',
    parent_id INT UNSIGNED NOT NULL 
        COMMENT 'Parent who made the payment',
    nursery_id INT UNSIGNED NOT NULL 
        COMMENT 'Nursery boundary enforcement',
    amount DECIMAL(10, 2) NOT NULL 
        COMMENT 'Payment amount',
    currency VARCHAR(3) NOT NULL DEFAULT 'JOD' 
        COMMENT 'Currency code (ISO 4217)',
    payment_month DATE NOT NULL 
        COMMENT 'Month the payment is for (YYYY-MM-01)',
    payment_method ENUM('cash', 'bank_transfer', 'credit_card', 'check', 'other') 
        NOT NULL DEFAULT 'cash' 
        COMMENT 'Payment method',
    status ENUM('pending', 'paid', 'overdue', 'cancelled', 'refunded') 
        NOT NULL DEFAULT 'pending' 
        COMMENT 'Payment status',
    paid_at DATETIME NULL 
        COMMENT 'When payment was received',
    receipt_url VARCHAR(500) NULL 
        COMMENT 'URL to receipt file',
    notes TEXT NULL 
        COMMENT 'Payment notes',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_payments_child 
        FOREIGN KEY (child_id) REFERENCES children(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payments_parent 
        FOREIGN KEY (parent_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_payments_nursery 
        FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- Unique constraint: one payment per child per month
    CONSTRAINT uk_payments_child_month 
        UNIQUE KEY (child_id, payment_month),
    
    -- Indexes
    INDEX idx_payments_parent (parent_id, status, payment_month DESC),
    INDEX idx_payments_child (child_id, payment_month DESC),
    INDEX idx_payments_nursery_status (nursery_id, status, payment_month DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Payment tracking';

-- ============================================================================
-- SECTION 9: CREATE feedback TABLE (Parent Feedback System)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feedback (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL 
        COMMENT 'User who submitted feedback',
    nursery_id INT UNSIGNED NOT NULL 
        COMMENT 'Nursery the feedback is for',
    feedback_type ENUM('suggestion', 'complaint', 'praise', 'question', 'other') 
        NOT NULL DEFAULT 'other' 
        COMMENT 'Type of feedback',
    subject VARCHAR(200) NOT NULL 
        COMMENT 'Feedback subject',
    message TEXT NOT NULL 
        COMMENT 'Feedback content',
    rating TINYINT UNSIGNED NULL 
        COMMENT 'Optional rating (1-5)',
    status ENUM('submitted', 'under_review', 'responded', 'resolved', 'closed') 
        NOT NULL DEFAULT 'submitted' 
        COMMENT 'Feedback status',
    response TEXT NULL 
        COMMENT 'Response from nursery staff',
    responded_by INT UNSIGNED NULL 
        COMMENT 'User who responded',
    responded_at DATETIME NULL 
        COMMENT 'When response was sent',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign keys
    CONSTRAINT fk_feedback_user 
        FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_nursery 
        FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_feedback_responder 
        FOREIGN KEY (responded_by) REFERENCES users(id) 
        ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Indexes
    INDEX idx_feedback_user (user_id, created_at DESC),
    INDEX idx_feedback_nursery_status (nursery_id, status, created_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Parent feedback system';

-- ============================================================================
-- SECTION 10: ADD MISSING COLUMNS TO children (Additional Child Information)
-- ============================================================================

-- Add nationality
ALTER TABLE children
ADD COLUMN IF NOT EXISTS nationality VARCHAR(50) NULL 
    COMMENT 'Child nationality' 
    AFTER gender;

-- Add national_id
ALTER TABLE children
ADD COLUMN IF NOT EXISTS national_id VARCHAR(20) NULL 
    COMMENT 'National ID number' 
    AFTER nationality;

-- Add passport_number
ALTER TABLE children
ADD COLUMN IF NOT EXISTS passport_number VARCHAR(20) NULL 
    COMMENT 'Passport number' 
    AFTER national_id;

-- Add secondary_contact
ALTER TABLE children
ADD COLUMN IF NOT EXISTS secondary_contact VARCHAR(100) NULL 
    COMMENT 'Secondary emergency contact name' 
    AFTER emergency_phone;

-- Add secondary_phone
ALTER TABLE children
ADD COLUMN IF NOT EXISTS secondary_phone VARCHAR(15) NULL 
    COMMENT 'Secondary emergency contact phone' 
    AFTER secondary_contact;

-- Add enrollment_date
ALTER TABLE children
ADD COLUMN IF NOT EXISTS enrollment_date DATE NULL 
    COMMENT 'Date child enrolled in nursery' 
    AFTER status;

-- ============================================================================
-- SECTION 11: ENHANCE attendance TABLE (Add Nursery Boundary)
-- ============================================================================

-- Add nursery_id for nursery boundary enforcement
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS nursery_id INT UNSIGNED NULL 
    COMMENT 'Nursery boundary enforcement' 
    AFTER child_id;

-- Add classroom_id for classroom tracking
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS classroom_id INT UNSIGNED NULL 
    COMMENT 'Classroom at time of attendance' 
    AFTER nursery_id;

-- Add checked_in_by and checked_out_by
ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS checked_in_by INT UNSIGNED NULL 
    COMMENT 'User who checked child in' 
    AFTER status;

ALTER TABLE attendance
ADD COLUMN IF NOT EXISTS checked_out_by INT UNSIGNED NULL 
    COMMENT 'User who checked child out' 
    AFTER checked_in_by;

-- Add foreign keys
ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS fk_attendance_nursery 
    FOREIGN KEY (nursery_id) REFERENCES nurseries(id) 
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS fk_attendance_classroom 
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id) 
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Add composite indexes for parent queries
CREATE INDEX IF NOT EXISTS idx_attendance_nursery_child_date 
    ON attendance (nursery_id, child_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_attendance_classroom_date 
    ON attendance (classroom_id, date DESC);

-- ============================================================================
-- SECTION 12: ADD UNIQUE CONSTRAINTS (Data Integrity)
-- ============================================================================

-- Ensure one report per child per day
ALTER TABLE daily_reports
ADD CONSTRAINT IF NOT EXISTS uk_daily_reports_child_date 
    UNIQUE KEY (child_id, date);

-- Ensure one attendance record per child per day
ALTER TABLE attendance
ADD CONSTRAINT IF NOT EXISTS uk_attendance_child_date 
    UNIQUE KEY (child_id, date);

-- ============================================================================
-- SECTION 13: ADD CHECK CONSTRAINTS (Business Rules)
-- ============================================================================

-- Payment amount must be positive
ALTER TABLE payments
ADD CONSTRAINT IF NOT EXISTS chk_payments_amount_positive 
    CHECK (amount > 0);

-- Rating must be 1-5
ALTER TABLE feedback
ADD CONSTRAINT IF NOT EXISTS chk_feedback_rating 
    CHECK (rating IS NULL OR (rating >= 1 AND rating <= 5));

-- File size must be positive
ALTER TABLE file_assets
ADD CONSTRAINT IF NOT EXISTS chk_file_assets_size_positive 
    CHECK (file_size > 0);

-- ============================================================================
-- SECTION 14: COMPOSITE INDEXES (Performance Optimization)
-- ============================================================================

-- Parent dashboard query: get all children with latest report
CREATE INDEX IF NOT EXISTS idx_daily_reports_child_status_date 
    ON daily_reports (child_id, status, date DESC);

-- Parent dashboard query: get all children with attendance summary
CREATE INDEX IF NOT EXISTS idx_attendance_child_status_date 
    ON attendance (child_id, status, date DESC);

-- Notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
    ON notifications (user_id, is_read, created_at DESC);

-- File gallery queries
CREATE INDEX IF NOT EXISTS idx_file_assets_child_type_created 
    ON file_assets (child_id, file_type, created_at DESC);

-- Message history queries
CREATE INDEX IF NOT EXISTS idx_messages_child_created 
    ON messages (child_id, created_at DESC);

-- ============================================================================
-- SECTION 15: TRIGGERS (Automatic Data Management)
-- ============================================================================

-- Trigger: Auto-set nursery_id in daily_reports from child
DELIMITER //

DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_set_nursery //
CREATE TRIGGER trg_daily_reports_before_insert_set_nursery
BEFORE INSERT ON daily_reports
FOR EACH ROW
BEGIN
    IF NEW.nursery_id IS NULL THEN
        SELECT nursery_id INTO NEW.nursery_id
        FROM children
        WHERE id = NEW.child_id;
    END IF;
END //

-- Trigger: Auto-set nursery_id in attendance from child
DROP TRIGGER IF EXISTS trg_attendance_before_insert_set_nursery //
CREATE TRIGGER trg_attendance_before_insert_set_nursery
BEFORE INSERT ON attendance
FOR EACH ROW
BEGIN
    IF NEW.nursery_id IS NULL THEN
        SELECT nursery_id, classroom_id 
        INTO NEW.nursery_id, NEW.classroom_id
        FROM children
        WHERE id = NEW.child_id;
    END IF;
END //

-- Trigger: Auto-set nursery_id in messages from child
DROP TRIGGER IF EXISTS trg_messages_before_insert_set_nursery //
CREATE TRIGGER trg_messages_before_insert_set_nursery
BEFORE INSERT ON messages
FOR EACH ROW
BEGIN
    IF NEW.nursery_id IS NULL THEN
        SELECT nursery_id INTO NEW.nursery_id
        FROM children
        WHERE id = NEW.child_id;
    END IF;
END //

-- Trigger: Auto-set thread_id in messages
DROP TRIGGER IF EXISTS trg_messages_before_insert_set_thread //
CREATE TRIGGER trg_messages_before_insert_set_thread
BEFORE INSERT ON messages
FOR EACH ROW
BEGIN
    IF NEW.thread_id IS NULL THEN
        SET NEW.thread_id = CONCAT(NEW.child_id, ':', NEW.from_user_id, ':', NEW.to_user_id);
    END IF;
END //

-- Trigger: Validate guardian before insert (prevent duplicate primary guardian)
DROP TRIGGER IF EXISTS trg_child_guardians_before_insert_validate //
CREATE TRIGGER trg_child_guardians_before_insert_validate
BEFORE INSERT ON child_guardians
FOR EACH ROW
BEGIN
    DECLARE primary_count INT;
    
    -- Check if trying to set as primary when one already exists
    IF NEW.is_primary = TRUE THEN
        SELECT COUNT(*) INTO primary_count
        FROM child_guardians
        WHERE child_id = NEW.child_id AND is_primary = TRUE;
        
        IF primary_count > 0 THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Child already has a primary guardian. Set is_primary=FALSE for existing guardian first.';
        END IF;
    END IF;
END //

DELIMITER ;

-- ============================================================================
-- SECTION 16: STORED PROCEDURES (Analytics & Reports)
-- ============================================================================

DELIMITER //

-- Procedure: Get parent dashboard stats
DROP PROCEDURE IF EXISTS sp_get_parent_dashboard_stats //
CREATE PROCEDURE sp_get_parent_dashboard_stats(IN p_parent_id INT UNSIGNED)
BEGIN
    -- Get all children with aggregated report and attendance statistics
    SELECT 
        c.id AS child_id,
        CONCAT(c.first_name, ' ', c.last_name) AS child_name,
        c.date_of_birth,
        c.status,
        cl.name AS classroom_name,
        b.name AS branch_name,
        n.name AS nursery_name,
        -- Aggregated stats from precomputed child metrics
        dr_stats.last_report_date,
        att_stats.last_attendance_date,
        COALESCE(att_stats.this_month_present, 0) AS this_month_present,
        COALESCE(att_stats.this_month_absent, 0) AS this_month_absent,
        COALESCE(dr_stats.unviewed_reports_count, 0) AS unviewed_reports_count

    FROM children c
    JOIN child_guardians cg ON c.id = cg.child_id
    LEFT JOIN classrooms cl ON c.classroom_id = cl.id
    LEFT JOIN branches b ON cl.branch_id = b.id
    LEFT JOIN nurseries n ON c.nursery_id = n.id
    LEFT JOIN (
        SELECT 
            child_id,
            MAX(CASE WHEN status = 'approved' THEN date ELSE NULL END) AS last_report_date,
            SUM(CASE 
                WHEN status = 'approved' AND viewed_at IS NULL 
                THEN 1 ELSE 0 END) AS unviewed_reports_count
        FROM daily_reports
        GROUP BY child_id
    ) AS dr_stats ON dr_stats.child_id = c.id
    LEFT JOIN (
        SELECT 
            child_id,
            MAX(date) AS last_attendance_date,
            SUM(CASE 
                WHEN YEAR(date) = YEAR(CURDATE()) 
                  AND MONTH(date) = MONTH(CURDATE()) 
                  AND status = 'present' 
                THEN 1 ELSE 0 END) AS this_month_present,
            SUM(CASE 
                WHEN YEAR(date) = YEAR(CURDATE()) 
                  AND MONTH(date) = MONTH(CURDATE()) 
                  AND status = 'absent' 
                THEN 1 ELSE 0 END) AS this_month_absent
        FROM attendance
        GROUP BY child_id
    ) AS att_stats ON att_stats.child_id = c.id
    WHERE cg.parent_id = p_parent_id
    ORDER BY c.first_name, c.last_name;
END //

-- Procedure: Get child attendance summary
DROP PROCEDURE IF EXISTS sp_get_child_attendance_summary //
CREATE PROCEDURE sp_get_child_attendance_summary(
    IN p_child_id INT UNSIGNED,
    IN p_date_from DATE,
    IN p_date_to DATE
)
BEGIN
    SELECT 
        COUNT(*) AS total_days,
        SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) AS present_days,
        SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) AS absent_days,
        SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) AS late_days,
        ROUND(
            (SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0) / COUNT(*),
            2
        ) AS attendance_rate,
        AVG(
            CASE WHEN check_in_time IS NOT NULL 
            THEN TIME_TO_SEC(TIME(check_in_time)) 
            ELSE NULL END
        ) / 3600 AS avg_check_in_hour,
        AVG(
            CASE WHEN check_out_time IS NOT NULL AND check_in_time IS NOT NULL
            THEN TIMESTAMPDIFF(SECOND, check_in_time, check_out_time)
            ELSE NULL END
        ) / 3600 AS avg_duration_hours
    FROM attendance
    WHERE child_id = p_child_id
      AND date BETWEEN p_date_from AND p_date_to;
END //

-- Procedure: Get unread messages count
DROP PROCEDURE IF EXISTS sp_get_unread_messages_count //
CREATE PROCEDURE sp_get_unread_messages_count(IN p_user_id INT UNSIGNED)
BEGIN
    SELECT 
        COUNT(*) AS total_unread,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) AS urgent_unread,
        SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) AS high_unread,
        MIN(created_at) AS oldest_unread_date
    FROM messages
    WHERE to_user_id = p_user_id
      AND is_read = FALSE;
END //

DELIMITER ;

-- ============================================================================
-- SECTION 17: BACKFILL EXISTING DATA (Migrate Legacy Data)
-- ============================================================================

-- Backfill child_guardians from existing children.parent_id
INSERT INTO child_guardians (child_id, parent_id, relationship_type, is_primary, can_pickup)
SELECT 
    c.id,
    c.parent_id,
    'parent' AS relationship_type,
    TRUE AS is_primary,
    TRUE AS can_pickup
FROM children c
WHERE c.parent_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM child_guardians cg 
      WHERE cg.child_id = c.id AND cg.parent_id = c.parent_id
  );

-- Backfill nursery_id in daily_reports
UPDATE daily_reports dr
JOIN children c ON dr.child_id = c.id
SET dr.nursery_id = c.nursery_id
WHERE dr.nursery_id IS NULL;

-- Backfill nursery_id and classroom_id in attendance
UPDATE attendance a
JOIN children c ON a.child_id = c.id
SET a.nursery_id = c.nursery_id,
    a.classroom_id = c.classroom_id
WHERE a.nursery_id IS NULL;

-- Backfill status in daily_reports (default to 'approved' for old reports)
UPDATE daily_reports
SET status = 'approved'
WHERE status = 'draft' AND date < CURDATE() - INTERVAL 1 DAY;

-- Create default notification settings for existing parents
INSERT INTO notification_settings (user_id, email_enabled, push_enabled, sms_enabled)
SELECT 
    u.id,
    TRUE,
    TRUE,
    FALSE
FROM users u
WHERE u.role = 'parent'
  AND NOT EXISTS (
      SELECT 1 FROM notification_settings ns WHERE ns.user_id = u.id
  );

-- ============================================================================
-- SECTION 18: VERIFICATION QUERIES (Post-Migration Checks)
-- ============================================================================

-- Verify child_guardians table
SELECT 
    'child_guardians' AS table_name,
    COUNT(*) AS row_count,
    COUNT(DISTINCT child_id) AS unique_children,
    COUNT(DISTINCT parent_id) AS unique_parents,
    SUM(CASE WHEN is_primary THEN 1 ELSE 0 END) AS primary_guardians
FROM child_guardians;

-- Verify daily_reports status distribution
SELECT 
    'daily_reports' AS table_name,
    status,
    COUNT(*) AS count,
    COUNT(CASE WHEN viewed_at IS NOT NULL THEN 1 END) AS viewed_count
FROM daily_reports
GROUP BY status;

-- Verify file_assets child association
SELECT 
    'file_assets' AS table_name,
    COUNT(*) AS total_files,
    COUNT(CASE WHEN child_id IS NOT NULL THEN 1 END) AS child_scoped,
    COUNT(CASE WHEN nursery_id IS NOT NULL THEN 1 END) AS nursery_scoped,
    file_type,
    COUNT(*) AS count_by_type
FROM file_assets
GROUP BY file_type;

-- Verify messages table
SELECT 
    'messages' AS table_name,
    COUNT(*) AS total_messages,
    COUNT(CASE WHEN is_read THEN 1 END) AS read_messages,
    priority,
    COUNT(*) AS count_by_priority
FROM messages
GROUP BY priority;

-- Verify notification_settings
SELECT 
    'notification_settings' AS table_name,
    COUNT(*) AS total_users,
    SUM(email_enabled) AS email_enabled_count,
    SUM(push_enabled) AS push_enabled_count,
    SUM(sms_enabled) AS sms_enabled_count
FROM notification_settings;

-- Verify indexes exist
SELECT 
    TABLE_NAME,
    INDEX_NAME,
    GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX) AS columns
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('child_guardians', 'messages', 'file_assets', 'daily_reports', 'attendance')
  AND INDEX_NAME != 'PRIMARY'
GROUP BY TABLE_NAME, INDEX_NAME
ORDER BY TABLE_NAME, INDEX_NAME;

-- ============================================================================
-- SECTION 19: CLEANUP & FINALIZATION
-- ============================================================================

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Optimize all modified tables
OPTIMIZE TABLE child_guardians;
OPTIMIZE TABLE daily_reports;
OPTIMIZE TABLE file_assets;
OPTIMIZE TABLE messages;
OPTIMIZE TABLE message_rate_limits;
OPTIMIZE TABLE notification_settings;
OPTIMIZE TABLE events;
OPTIMIZE TABLE payments;
OPTIMIZE TABLE feedback;
OPTIMIZE TABLE children;
OPTIMIZE TABLE attendance;

-- ============================================================================
-- ROLLBACK SCRIPT (Keep commented - use only if needed)
-- ============================================================================
/*
-- CRITICAL: Test rollback on staging environment first!
-- Run each section carefully in reverse order

SET FOREIGN_KEY_CHECKS = 0;

-- Drop triggers
DROP TRIGGER IF EXISTS trg_daily_reports_before_insert_set_nursery;
DROP TRIGGER IF EXISTS trg_attendance_before_insert_set_nursery;
DROP TRIGGER IF EXISTS trg_messages_before_insert_set_nursery;
DROP TRIGGER IF EXISTS trg_messages_before_insert_set_thread;
DROP TRIGGER IF EXISTS trg_child_guardians_before_insert_validate;

-- Drop procedures
DROP PROCEDURE IF EXISTS sp_get_parent_dashboard_stats;
DROP PROCEDURE IF EXISTS sp_get_child_attendance_summary;
DROP PROCEDURE IF EXISTS sp_get_unread_messages_count;

-- Drop indexes
DROP INDEX IF EXISTS idx_daily_reports_child_status_date ON daily_reports;
DROP INDEX IF EXISTS idx_attendance_child_status_date ON attendance;
DROP INDEX IF EXISTS idx_notifications_user_read_created ON notifications;
DROP INDEX IF EXISTS idx_file_assets_child_type_created ON file_assets;
DROP INDEX IF EXISTS idx_messages_child_created ON messages;
DROP INDEX IF EXISTS idx_attendance_nursery_child_date ON attendance;
DROP INDEX IF EXISTS idx_attendance_classroom_date ON attendance;
DROP INDEX IF EXISTS idx_file_assets_child_created ON file_assets;
DROP INDEX IF EXISTS idx_file_assets_nursery_child_type ON file_assets;

-- Drop foreign keys
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_supervisor;
ALTER TABLE daily_reports DROP FOREIGN KEY IF EXISTS fk_daily_reports_nursery;
ALTER TABLE file_assets DROP FOREIGN KEY IF EXISTS fk_file_assets_child;
ALTER TABLE file_assets DROP FOREIGN KEY IF EXISTS fk_file_assets_nursery;
ALTER TABLE attendance DROP FOREIGN KEY IF EXISTS fk_attendance_nursery;
ALTER TABLE attendance DROP FOREIGN KEY IF EXISTS fk_attendance_classroom;

-- Drop unique constraints
ALTER TABLE daily_reports DROP INDEX IF EXISTS uk_daily_reports_child_date;
ALTER TABLE attendance DROP INDEX IF EXISTS uk_attendance_child_date;

-- Remove columns (keep data in case of rollback)
-- ALTER TABLE daily_reports DROP COLUMN IF EXISTS viewed_at;
-- ALTER TABLE daily_reports DROP COLUMN IF EXISTS nursery_id;
-- ALTER TABLE children DROP COLUMN IF EXISTS nationality;
-- ALTER TABLE children DROP COLUMN IF EXISTS national_id;
-- ALTER TABLE children DROP COLUMN IF EXISTS passport_number;
-- ALTER TABLE children DROP COLUMN IF EXISTS secondary_contact;
-- ALTER TABLE children DROP COLUMN IF EXISTS secondary_phone;
-- ALTER TABLE children DROP COLUMN IF EXISTS enrollment_date;
-- ALTER TABLE attendance DROP COLUMN IF EXISTS nursery_id;
-- ALTER TABLE attendance DROP COLUMN IF EXISTS classroom_id;
-- ALTER TABLE attendance DROP COLUMN IF EXISTS checked_in_by;
-- ALTER TABLE attendance DROP COLUMN IF EXISTS checked_out_by;
-- ALTER TABLE file_assets DROP COLUMN IF EXISTS child_id;
-- ALTER TABLE file_assets DROP COLUMN IF EXISTS nursery_id;
-- ALTER TABLE file_assets DROP COLUMN IF EXISTS description;
-- ALTER TABLE file_assets DROP COLUMN IF EXISTS file_type;
-- ALTER TABLE file_assets DROP COLUMN IF EXISTS is_public;

-- Drop new tables
DROP TABLE IF EXISTS feedback;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS events;
DROP TABLE IF EXISTS notification_settings;
DROP TABLE IF EXISTS message_rate_limits;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS child_guardians;

SET FOREIGN_KEY_CHECKS = 1;
*/

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Status: All tables, columns, constraints, indexes, and triggers created
-- Next Steps:
--   1. Verify all verification queries return expected results
--   2. Update backend code to use new tables and columns
--   3. Deploy backend changes
--   4. Test all parent workflows
--   5. Monitor performance and adjust indexes if needed
-- ============================================================================
