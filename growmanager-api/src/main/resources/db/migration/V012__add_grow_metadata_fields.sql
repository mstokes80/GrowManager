-- V012__add_grow_metadata_fields.sql
-- Adds metadata fields to grows table for better grow tracking
-- Author: GrowManager Team
-- Date: 2025-10-18

-- Add new columns to grows table
ALTER TABLE grows
    ADD COLUMN lighting_type VARCHAR(20),
    ADD COLUMN medium_type VARCHAR(20),
    ADD COLUMN location VARCHAR(255),
    ADD COLUMN target_temp_min DECIMAL(5, 2),
    ADD COLUMN target_temp_max DECIMAL(5, 2),
    ADD COLUMN target_humidity_min DECIMAL(5, 2),
    ADD COLUMN target_humidity_max DECIMAL(5, 2),
    ADD COLUMN expected_harvest_date DATE,
    ADD COLUMN tags JSONB;

-- Add check constraints for lighting type
ALTER TABLE grows
    ADD CONSTRAINT chk_lighting_type
    CHECK (lighting_type IS NULL OR lighting_type IN ('led', 'hps', 'mh', 'cmh', 'fluorescent', 'natural'));

-- Add check constraints for medium type
ALTER TABLE grows
    ADD CONSTRAINT chk_medium_type
    CHECK (medium_type IS NULL OR medium_type IN ('soil', 'coco', 'hydro', 'aeroponics', 'aquaponics'));

-- Add check constraints for temperature ranges
ALTER TABLE grows
    ADD CONSTRAINT chk_target_temp_min_range
    CHECK (target_temp_min IS NULL OR (target_temp_min >= -50 AND target_temp_min <= 100)),
    ADD CONSTRAINT chk_target_temp_max_range
    CHECK (target_temp_max IS NULL OR (target_temp_max >= -50 AND target_temp_max <= 100)),
    ADD CONSTRAINT chk_target_temp_order
    CHECK (target_temp_min IS NULL OR target_temp_max IS NULL OR target_temp_min <= target_temp_max);

-- Add check constraints for humidity ranges
ALTER TABLE grows
    ADD CONSTRAINT chk_target_humidity_min_range
    CHECK (target_humidity_min IS NULL OR (target_humidity_min >= 0 AND target_humidity_min <= 100)),
    ADD CONSTRAINT chk_target_humidity_max_range
    CHECK (target_humidity_max IS NULL OR (target_humidity_max >= 0 AND target_humidity_max <= 100)),
    ADD CONSTRAINT chk_target_humidity_order
    CHECK (target_humidity_min IS NULL OR target_humidity_max IS NULL OR target_humidity_min <= target_humidity_max);

-- Create index on lighting_type for filtering
CREATE INDEX idx_grows_lighting_type ON grows(lighting_type);

-- Create index on medium_type for filtering
CREATE INDEX idx_grows_medium_type ON grows(medium_type);

-- Create GIN index on tags for efficient JSONB queries
CREATE INDEX idx_grows_tags ON grows USING GIN(tags);

-- Add comments for documentation
COMMENT ON COLUMN grows.lighting_type IS 'Type of lighting used (LED, HPS, MH, CMH, Fluorescent, Natural)';
COMMENT ON COLUMN grows.medium_type IS 'Growing medium type (Soil, Coco, Hydro, Aeroponics, Aquaponics)';
COMMENT ON COLUMN grows.location IS 'Optional location description for the grow';
COMMENT ON COLUMN grows.target_temp_min IS 'Target minimum temperature in Celsius';
COMMENT ON COLUMN grows.target_temp_max IS 'Target maximum temperature in Celsius';
COMMENT ON COLUMN grows.target_humidity_min IS 'Target minimum humidity percentage';
COMMENT ON COLUMN grows.target_humidity_max IS 'Target maximum humidity percentage';
COMMENT ON COLUMN grows.expected_harvest_date IS 'Expected harvest date for planning';
COMMENT ON COLUMN grows.tags IS 'JSONB array of tags for categorization (e.g., ["LED", "Organic"])';