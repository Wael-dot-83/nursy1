-- Migration: ensure normalized nursery data is populated
-- This script is compatible with SQLite and MySQL.

-- Populate missing normalized columns for nurseries
UPDATE nurseries
SET name_normalized = LOWER(TRIM(name))
WHERE name IS NOT NULL
  AND (name_normalized IS NULL OR name_normalized = '');

UPDATE nurseries
SET branch_normalized = ''
WHERE branch_normalized IS NULL;

UPDATE nurseries
SET phone_normalized = COALESCE(phone_normalized, main_phone)
WHERE phone_normalized IS NULL OR phone_normalized = '';

-- Populate normalized email column for users
UPDATE users
SET email_normalized = LOWER(TRIM(email))
WHERE email IS NOT NULL
  AND (email_normalized IS NULL OR email_normalized = '');
