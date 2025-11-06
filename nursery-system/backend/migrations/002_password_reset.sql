-- Password Reset Migration
-- SQLite compatible, portable to MySQL

-- Add password reset columns to users table
ALTER TABLE users ADD COLUMN last_password_reset DATETIME;
ALTER TABLE users ADD COLUMN password_reset_count INTEGER DEFAULT 0 NOT NULL;

-- Create password_reset_otps table
CREATE TABLE IF NOT EXISTS password_reset_otps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(15) NOT NULL,
    otp_hash VARCHAR(255) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempts INTEGER DEFAULT 0,
    used BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phone ON password_reset_otps(phone);
CREATE INDEX idx_expires ON password_reset_otps(expires_at);

-- Create password_reset_attempts table
CREATE TABLE IF NOT EXISTS password_reset_attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone VARCHAR(15) NOT NULL,
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    success BOOLEAN DEFAULT 0,
    failure_reason VARCHAR(200),
    attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_phone_attempts ON password_reset_attempts(phone, attempted_at);
CREATE INDEX idx_ip_attempts ON password_reset_attempts(ip_address, attempted_at);
