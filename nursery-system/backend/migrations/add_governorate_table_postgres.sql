-- PostgreSQL Migration: Add governorate table and relationship
-- This migration adds a governorates table with Jordan's 12 governorates,
-- adds a foreign key to the nurseries table, and backfills existing data.

-- =======================================================================
-- 1. Create governorates table
-- =======================================================================
CREATE TABLE IF NOT EXISTS governorates (
    id SERIAL PRIMARY KEY,
    name_en VARCHAR(100) NOT NULL UNIQUE,
    name_ar VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =======================================================================
-- 2. Insert Jordan's 12 governorates
-- =======================================================================
INSERT INTO governorates (name_en, name_ar, code)
VALUES
    ('Amman', 'عمان', 'AM'),
    ('Irbid', 'إربد', 'IR'),
    ('Zarqa', 'الزرقاء', 'ZA'),
    ('Balqa', 'البلقاء', 'BA'),
    ('Madaba', 'مادبا', 'MA'),
    ('Jerash', 'جرش', 'JE'),
    ('Ajloun', 'عجلون', 'AJ'),
    ('Karak', 'الكرك', 'KA'),
    ('Tafilah', 'الطفيلة', 'TA'),
    ('Ma''an', 'معان', 'MN'),
    ('Mafraq', 'المفرق', 'MF'),
    ('Aqaba', 'العقبة', 'AQ')
ON CONFLICT (name_en) DO NOTHING;

-- =======================================================================
-- 3. Add governorate_id column to nurseries table
-- =======================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'nurseries' 
        AND column_name = 'governorate_id'
    ) THEN
        ALTER TABLE nurseries ADD COLUMN governorate_id INTEGER;
        
        -- Add foreign key constraint
        ALTER TABLE nurseries 
        ADD CONSTRAINT fk_nurseries_governorate 
        FOREIGN KEY (governorate_id) 
        REFERENCES governorates(id) 
        ON DELETE SET NULL;
    END IF;
END $$;

-- =======================================================================
-- 4. Backfill governorate_id from main_governorate
-- =======================================================================
UPDATE nurseries n
SET governorate_id = g.id
FROM governorates g
WHERE n.main_governorate IS NOT NULL
  AND (
    LOWER(TRIM(n.main_governorate)) = LOWER(g.name_en)
    OR LOWER(TRIM(n.main_governorate)) = LOWER(g.name_ar)
  );

-- =======================================================================
-- 5. Create indexes for performance
-- =======================================================================
CREATE INDEX IF NOT EXISTS idx_governorates_code ON governorates(code);
CREATE INDEX IF NOT EXISTS idx_nurseries_governorate_id ON nurseries(governorate_id);

-- =======================================================================
-- Rollback instructions (run these in reverse order if needed):
-- =======================================================================
-- DROP INDEX IF EXISTS idx_nurseries_governorate_id;
-- DROP INDEX IF EXISTS idx_governorates_code;
-- ALTER TABLE nurseries DROP CONSTRAINT IF EXISTS fk_nurseries_governorate;
-- ALTER TABLE nurseries DROP COLUMN IF EXISTS governorate_id;
-- DROP TABLE IF EXISTS governorates;
