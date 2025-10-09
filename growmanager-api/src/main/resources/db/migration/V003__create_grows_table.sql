-- V003__create_grows_table.sql
-- Creates the grows table for tracking grow cycles/projects
-- Author: GrowManager Team
-- Date: 2025-10-09

-- Create grows table
CREATE TABLE grows (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to users
    user_id UUID NOT NULL,

    -- Grow basic information
    name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'planning',
    environment_type VARCHAR(20),
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint with CASCADE delete
    CONSTRAINT fk_grows_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Status check constraint
    CONSTRAINT chk_grow_status CHECK (status IN ('planning', 'active', 'flowering', 'drying', 'completed')),

    -- Environment type check constraint
    CONSTRAINT chk_environment_type CHECK (environment_type IS NULL OR environment_type IN ('indoor', 'outdoor', 'greenhouse')),

    -- End date must be after start date if present
    CONSTRAINT chk_grow_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Create indexes for performance
CREATE INDEX idx_grows_user_id ON grows(user_id);
CREATE INDEX idx_grows_status ON grows(status);
CREATE INDEX idx_grows_user_id_status ON grows(user_id, status);
CREATE INDEX idx_grows_updated_at ON grows(updated_at DESC);
CREATE INDEX idx_grows_start_date ON grows(start_date DESC);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_grows_updated_at
    BEFORE UPDATE ON grows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE grows IS 'Stores grow cycles/projects for tracking cannabis cultivation';
COMMENT ON COLUMN grows.id IS 'Unique identifier for the grow (UUID)';
COMMENT ON COLUMN grows.user_id IS 'Foreign key to users table - owner of this grow';
COMMENT ON COLUMN grows.name IS 'Name/title of the grow cycle';
COMMENT ON COLUMN grows.start_date IS 'Date when the grow cycle started';
COMMENT ON COLUMN grows.end_date IS 'Date when the grow cycle ended (nullable for active grows)';
COMMENT ON COLUMN grows.status IS 'Current status: planning, active, flowering, drying, or completed';
COMMENT ON COLUMN grows.environment_type IS 'Growing environment: indoor, outdoor, or greenhouse';
COMMENT ON COLUMN grows.notes IS 'General notes about this grow cycle';
COMMENT ON COLUMN grows.created_at IS 'Timestamp when the grow record was created';
COMMENT ON COLUMN grows.updated_at IS 'Timestamp when the grow record was last updated';
