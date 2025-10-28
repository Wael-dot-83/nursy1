-- MySQL 8.0 schema for Nursery Management System
-- Generated to match the specified document-oriented design.

-- Ensure the database exists
CREATE DATABASE IF NOT EXISTS nurserydb
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nurserydb;

-- Optional reference tables
CREATE TABLE IF NOT EXISTS classes (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nursery_id      BIGINT UNSIGNED NOT NULL,
  branch_id       BIGINT UNSIGNED NULL,
  name            VARCHAR(120) NOT NULL,
  description     TEXT NULL,
  capacity        INT UNSIGNED NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nurseries (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name              VARCHAR(150) NOT NULL,
  main_street       VARCHAR(150),
  main_city         VARCHAR(100),
  main_governorate  ENUM (
    'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Madaba', 'Mafraq',
    'Jerash', 'Ajloun', 'Karak', 'Tafilah', 'Ma\'an', 'Aqaba'
  ),
  main_postal_code  VARCHAR(20),
  main_phone        VARCHAR(25) NOT NULL,
  email             VARCHAR(150),
  min_age_days      SMALLINT UNSIGNED,
  max_age_months    SMALLINT UNSIGNED,
  notes             TEXT,
  is_active         TINYINT(1) NOT NULL DEFAULT 1,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS branches (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nursery_id      BIGINT UNSIGNED NOT NULL,
  name            VARCHAR(150) NOT NULL,
  street          VARCHAR(150),
  city            VARCHAR(100),
  governorate     ENUM (
    'Amman', 'Irbid', 'Zarqa', 'Balqa', 'Madaba', 'Mafraq',
    'Jerash', 'Ajloun', 'Karak', 'Tafilah', 'Ma\'an', 'Aqaba'
  ),
  postal_code     VARCHAR(20),
  phone           VARCHAR(25),
  manager_id      BIGINT UNSIGNED NULL,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_branches_nursery FOREIGN KEY (nursery_id) REFERENCES nurseries (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(60) NOT NULL,
  email           VARCHAR(150) NOT NULL,
  password_hash   VARCHAR(255) NOT NULL,
  phone           VARCHAR(25),
  role            ENUM ('admin', 'manager', 'supervisor', 'parent') NOT NULL,
  nursery_id      BIGINT UNSIGNED NULL,
  branch_id       BIGINT UNSIGNED NULL,
  permissions     JSON,
  is_first_login  TINYINT(1) NOT NULL DEFAULT 1,
  otp_code        VARCHAR(12),
  otp_expiry      DATETIME,
  is_active       TINYINT(1) NOT NULL DEFAULT 1,
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login      DATETIME NULL,
  UNIQUE KEY uq_users_username (username),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_nursery FOREIGN KEY (nursery_id) REFERENCES nurseries (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_users_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON DELETE SET NULL
);

ALTER TABLE branches
  ADD CONSTRAINT fk_branches_manager FOREIGN KEY (manager_id) REFERENCES users (id)
    ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS parents (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id             BIGINT UNSIGNED NOT NULL UNIQUE,
  home_street         VARCHAR(150),
  home_city           VARCHAR(100),
  home_governorate    VARCHAR(100),
  home_postal_code    VARCHAR(20),
  work_street         VARCHAR(150),
  work_city           VARCHAR(100),
  work_company        VARCHAR(150),
  emergency_name      VARCHAR(120),
  emergency_phone     VARCHAR(30),
  emergency_relation  VARCHAR(60),
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_parents_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS children (
  id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  full_name           VARCHAR(150) NOT NULL,
  date_of_birth       DATE NOT NULL,
  national_id         VARCHAR(20),
  passport_number     VARCHAR(20),
  nationality         VARCHAR(60) DEFAULT 'Jordanian',
  profile_photo_url   VARCHAR(300),
  nursery_id          BIGINT UNSIGNED NULL,
  branch_id           BIGINT UNSIGNED NULL,
  class_id            BIGINT UNSIGNED NULL,
  health_notes        TEXT,
  educational_notes   TEXT,
  is_active           TINYINT(1) NOT NULL DEFAULT 1,
  enrollment_date     DATE,
  created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at          DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_children_nursery FOREIGN KEY (nursery_id) REFERENCES nurseries (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_children_branch FOREIGN KEY (branch_id) REFERENCES branches (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_children_class FOREIGN KEY (class_id) REFERENCES classes (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS child_parents (
  child_id    BIGINT UNSIGNED NOT NULL,
  parent_id   BIGINT UNSIGNED NOT NULL,
  relation    ENUM ('father', 'mother', 'guardian') NOT NULL,
  PRIMARY KEY (child_id, parent_id),
  CONSTRAINT fk_child_parents_child FOREIGN KEY (child_id) REFERENCES children (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_child_parents_parent FOREIGN KEY (parent_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS child_documents (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  child_id      BIGINT UNSIGNED NOT NULL,
  doc_type      ENUM ('birth_certificate', 'medical_certificate', 'other') NOT NULL,
  file_name     VARCHAR(180) NOT NULL,
  file_url      VARCHAR(400) NOT NULL,
  uploaded_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_child_documents_child FOREIGN KEY (child_id) REFERENCES children (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id                BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  child_id          BIGINT UNSIGNED NOT NULL,
  supervisor_id     BIGINT UNSIGNED NOT NULL,
  report_date       DATE NOT NULL,
  attendance_status ENUM ('present', 'absent', 'late') DEFAULT 'present',
  attendance_check_in  DATETIME NULL,
  attendance_check_out DATETIME NULL,
  behavior_notes    TEXT,
  health_temperature DECIMAL(4,1),
  health_mood       ENUM ('happy', 'calm', 'fussy', 'sick'),
  status            ENUM ('draft', 'submitted', 'approved', 'revision_needed') DEFAULT 'draft',
  manager_notes     TEXT,
  approved_by       BIGINT UNSIGNED NULL,
  approved_at       DATETIME NULL,
  photos            JSON,
  incidents         JSON,
  created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_daily_reports_child FOREIGN KEY (child_id) REFERENCES children (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_daily_reports_supervisor FOREIGN KEY (supervisor_id) REFERENCES users (id)
    ON DELETE SET NULL,
  CONSTRAINT fk_daily_reports_approver FOREIGN KEY (approved_by) REFERENCES users (id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS daily_report_meals (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id     BIGINT UNSIGNED NOT NULL,
  meal_type     ENUM ('breakfast', 'lunch', 'snack', 'dinner') NOT NULL,
  meal_time     DATETIME NULL,
  items         JSON,
  amount        ENUM ('all', 'most', 'some', 'none') DEFAULT 'all',
  notes         VARCHAR(255),
  CONSTRAINT fk_meals_report FOREIGN KEY (report_id) REFERENCES daily_reports (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_report_activities (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id      BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(150) NOT NULL,
  activity_time  DATETIME NULL,
  duration_min   SMALLINT UNSIGNED,
  participation  ENUM ('active', 'moderate', 'passive') DEFAULT 'active',
  notes          VARCHAR(255),
  CONSTRAINT fk_activities_report FOREIGN KEY (report_id) REFERENCES daily_reports (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_report_naps (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id      BIGINT UNSIGNED NOT NULL,
  start_time     DATETIME NULL,
  end_time       DATETIME NULL,
  quality        ENUM ('good', 'fair', 'poor'),
  CONSTRAINT fk_naps_report FOREIGN KEY (report_id) REFERENCES daily_reports (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_report_diaper_changes (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id      BIGINT UNSIGNED NOT NULL,
  change_time    DATETIME NULL,
  change_type    ENUM ('wet', 'soiled', 'both') NOT NULL,
  notes          VARCHAR(255),
  CONSTRAINT fk_diaper_report FOREIGN KEY (report_id) REFERENCES daily_reports (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS daily_report_medications (
  id             BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  report_id      BIGINT UNSIGNED NOT NULL,
  name           VARCHAR(150),
  dosage         VARCHAR(120),
  administration_time DATETIME,
  CONSTRAINT fk_medications_report FOREIGN KEY (report_id) REFERENCES daily_reports (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notifications (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  recipient_id     BIGINT UNSIGNED NOT NULL,
  recipient_role   ENUM ('admin', 'manager', 'supervisor', 'parent') NOT NULL,
  notification_type ENUM ('report_submitted', 'report_approved', 'child_absent', 'announcement', 'system') NOT NULL,
  title            VARCHAR(180) NOT NULL,
  message          TEXT NOT NULL,
  related_entity_type VARCHAR(120),
  related_entity_id   BIGINT UNSIGNED NULL,
  is_read          TINYINT(1) NOT NULL DEFAULT 0,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users (id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notification_channels (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  notification_id  BIGINT UNSIGNED NOT NULL,
  channel_type     ENUM ('in_app', 'push', 'email') NOT NULL,
  sent             TINYINT(1) NOT NULL DEFAULT 0,
  sent_at          DATETIME NULL,
  CONSTRAINT fk_notification_channels_notification FOREIGN KEY (notification_id)
    REFERENCES notifications (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NULL,
  action        ENUM ('create', 'read', 'update', 'delete', 'login', 'logout') NOT NULL,
  entity        VARCHAR(150) NOT NULL,
  entity_id     BIGINT UNSIGNED NULL,
  changes_json  JSON,
  ip_address    VARCHAR(45),
  user_agent    VARCHAR(255),
  occurred_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_audit_logs_user FOREIGN KEY (user_id) REFERENCES users (id)
    ON DELETE SET NULL
);

-- Index recommendations
CREATE INDEX idx_users_role ON users (role);
CREATE INDEX idx_users_nursery_branch ON users (nursery_id, branch_id);
CREATE INDEX idx_children_nursery ON children (nursery_id, branch_id);
CREATE INDEX idx_daily_reports_child_date ON daily_reports (child_id, report_date);
CREATE INDEX idx_notifications_recipient ON notifications (recipient_id, is_read);
CREATE INDEX idx_audit_logs_entity ON audit_logs (entity, entity_id);
