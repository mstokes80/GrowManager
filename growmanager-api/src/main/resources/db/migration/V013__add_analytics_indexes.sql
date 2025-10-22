-- V013__add_analytics_indexes.sql
-- Adds optimized indexes for analytics queries to support Phase 2 data visualization
-- Author: GrowManager Team - Database Engineer
-- Date: 2025-10-18

-- ============================================================================
-- ENVIRONMENTAL_SNAPSHOTS INDEXES
-- ============================================================================
-- NOTE: The following indexes already exist from V005:
-- - idx_environmental_snapshots_grow_id
-- - idx_environmental_snapshots_timestamp
-- - idx_environmental_snapshots_grow_id_timestamp
--
-- Adding additional indexes for analytics aggregation queries

-- Index for timestamp-only aggregation queries (daily/weekly/monthly rollups)
-- Used for: Global environmental trends across all grows
CREATE INDEX idx_environmental_snapshots_timestamp_agg
ON environmental_snapshots(timestamp DESC)
WHERE timestamp IS NOT NULL;

-- Composite index for plant-level environmental analysis
-- Used for: Plant-specific environmental tracking over time
CREATE INDEX idx_environmental_snapshots_plant_timestamp
ON environmental_snapshots(plant_id, timestamp DESC)
WHERE plant_id IS NOT NULL;

-- Partial index for sensor data queries (excludes manual entries)
-- Used for: Automated sensor data analysis and trends
CREATE INDEX idx_environmental_snapshots_sensor_data
ON environmental_snapshots(grow_id, timestamp DESC, source)
WHERE source = 'sensor';

-- ============================================================================
-- FEEDING_EVENTS INDEXES
-- ============================================================================
-- NOTE: The following indexes already exist from V006:
-- - idx_feeding_events_plant_id
-- - idx_feeding_events_fed_at
-- - idx_feeding_events_plant_id_fed_at
--
-- Adding indexes for analytics queries

-- Composite index for grow-level feeding timeline queries
-- Used for: Grow timeline views, feeding schedule analysis
-- Joins feeding_events to plants to get grow_id, then sorts by time
CREATE INDEX idx_feeding_events_grow_timeline
ON feeding_events(plant_id, fed_at DESC);

-- Index for EC/pH trend analysis by feeding type
-- Used for: Nutrient strength trends, pH stability analysis
CREATE INDEX idx_feeding_events_type_time_metrics
ON feeding_events(feeding_type, fed_at DESC, ec_level, ph_level)
WHERE ec_level IS NOT NULL OR ph_level IS NOT NULL;

-- Index for nutrient input aggregation queries
-- Used for: Total nutrient calculations, feed efficiency metrics
CREATE INDEX idx_feeding_events_plant_nutrients
ON feeding_events(plant_id, feeding_type, ec_level)
WHERE feeding_type = 'nutrients' AND ec_level IS NOT NULL;

-- ============================================================================
-- ACTIVITY_LOGS INDEXES
-- ============================================================================
-- NOTE: The following indexes already exist from V007:
-- - idx_activity_logs_plant_id
-- - idx_activity_logs_logged_at
-- - idx_activity_logs_plant_id_logged_at
-- - idx_activity_logs_activity_type
--
-- Adding indexes for analytics timeline queries

-- Composite index for filtering activities by type and time
-- Used for: Timeline filtering (e.g., show only training activities)
CREATE INDEX idx_activity_logs_type_time
ON activity_logs(activity_type, logged_at DESC);

-- Index for grow-level timeline aggregation
-- Note: Requires join through plants table to get grow_id
-- This index optimizes the plant_id side of the join
CREATE INDEX idx_activity_logs_plant_logged_at_type
ON activity_logs(plant_id, logged_at DESC, activity_type);

-- ============================================================================
-- HARVESTS INDEXES
-- ============================================================================
-- NOTE: The following indexes already exist from V009:
-- - idx_harvests_plant_id
-- - idx_harvests_grow_id
-- - idx_harvests_harvest_date
--
-- Adding indexes for yield analytics and cultivar comparison

-- Composite index for cultivar yield analysis over time
-- Used for: Cultivar comparison, yield trends by strain
-- Note: cultivar_id is not directly on harvests, requires join through plants
-- This index supports the harvest side of the join
CREATE INDEX idx_harvests_date_yield_quality
ON harvests(harvest_date DESC, dry_weight, quality_rating)
WHERE dry_weight IS NOT NULL;

-- Index for plant-specific harvest metrics
-- Used for: Individual plant performance tracking
CREATE INDEX idx_harvests_plant_metrics
ON harvests(plant_id, harvest_date DESC, wet_weight, dry_weight);

-- Index for grow-level yield aggregation
-- Used for: Total grow yield calculations, success rate analysis
CREATE INDEX idx_harvests_grow_date_weight
ON harvests(grow_id, harvest_date DESC, dry_weight)
WHERE dry_weight IS NOT NULL;

-- Partial index for quality-rated harvests
-- Used for: Quality analysis, top performers identification
CREATE INDEX idx_harvests_quality_analysis
ON harvests(quality_rating DESC, dry_weight, thc_percent, cbd_percent)
WHERE quality_rating IS NOT NULL;

-- ============================================================================
-- PLANTS TABLE ADDITIONAL INDEX
-- ============================================================================
-- Adding index to support cultivar-based queries for analytics
-- This helps with joins from harvests -> plants -> cultivars

-- Composite index for cultivar analysis queries
-- Used for: Linking harvests to cultivars for comparison analytics
CREATE INDEX idx_plants_cultivar_grow_stage
ON plants(cultivar_id, grow_id, stage)
WHERE cultivar_id IS NOT NULL;

-- Index for stage-based environmental analysis
-- Used for: Comparing environmental conditions between veg and flower stages
CREATE INDEX idx_plants_grow_stage
ON plants(grow_id, stage, status);

-- ============================================================================
-- PERFORMANCE NOTES
-- ============================================================================
-- These indexes are designed to support the following analytics query patterns:
--
-- 1. Time-series aggregations (daily/weekly/monthly rollups)
-- 2. Cross-table joins for cultivar comparisons
-- 3. Stage-based filtering (vegetative vs flowering)
-- 4. Multi-parameter filtering with time ranges
-- 5. Statistical calculations (min, max, avg, variance)
--
-- Expected query performance improvements:
-- - Environmental trend queries: <500ms for 1000+ snapshots
-- - Feeding analytics: <500ms for 500+ events
-- - Yield comparisons: <500ms for 100+ harvests
-- - Timeline queries: <500ms for 200+ activities
--
-- Index maintenance:
-- - PostgreSQL will automatically maintain these indexes
-- - VACUUM ANALYZE recommended after bulk data loads
-- - Monitor index usage with pg_stat_user_indexes
-- ============================================================================

-- Add comments for documentation
COMMENT ON INDEX idx_environmental_snapshots_timestamp_agg IS 'Optimized index for time-based environmental aggregation queries';
COMMENT ON INDEX idx_environmental_snapshots_plant_timestamp IS 'Index for plant-specific environmental tracking over time';
COMMENT ON INDEX idx_environmental_snapshots_sensor_data IS 'Partial index for automated sensor data analysis';
COMMENT ON INDEX idx_feeding_events_grow_timeline IS 'Index for grow-level feeding timeline and schedule analysis';
COMMENT ON INDEX idx_feeding_events_type_time_metrics IS 'Index for EC/pH trend analysis by feeding type';
COMMENT ON INDEX idx_feeding_events_plant_nutrients IS 'Index for nutrient input aggregation and efficiency calculations';
COMMENT ON INDEX idx_activity_logs_type_time IS 'Index for timeline filtering by activity type';
COMMENT ON INDEX idx_activity_logs_plant_logged_at_type IS 'Index for grow-level activity timeline aggregation';
COMMENT ON INDEX idx_harvests_date_yield_quality IS 'Index for cultivar yield analysis and quality trends';
COMMENT ON INDEX idx_harvests_plant_metrics IS 'Index for individual plant performance tracking';
COMMENT ON INDEX idx_harvests_grow_date_weight IS 'Index for grow-level yield aggregation';
COMMENT ON INDEX idx_harvests_quality_analysis IS 'Partial index for quality-rated harvest analysis';
COMMENT ON INDEX idx_plants_cultivar_grow_stage IS 'Index for cultivar-based analytics queries';
COMMENT ON INDEX idx_plants_grow_stage IS 'Index for stage-based environmental analysis';