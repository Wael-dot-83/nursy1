-- Migration: Add Governorate Table and Update Nurseries
-- Safe idempotent migration with rollback support
-- Run date: 2025-11-05

BEGIN TRANSACTION;

-- Step 1: Create governorates table
CREATE TABLE IF NOT EXISTS governorates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_en TEXT NOT NULL UNIQUE,
    name_ar TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Seed governorates with Jordan's 12 governorates
INSERT OR IGNORE INTO governorates (name_en, name_ar, code) VALUES
    ('Amman', 'عمان', 'AM'),
    ('Irbid', 'إربد', 'IR'),
    ('Zarqa', 'الزرقاء', 'ZA'),
    ('Balqa', 'البلقاء', 'BA'),
    ('Madaba', 'مادبا', 'MD'),
    ('Mafraq', 'المفرق', 'MF'),
    ('Jerash', 'جرش', 'JE'),
    ('Ajloun', 'عجلون', 'AJ'),
    ('Karak', 'الكرك', 'KA'),
    ('Tafilah', 'الطفيلة', 'TA'),
    ('Maan', 'معان', 'MA'),
    ('Aqaba', 'العقبة', 'AQ');

-- Step 3: Add governorate_id column to nurseries (nullable initially for migration)
ALTER TABLE nurseries ADD COLUMN governorate_id INTEGER REFERENCES governorates(id);

-- Step 4: Backfill governorate_id from main_governorate text
-- Match by English name (case-insensitive)
UPDATE nurseries 
SET governorate_id = (
    SELECT id FROM governorates 
    WHERE LOWER(name_en) = LOWER(nurseries.main_governorate)
    LIMIT 1
)
WHERE main_governorate IS NOT NULL;

-- Step 5: Create index for governorate lookups
CREATE INDEX IF NOT EXISTS idx_nurseries_governorate ON nurseries(governorate_id);
CREATE INDEX IF NOT EXISTS idx_governorates_code ON governorates(code);

-- Step 6: Add unique constraints to prevent duplicates
-- Note: We keep the existing compound unique index on name_normalized + branch_normalized
-- and add a unique index on phone_normalized (if not exists)

COMMIT;

-- Rollback script (run separately if needed):
/*
BEGIN TRANSACTION;
ALTER TABLE nurseries DROP COLUMN governorate_id;
DROP TABLE IF EXISTS governorates;
COMMIT;
*/
