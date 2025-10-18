-- V006__create_feeding_events_table.sql
-- Creates the feeding_events table for tracking plant feeding and watering activities
-- Author: GrowManager Team
-- Date: 2025-10-10

-- Create feeding_events table
CREATE TABLE feeding_events (
    -- Primary key
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Foreign keys
    plant_id UUID NOT NULL,
    user_id UUID NOT NULL,

    -- Feeding details
    feeding_type VARCHAR(20) NOT NULL,
    amount_ml DECIMAL(10, 2) NOT NULL,
    ec_level DECIMAL(5, 2),
    ph_level DECIMAL(4, 2),
    nutrient_mix TEXT,
    notes TEXT,

    -- Timing
    fed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Audit fields
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Foreign key constraints
    CONSTRAINT fk_feeding_events_plant FOREIGN KEY (plant_id)
        REFERENCES plants(id) ON DELETE CASCADE,

    CONSTRAINT fk_feeding_events_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,

    -- Feeding type check constraint
    CONSTRAINT chk_feeding_event_type CHECK (feeding_type IN ('watering', 'nutrients', 'foliar')),

    -- Amount validation (must be positive)
    CONSTRAINT chk_feeding_event_amount CHECK (amount_ml > 0),

    -- EC level validation (0-10 mS/cm reasonable range)
    CONSTRAINT chk_feeding_event_ec CHECK (ec_level IS NULL OR (ec_level >= 0 AND ec_level <= 10)),

    -- pH level validation (0-14 pH scale)
    CONSTRAINT chk_feeding_event_ph CHECK (ph_level IS NULL OR (ph_level >= 0 AND ph_level <= 14))
);

-- Create indexes for performance
CREATE INDEX idx_feeding_events_plant_id ON feeding_events(plant_id);
CREATE INDEX idx_feeding_events_user_id ON feeding_events(user_id);
CREATE INDEX idx_feeding_events_fed_at ON feeding_events(fed_at DESC);
CREATE INDEX idx_feeding_events_plant_id_fed_at ON feeding_events(plant_id, fed_at DESC);
CREATE INDEX idx_feeding_events_feeding_type ON feeding_events(feeding_type);

-- Create trigger for auto-updating updated_at
CREATE TRIGGER update_feeding_events_updated_at
    BEFORE UPDATE ON feeding_events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE feeding_events IS 'Stores feeding and watering events for plants';
COMMENT ON COLUMN feeding_events.id IS 'Unique identifier for the feeding event (UUID)';
COMMENT ON COLUMN feeding_events.plant_id IS 'Foreign key to plants table - the plant that was fed';
COMMENT ON COLUMN feeding_events.user_id IS 'Foreign key to users table - the user who performed the feeding';
COMMENT ON COLUMN feeding_events.feeding_type IS 'Type of feeding: watering, nutrients, or foliar';
COMMENT ON COLUMN feeding_events.amount_ml IS 'Amount of liquid applied in milliliters';
COMMENT ON COLUMN feeding_events.ec_level IS 'Electrical conductivity in mS/cm (optional)';
COMMENT ON COLUMN feeding_events.ph_level IS 'pH level of the feeding solution (optional)';
COMMENT ON COLUMN feeding_events.nutrient_mix IS 'JSON or text description of nutrient mixture (optional)';
COMMENT ON COLUMN feeding_events.notes IS 'Additional notes about the feeding event';
COMMENT ON COLUMN feeding_events.fed_at IS 'Timestamp when the plant was fed';
COMMENT ON COLUMN feeding_events.created_at IS 'Timestamp when the feeding event record was created';
COMMENT ON COLUMN feeding_events.updated_at IS 'Timestamp when the feeding event record was last updated';