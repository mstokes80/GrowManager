-- V009__create_harvests_table.sql
-- Creates the harvests table for tracking plant harvest data
-- Author: GrowManager Team
-- Date: 2025-10-14

-- Create harvests table
CREATE TABLE harvests (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    plant_id UUID NOT NULL,
    grow_id UUID NOT NULL,

    -- Harvest data
    harvest_date DATE NOT NULL,
    wet_weight DECIMAL(8,2) NOT NULL,
    dry_weight DECIMAL(8,2),
    weight_unit VARCHAR(10) NOT NULL DEFAULT 'GRAMS',

    -- Potency and quality data
    thc_percent DECIMAL(4,2),
    cbd_percent DECIMAL(4,2),
    terpene_profile JSONB,
    quality_rating INTEGER,
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_harvests_plant FOREIGN KEY (plant_id)
        REFERENCES plants(id) ON DELETE CASCADE,

    CONSTRAINT fk_harvests_grow FOREIGN KEY (grow_id)
        REFERENCES grows(id) ON DELETE CASCADE,

    -- Check constraints
    CONSTRAINT chk_harvest_weight_unit CHECK (weight_unit IN ('GRAMS', 'OUNCES')),
    CONSTRAINT chk_harvest_quality_rating CHECK (quality_rating >= 1 AND quality_rating <= 10),
    CONSTRAINT chk_harvest_wet_weight CHECK (wet_weight > 0),
    CONSTRAINT chk_harvest_dry_weight CHECK (dry_weight IS NULL OR dry_weight > 0),
    CONSTRAINT chk_harvest_thc_percent CHECK (thc_percent IS NULL OR (thc_percent >= 0 AND thc_percent <= 100)),
    CONSTRAINT chk_harvest_cbd_percent CHECK (cbd_percent IS NULL OR (cbd_percent >= 0 AND cbd_percent <= 100))
);

-- Create indexes for performance
CREATE INDEX idx_harvests_plant_id ON harvests(plant_id);
CREATE INDEX idx_harvests_grow_id ON harvests(grow_id);
CREATE INDEX idx_harvests_harvest_date ON harvests(harvest_date DESC);
CREATE INDEX idx_harvests_updated_at ON harvests(updated_at DESC);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_harvests_updated_at
    BEFORE UPDATE ON harvests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE harvests IS 'Stores harvest records for plants';
COMMENT ON COLUMN harvests.id IS 'Unique identifier for the harvest (UUID)';
COMMENT ON COLUMN harvests.plant_id IS 'Foreign key to plants table - the plant that was harvested';
COMMENT ON COLUMN harvests.grow_id IS 'Foreign key to grows table - the grow this harvest belongs to';
COMMENT ON COLUMN harvests.harvest_date IS 'Date when the plant was harvested';
COMMENT ON COLUMN harvests.wet_weight IS 'Wet weight of the harvest';
COMMENT ON COLUMN harvests.dry_weight IS 'Dry weight of the harvest (nullable, added after drying)';
COMMENT ON COLUMN harvests.weight_unit IS 'Unit of weight measurement: grams or ounces';
COMMENT ON COLUMN harvests.thc_percent IS 'THC percentage (0-100)';
COMMENT ON COLUMN harvests.cbd_percent IS 'CBD percentage (0-100)';
COMMENT ON COLUMN harvests.terpene_profile IS 'JSONB terpene profile data';
COMMENT ON COLUMN harvests.quality_rating IS 'Quality rating from 1-10';
COMMENT ON COLUMN harvests.notes IS 'Notes about this harvest';
COMMENT ON COLUMN harvests.created_at IS 'Timestamp when the harvest record was created';
COMMENT ON COLUMN harvests.updated_at IS 'Timestamp when the harvest record was last updated';