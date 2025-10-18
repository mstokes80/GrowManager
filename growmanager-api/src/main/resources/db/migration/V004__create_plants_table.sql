-- V004__create_plants_table.sql
-- Creates the plants table for tracking individual plants within grows
-- Author: GrowManager Team
-- Date: 2025-10-09

-- Create plants table
CREATE TABLE plants (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    grow_id UUID NOT NULL,
    cultivar_id UUID,

    -- Plant identification and tracking
    tag VARCHAR(100) NOT NULL,
    stage VARCHAR(20) NOT NULL DEFAULT 'seedling',
    status VARCHAR(20) NOT NULL DEFAULT 'active',

    -- Plant details
    planted_date DATE,
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_plants_grow FOREIGN KEY (grow_id)
        REFERENCES grows(id) ON DELETE CASCADE,

    CONSTRAINT fk_plants_cultivar FOREIGN KEY (cultivar_id)
        REFERENCES cultivars(id) ON DELETE SET NULL,

    -- Stage check constraint
    CONSTRAINT chk_plant_stage CHECK (stage IN ('seedling', 'vegetative', 'flowering', 'harvest')),

    -- Status check constraint
    CONSTRAINT chk_plant_status CHECK (status IN ('active', 'harvested', 'removed', 'dead')),

    -- Unique constraint for tag within a grow
    CONSTRAINT uq_plants_grow_id_tag UNIQUE (grow_id, tag)
);

-- Create indexes for performance
CREATE INDEX idx_plants_grow_id ON plants(grow_id);
CREATE INDEX idx_plants_cultivar_id ON plants(cultivar_id);
CREATE INDEX idx_plants_stage ON plants(stage);
CREATE INDEX idx_plants_status ON plants(status);
CREATE INDEX idx_plants_updated_at ON plants(updated_at DESC);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_plants_updated_at
    BEFORE UPDATE ON plants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE plants IS 'Stores individual plant records within grow cycles';
COMMENT ON COLUMN plants.id IS 'Unique identifier for the plant (UUID)';
COMMENT ON COLUMN plants.grow_id IS 'Foreign key to grows table - the grow this plant belongs to';
COMMENT ON COLUMN plants.cultivar_id IS 'Foreign key to cultivars table - the cultivar of this plant (nullable)';
COMMENT ON COLUMN plants.tag IS 'Plant identifier/tag (unique within a grow)';
COMMENT ON COLUMN plants.stage IS 'Growth stage: seedling, vegetative, flowering, or harvest';
COMMENT ON COLUMN plants.status IS 'Plant status: active, harvested, removed, or dead';
COMMENT ON COLUMN plants.planted_date IS 'Date when the plant was planted';
COMMENT ON COLUMN plants.notes IS 'Notes about this specific plant';
COMMENT ON COLUMN plants.created_at IS 'Timestamp when the plant record was created';
COMMENT ON COLUMN plants.updated_at IS 'Timestamp when the plant record was last updated';
