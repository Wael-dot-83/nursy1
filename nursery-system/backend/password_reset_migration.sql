-- Password Reset Migration for SQLite
-- Run this to add password reset tables to your database

BEGIN TRANSACTION;

-- Create password reset OTPs table
CREATE TABLE password_reset_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    otp_hash TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    attempts INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create password reset attempts table
CREATE TABLE password_reset_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT NOT NULL,
    ip_address TEXT NOT NULL,
    user_agent TEXT,
    success INTEGER DEFAULT 0,
    failure_reason TEXT,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for password reset OTPs
CREATE INDEX idx_phone ON password_reset_otps(phone);
CREATE INDEX idx_expires ON password_reset_otps(expires_at);
CREATE INDEX idx_used ON password_reset_otps(used);

-- Create indexes for password reset attempts
CREATE INDEX idx_phone_attempts ON password_reset_attempts(phone, attempted_at);
CREATE INDEX idx_ip_attempts ON password_reset_attempts(ip_address, attempted_at);

-- Add columns to users table for password reset tracking
ALTER TABLE users ADD last_password_reset TIMESTAMP NULL;
ALTER TABLE users ADD password_reset_count INTEGER DEFAULT 0;

COMMIT;