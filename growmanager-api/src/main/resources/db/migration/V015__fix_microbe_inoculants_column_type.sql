-- ============================================================================
-- Fix microbe_inoculants column type from TEXT to JSONB
-- ============================================================================
-- Corrects the column type to match the entity definition
-- ============================================================================

ALTER TABLE grows ALTER COLUMN microbe_inoculants TYPE JSONB USING microbe_inoculants::jsonb;