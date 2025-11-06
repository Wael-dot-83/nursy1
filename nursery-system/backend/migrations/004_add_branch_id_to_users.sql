-- Migration: Add branch_id to users table
-- Allows managers to be associated with specific branches
-- Run date: 2025-01-XX

BEGIN TRANSACTION;

-- Add branch_id column to users table (nullable for backward compatibility)
ALTER TABLE users ADD COLUMN branch_id INTEGER REFERENCES branches(id);

-- Create index for branch lookups
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

COMMIT;

-- Rollback script (run separately if needed):
/*
BEGIN TRANSACTION;
DROP INDEX IF EXISTS idx_users_branch;
ALTER TABLE users DROP COLUMN branch_id;
COMMIT;
*/
