-- V005__create_environmental_snapshots_table.sql
-- Creates the environmental_snapshots table for tracking environmental conditions
-- Author: GrowManager Team
-- Date: 2025-10-09

-- Create environmental_snapshots table
CREATE TABLE environmental_snapshots (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    grow_id UUID NOT NULL,
    plant_id UUID,

    -- Snapshot timing
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Environmental measurements
    temperature DECIMAL(5, 2),
    humidity DECIMAL(5, 2),
    co2 DECIMAL(7, 2),
    light_intensity DECIMAL(8, 2),
    vpd DECIMAL(5, 2),

    -- Data source
    source VARCHAR(20) NOT NULL DEFAULT 'manual',

    -- Additional notes
    notes TEXT,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_environmental_snapshots_grow FOREIGN KEY (grow_id)
        REFERENCES grows(id) ON DELETE CASCADE,

    CONSTRAINT fk_environmental_snapshots_plant FOREIGN KEY (plant_id)
        REFERENCES plants(id) ON DELETE CASCADE,

    -- Source check constraint
    CONSTRAINT chk_environmental_snapshot_source CHECK (source IN ('manual', 'sensor')),

    -- Temperature range validation (Celsius: -50 to 100)
    CONSTRAINT chk_temperature_range CHECK (temperature IS NULL OR (temperature >= -50 AND temperature <= 100)),

    -- Humidity percentage validation (0-100%)
    CONSTRAINT chk_humidity_range CHECK (humidity IS NULL OR (humidity >= 0 AND humidity <= 100)),

    -- CO2 validation (0-5000 ppm reasonable range)
    CONSTRAINT chk_co2_range CHECK (co2 IS NULL OR (co2 >= 0 AND co2 <= 5000)),

    -- Light intensity validation (0-2000 PPFD reasonable range)
    CONSTRAINT chk_light_intensity_range CHECK (light_intensity IS NULL OR (light_intensity >= 0 AND light_intensity <= 2000)),

    -- VPD validation (0-5.0 kPa reasonable range)
    CONSTRAINT chk_vpd_range CHECK (vpd IS NULL OR (vpd >= 0 AND vpd <= 5.0))
);

-- Create indexes for performance
CREATE INDEX idx_environmental_snapshots_grow_id ON environmental_snapshots(grow_id);
CREATE INDEX idx_environmental_snapshots_plant_id ON environmental_snapshots(plant_id);
CREATE INDEX idx_environmental_snapshots_timestamp ON environmental_snapshots(timestamp DESC);
CREATE INDEX idx_environmental_snapshots_grow_id_timestamp ON environmental_snapshots(grow_id, timestamp DESC);
CREATE INDEX idx_environmental_snapshots_source ON environmental_snapshots(source);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_environmental_snapshots_updated_at
    BEFORE UPDATE ON environmental_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE environmental_snapshots IS 'Stores environmental condition measurements for grows and plants';
COMMENT ON COLUMN environmental_snapshots.id IS 'Unique identifier for the snapshot (UUID)';
COMMENT ON COLUMN environmental_snapshots.grow_id IS 'Foreign key to grows table - the grow this snapshot belongs to';
COMMENT ON COLUMN environmental_snapshots.plant_id IS 'Foreign key to plants table - specific plant (nullable for grow-level snapshots)';
COMMENT ON COLUMN environmental_snapshots.timestamp IS 'When this environmental reading was taken';
COMMENT ON COLUMN environmental_snapshots.temperature IS 'Temperature in Celsius';
COMMENT ON COLUMN environmental_snapshots.humidity IS 'Relative humidity percentage (0-100)';
COMMENT ON COLUMN environmental_snapshots.co2 IS 'CO2 concentration in ppm';
COMMENT ON COLUMN environmental_snapshots.light_intensity IS 'Light intensity in PPFD (Photosynthetic Photon Flux Density)';
COMMENT ON COLUMN environmental_snapshots.vpd IS 'Vapor Pressure Deficit in kPa';
COMMENT ON COLUMN environmental_snapshots.source IS 'Data source: manual entry or sensor reading';
COMMENT ON COLUMN environmental_snapshots.notes IS 'Additional notes about this environmental reading';
COMMENT ON COLUMN environmental_snapshots.created_at IS 'Timestamp when the snapshot record was created';
COMMENT ON COLUMN environmental_snapshots.updated_at IS 'Timestamp when the snapshot record was last updated';
