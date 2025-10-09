-- V001__create_users_table.sql
-- Creates the users table with all necessary fields and constraints for authentication
-- Author: GrowManager Team
-- Date: 2025-10-09

-- Create extension for UUID generation if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE users (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Authentication fields
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- User profile fields
    display_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    timezone VARCHAR(50) DEFAULT 'UTC',

    -- Email verification fields
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    email_verification_token VARCHAR(255),
    email_verification_expires_at TIMESTAMP,

    -- Password reset fields
    password_reset_token VARCHAR(255),
    password_reset_expires_at TIMESTAMP,

    -- Account security fields
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    account_locked_until TIMESTAMP,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_role CHECK (role IN ('USER', 'ADMIN')),
    CONSTRAINT chk_failed_login_attempts CHECK (failed_login_attempts >= 0)
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token) WHERE email_verification_token IS NOT NULL;
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token) WHERE password_reset_token IS NOT NULL;

-- Create trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts and authentication information';
COMMENT ON COLUMN users.id IS 'Unique identifier for the user (UUID)';
COMMENT ON COLUMN users.email IS 'User email address (unique, used for login)';
COMMENT ON COLUMN users.password_hash IS 'BCrypt hashed password - never store plain text';
COMMENT ON COLUMN users.display_name IS 'User display name shown in the application';
COMMENT ON COLUMN users.role IS 'User role: USER for regular users, ADMIN for administrators';
COMMENT ON COLUMN users.timezone IS 'User preferred timezone for date/time display';
COMMENT ON COLUMN users.email_verified IS 'Whether the user has verified their email address';
COMMENT ON COLUMN users.email_verification_token IS 'Token sent to user for email verification';
COMMENT ON COLUMN users.email_verification_expires_at IS 'Expiration time for email verification token';
COMMENT ON COLUMN users.password_reset_token IS 'Token sent to user for password reset';
COMMENT ON COLUMN users.password_reset_expires_at IS 'Expiration time for password reset token';
COMMENT ON COLUMN users.failed_login_attempts IS 'Counter for failed login attempts (for security)';
COMMENT ON COLUMN users.account_locked_until IS 'Timestamp until which account is locked due to failed attempts';
COMMENT ON COLUMN users.created_at IS 'Timestamp when the user account was created';
COMMENT ON COLUMN users.updated_at IS 'Timestamp when the user account was last updated';