-- V008__create_observations_table.sql
-- Creates the observations table for tracking plant observations and progress photos
-- Author: GrowManager Team
-- Date: 2025-10-10

-- Create observations table
CREATE TABLE observations (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    plant_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Observation details
    observation_type VARCHAR(20) NOT NULL,
    note TEXT,

    -- Media and tags
    photos TEXT[],  -- Array of S3 URLs for full-size photos
    tags TEXT[],    -- Array of tags for categorization

    -- Timing
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_observations_plant FOREIGN KEY (plant_id)
        REFERENCES plants(id) ON DELETE CASCADE,

    CONSTRAINT fk_observations_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Observation type check constraint
    CONSTRAINT chk_observation_type CHECK (observation_type IN ('health_check', 'deficiency', 'pest', 'disease', 'progress', 'other'))
);

-- Create indexes for performance
CREATE INDEX idx_observations_plant_id ON observations(plant_id);
CREATE INDEX idx_observations_user_id ON observations(user_id);
CREATE INDEX idx_observations_timestamp ON observations(timestamp DESC);
CREATE INDEX idx_observations_plant_id_timestamp ON observations(plant_id, timestamp DESC);
CREATE INDEX idx_observations_observation_type ON observations(observation_type);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_observations_updated_at
    BEFORE UPDATE ON observations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE observations IS 'Stores observations and progress photos for plants';
COMMENT ON COLUMN observations.id IS 'Unique identifier for the observation (UUID)';
COMMENT ON COLUMN observations.plant_id IS 'Foreign key to plants table - the plant being observed';
COMMENT ON COLUMN observations.user_id IS 'Foreign key to users table - the user who created the observation';
COMMENT ON COLUMN observations.observation_type IS 'Type of observation: health_check, deficiency, pest, disease, progress, or other';
COMMENT ON COLUMN observations.note IS 'Text note describing the observation';
COMMENT ON COLUMN observations.photos IS 'Array of S3 URLs for full-size photos';
COMMENT ON COLUMN observations.tags IS 'Array of tags for categorizing the observation';
COMMENT ON COLUMN observations.timestamp IS 'Timestamp when the observation was made';
COMMENT ON COLUMN observations.created_at IS 'Timestamp when the observation record was created';
COMMENT ON COLUMN observations.updated_at IS 'Timestamp when the observation record was last updated';