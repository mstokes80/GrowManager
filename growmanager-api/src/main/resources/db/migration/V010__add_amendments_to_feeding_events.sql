-- V010__add_amendments_to_feeding_events.sql
-- Adds amendments JSON column to feeding_events for organic soil amendments
-- Author: GrowManager Team
-- Date: 2025-10-15

-- Add amendments column to store array of organic soil amendments
-- Format: [{"name": "Kelp Meal", "amount": 4, "unit": "cups"}, {...}]
ALTER TABLE feeding_events
ADD COLUMN amendments JSONB;

-- Add comment for documentation
COMMENT ON COLUMN feeding_events.amendments IS 'JSON array of soil amendments: [{"name": "Amendment Name", "amount": 4.0, "unit": "cups"}]';

-- Create index for JSON queries (for searching by amendment name)
CREATE INDEX idx_feeding_events_amendments ON feeding_events USING GIN (amendments);