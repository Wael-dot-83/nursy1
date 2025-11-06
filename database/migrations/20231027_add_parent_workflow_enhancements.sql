
-- Migration for Parent Workflow Enhancements

USE nurserydb;

-- 1. Enhance child_parents to track primary contact
-- The 'relation' column already exists. We will add 'is_primary_contact'.
ALTER TABLE child_parents
ADD COLUMN IF NOT EXISTS is_primary_contact TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Indicates if this parent is the primary contact for the child';

-- Add a partial index to ensure only one primary contact per child (requires MySQL 8.0.13+)
-- This is a recommendation. If your MySQL version is older, this might need to be enforced at the application layer.
-- CREATE UNIQUE INDEX uq_child_primary_contact ON child_parents (child_id) WHERE is_primary_contact = 1;
-- For broader compatibility, we will rely on application logic and add a standard index.
CREATE INDEX IF NOT EXISTS idx_child_parents_parent ON child_parents(parent_id);


-- 2. Enhance daily_reports for parent visibility and tracking
-- Add 'viewed_at' to track when a parent first sees a report.
ALTER TABLE daily_reports
ADD COLUMN IF NOT EXISTS parent_viewed_at DATETIME NULL DEFAULT NULL COMMENT 'Timestamp when a parent first viewed the report',
CHANGE COLUMN status status ENUM('draft', 'submitted', 'approved', 'rejected', 'revision_needed') NOT NULL DEFAULT 'draft' COMMENT 'Workflow status of the report';

-- Add an index to support efficient querying of approved reports by parents.
CREATE INDEX IF NOT EXISTS idx_daily_reports_child_status_date ON daily_reports(child_id, status, report_date);


-- 3. Enhance child_documents for better access control
-- Add uploader_id and nursery_id to enforce stricter access control.
ALTER TABLE child_documents
ADD COLUMN IF NOT EXISTS uploader_id BIGINT UNSIGNED NULL COMMENT 'ID of the user who uploaded the document',
ADD COLUMN IF NOT EXISTS nursery_id BIGINT UNSIGNED NULL COMMENT 'Nursery ID, for boundary checks',
ADD CONSTRAINT fk_child_documents_uploader FOREIGN KEY IF NOT EXISTS (uploader_id) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT fk_child_documents_nursery FOREIGN KEY IF NOT EXISTS (nursery_id) REFERENCES nurseries(id) ON DELETE SET NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_child_documents_child_nursery ON child_documents(child_id, nursery_id);


-- 4. Create notification_settings table for parents
CREATE TABLE IF NOT EXISTS notification_settings (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL UNIQUE COMMENT 'The user (parent) these settings apply to',
  email_enabled   TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Enable/disable email notifications',
  push_enabled    TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Enable/disable push notifications',
  sms_enabled     TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Enable/disable SMS notifications',
  quiet_hours_start TIME NULL COMMENT 'Start time for quiet hours (e.g., 22:00:00)',
  quiet_hours_end   TIME NULL COMMENT 'End time for quiet hours (e.g., 08:00:00)',
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_notification_settings_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);


-- 5. Create messaging tables for parent-supervisor communication
CREATE TABLE IF NOT EXISTS message_threads (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  child_id        BIGINT UNSIGNED NOT NULL,
  parent_id       BIGINT UNSIGNED NOT NULL,
  supervisor_id   BIGINT UNSIGNED NOT NULL,
  nursery_id      BIGINT UNSIGNED NOT NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_message_thread (child_id, parent_id, supervisor_id),
  CONSTRAINT fk_message_threads_child FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_threads_parent FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_threads_supervisor FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_message_threads_nursery FOREIGN KEY (nursery_id) REFERENCES nurseries(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS messages (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  thread_id       BIGINT UNSIGNED NOT NULL,
  sender_id       BIGINT UNSIGNED NOT NULL,
  content         TEXT NOT NULL,
  is_read         TINYINT(1) NOT NULL DEFAULT 0,
  read_at         DATETIME NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_messages_thread FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_thread_created ON messages(thread_id, created_at);

-- ---
-- Rollback Notes:
-- To roll back these changes, you would execute the following in reverse order:
-- 1. DROP TABLE IF EXISTS messages;
-- 2. DROP TABLE IF EXISTS message_threads;
-- 3. DROP TABLE IF EXISTS notification_settings;
-- 4. ALTER TABLE child_documents DROP FOREIGN KEY fk_child_documents_nursery, DROP FOREIGN KEY fk_child_documents_uploader, DROP COLUMN nursery_id, DROP COLUMN uploader_id;
-- 5. ALTER TABLE daily_reports DROP COLUMN parent_viewed_at, CHANGE COLUMN status status ENUM('draft', 'submitted', 'approved', 'revision_needed') DEFAULT 'draft'; (Note: Reverting ENUM can be tricky if new values are in use).
-- 6. ALTER TABLE child_parents DROP COLUMN is_primary_contact;
-- 7. Drop indexes created above if they exist.
-- ---
