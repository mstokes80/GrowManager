-- V002__create_cultivars_table.sql
-- Creates the cultivars table for storing cannabis strain/cultivar information
-- Author: GrowManager Team
-- Date: 2025-10-09

-- Create cultivars table
CREATE TABLE cultivars (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign key to users
    user_id UUID NOT NULL,

    -- Cultivar basic information
    name VARCHAR(255) NOT NULL,
    breeder VARCHAR(255),
    genetics TEXT,
    type VARCHAR(20) NOT NULL DEFAULT 'unknown',

    -- JSONB field for flexible characteristics storage
    -- Stores: flowering_time, yield, effects, terpenes, thc_content, cbd_content, etc.
    characteristics JSONB,

    -- General notes field for user comments
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraint with CASCADE delete
    CONSTRAINT fk_cultivars_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Type check constraint
    CONSTRAINT chk_cultivar_type CHECK (type IN ('indica', 'sativa', 'hybrid', 'auto', 'unknown'))
);

-- Create indexes for performance
CREATE INDEX idx_cultivars_user_id ON cultivars(user_id);
CREATE INDEX idx_cultivars_name ON cultivars(name);
CREATE INDEX idx_cultivars_user_id_name ON cultivars(user_id, name);
CREATE INDEX idx_cultivars_updated_at ON cultivars(updated_at DESC);

-- Create GIN index for JSONB characteristics field for efficient JSON queries
CREATE INDEX idx_cultivars_characteristics ON cultivars USING GIN (characteristics);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_cultivars_updated_at
    BEFORE UPDATE ON cultivars
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE cultivars IS 'Stores cannabis cultivar/strain information for each user';
COMMENT ON COLUMN cultivars.id IS 'Unique identifier for the cultivar (UUID)';
COMMENT ON COLUMN cultivars.user_id IS 'Foreign key to users table - owner of this cultivar record';
COMMENT ON COLUMN cultivars.name IS 'Name of the cultivar/strain';
COMMENT ON COLUMN cultivars.breeder IS 'Breeder or seed company that produced this cultivar';
COMMENT ON COLUMN cultivars.genetics IS 'Genetic lineage or parent strains';
COMMENT ON COLUMN cultivars.type IS 'Cultivar type: indica, sativa, hybrid, auto, or unknown';
COMMENT ON COLUMN cultivars.characteristics IS 'JSONB field storing flexible characteristics like flowering_time, yield, effects, terpenes, cannabinoid content, etc.';
COMMENT ON COLUMN cultivars.notes IS 'General notes field for user comments about the cultivar';
COMMENT ON COLUMN cultivars.created_at IS 'Timestamp when the cultivar record was created';
COMMENT ON COLUMN cultivars.updated_at IS 'Timestamp when the cultivar record was last updated';
