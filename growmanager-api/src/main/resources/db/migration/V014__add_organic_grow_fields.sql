-- ============================================================================
-- Add organic growing fields to grows table
-- ============================================================================
-- Adds fields to support organic growing methodology tracking including
-- soil characteristics, amendments, and reuse cycles
-- ============================================================================

-- Add organic growing indicator
ALTER TABLE grows ADD COLUMN is_organic BOOLEAN DEFAULT FALSE;

-- Soil characteristics
ALTER TABLE grows ADD COLUMN soil_source VARCHAR(255);
ALTER TABLE grows ADD COLUMN soil_texture VARCHAR(100);
ALTER TABLE grows ADD COLUMN organic_matter_percent DECIMAL(5,2);
ALTER TABLE grows ADD COLUMN base_nutrient_profile VARCHAR(255);

-- Soil reuse tracking
ALTER TABLE grows ADD COLUMN soil_reused_cycles INTEGER DEFAULT 0;

-- Beneficial biology
ALTER TABLE grows ADD COLUMN mycorrhizae_added BOOLEAN DEFAULT FALSE;
ALTER TABLE grows ADD COLUMN microbe_inoculants TEXT; -- JSON array stored as text

-- Cover crops and mulching
ALTER TABLE grows ADD COLUMN cover_crop_type VARCHAR(255);
ALTER TABLE grows ADD COLUMN mulch_type VARCHAR(255);

-- Compost reuse
ALTER TABLE grows ADD COLUMN compost_reused BOOLEAN DEFAULT FALSE;

-- Add comments for documentation
COMMENT ON COLUMN grows.is_organic IS 'Indicates if grow uses organic methodology';
COMMENT ON COLUMN grows.soil_source IS 'Source/brand of soil used (e.g., "Coast of Maine Stonington Blend")';
COMMENT ON COLUMN grows.soil_texture IS 'Soil texture type (e.g., "loamy", "sandy", "clay")';
COMMENT ON COLUMN grows.organic_matter_percent IS 'Percentage of organic matter in soil';
COMMENT ON COLUMN grows.base_nutrient_profile IS 'Base NPK profile from soil/compost (e.g., "3-1-2 (compost base)")';
COMMENT ON COLUMN grows.soil_reused_cycles IS 'Number of times soil has been reused/cycled';
COMMENT ON COLUMN grows.mycorrhizae_added IS 'Whether mycorrhizal fungi were added to soil';
COMMENT ON COLUMN grows.microbe_inoculants IS 'JSON array of microbial inoculants used (e.g., ["Recharge", "Mammoth P"])';
COMMENT ON COLUMN grows.cover_crop_type IS 'Type of cover crop used if any';
COMMENT ON COLUMN grows.mulch_type IS 'Type of mulch used (e.g., "straw", "wood chips")';
COMMENT ON COLUMN grows.compost_reused IS 'Whether compost was reused from previous grows';