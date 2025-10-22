-- ============================================================================
-- Add hash yield field to harvests table
-- ============================================================================
-- Adds hash yield measurement for growers who freeze fresh harvest and
-- process into hash instead of traditional drying
-- ============================================================================

ALTER TABLE harvests ADD COLUMN hash_yield DECIMAL(8,2);

-- Add comment for documentation
COMMENT ON COLUMN harvests.hash_yield IS 'Yield of hash produced from fresh frozen harvest (in grams)';