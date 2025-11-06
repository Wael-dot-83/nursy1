-- Migration: Add normalization columns and unique constraints for nurseries
-- SQLite compatible, portable to MySQL

-- Add normalized columns to nurseries table
ALTER TABLE nurseries ADD COLUMN name_normalized TEXT;
ALTER TABLE nurseries ADD COLUMN is_branch BOOLEAN DEFAULT 0 NOT NULL;
ALTER TABLE nurseries ADD COLUMN branch_name TEXT;
ALTER TABLE nurseries ADD COLUMN branch_normalized TEXT;
ALTER TABLE nurseries ADD COLUMN phone_normalized TEXT;

-- Add normalized email column to users table (if not exists)
ALTER TABLE users ADD COLUMN email_normalized TEXT;
ALTER TABLE users ADD COLUMN must_reset_password BOOLEAN DEFAULT 0 NOT NULL

-- Create unique indexes (SQLite syntax)
CREATE UNIQUE INDEX idx_nurseries_name_branch ON nurseries(name_normalized, branch_normalized);
CREATE UNIQUE INDEX idx_nurseries_phone ON nurseries(phone_normalized);
CREATE UNIQUE INDEX idx_users_email_normalized ON users(email_normalized);

-- Populate normalized columns from existing data
UPDATE nurseries SET 
    name_normalized = LOWER(TRIM(name)),
    branch_normalized = '',
    phone_normalized = main_phone
WHERE name_normalized IS NULL;

UPDATE users SET 
    email_normalized = LOWER(TRIM(email))
WHERE email_normalized IS NULL AND email IS NOT NULL;
