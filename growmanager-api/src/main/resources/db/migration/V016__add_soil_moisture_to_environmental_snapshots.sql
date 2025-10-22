-- ============================================================================
-- Add soil moisture field to environmental_snapshots table
-- ============================================================================
-- Adds soil moisture measurement in kPa (kilopascals) to track soil water tension
-- ============================================================================

ALTER TABLE environmental_snapshots ADD COLUMN soil_moisture DECIMAL(6,2);

-- Add comment for documentation
COMMENT ON COLUMN environmental_snapshots.soil_moisture IS 'Soil moisture tension measured in kPa (0-200 kPa range, where lower values indicate wetter soil)';