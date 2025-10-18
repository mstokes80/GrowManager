-- V007__create_activity_logs_table.sql
-- Creates the activity_logs table for tracking plant activities and maintenance
-- Author: GrowManager Team
-- Date: 2025-10-10

-- Create activity_logs table
CREATE TABLE activity_logs (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    plant_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Activity details
    activity_type VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    notes TEXT,

    -- Timing
    logged_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_activity_logs_plant FOREIGN KEY (plant_id)
        REFERENCES plants(id) ON DELETE CASCADE,

    CONSTRAINT fk_activity_logs_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Activity type check constraint
    CONSTRAINT chk_activity_log_type CHECK (activity_type IN ('training', 'pruning', 'defoliation', 'transplant', 'pest_control', 'other'))
);

-- Create indexes for performance
CREATE INDEX idx_activity_logs_plant_id ON activity_logs(plant_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_logged_at ON activity_logs(logged_at DESC);
CREATE INDEX idx_activity_logs_plant_id_logged_at ON activity_logs(plant_id, logged_at DESC);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON activity_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE activity_logs IS 'Stores activity and maintenance logs for plants';
COMMENT ON COLUMN activity_logs.id IS 'Unique identifier for the activity log (UUID)';
COMMENT ON COLUMN activity_logs.plant_id IS 'Foreign key to plants table - the plant this activity was performed on';
COMMENT ON COLUMN activity_logs.user_id IS 'Foreign key to users table - the user who performed the activity';
COMMENT ON COLUMN activity_logs.activity_type IS 'Type of activity: training, pruning, defoliation, transplant, pest_control, or other';
COMMENT ON COLUMN activity_logs.description IS 'Description of the activity performed';
COMMENT ON COLUMN activity_logs.notes IS 'Additional notes about the activity';
COMMENT ON COLUMN activity_logs.logged_at IS 'Timestamp when the activity was performed';
COMMENT ON COLUMN activity_logs.created_at IS 'Timestamp when the activity log record was created';
COMMENT ON COLUMN activity_logs.updated_at IS 'Timestamp when the activity log record was last updated';