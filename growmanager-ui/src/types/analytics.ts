/**
 * Analytics Type Definitions
 * TypeScript types for analytics API requests and responses
 */

import type { Amendment } from './feedingEvent';

// ============================================================================
// Dashboard Metrics Types
// ============================================================================

export interface EnvironmentalQualityIndicator {
  parameter: 'temperature' | 'humidity' | 'vpd' | 'co2' | 'light';
  currentValue: number;
  unit: string;
  status: 'optimal' | 'warning' | 'critical';
  optimalMin?: number;
  optimalMax?: number;
}

export interface PlantStageDistribution {
  stage: 'seedling' | 'vegetative' | 'flowering' | 'harvested';
  count: number;
  percentage: number;
}

export interface IssueTrackingSummary {
  totalIssues: number;
  unresolvedCount: number;
  resolvedCount: number;
  trend: 'up' | 'down' | 'stable';
  recentIssues: Array<{
    id: string;
    type: string;
    description: string;
    createdAt: string;
  }>;
}

export interface RecentActivity {
  id: string;
  type: 'feeding' | 'watering' | 'training' | 'pruning' | 'observation' | 'transplanting';
  description: string;
  plantId?: string;
  plantTag?: string;
  growId: string;
  growName: string;
  timestamp: string;
}

export interface DashboardMetricsResponse {
  environmentalQuality: EnvironmentalQualityIndicator[];
  plantStageDistribution: PlantStageDistribution[];
  issueTracking: IssueTrackingSummary;
  recentActivities: RecentActivity[];
  summary: {
    activeGrows: number;
    activePlants: number;
    totalObservations: number;
    upcomingHarvests: number;
  };
}

// ============================================================================
// Environmental Trends Types
// ============================================================================

export interface EnvironmentalDataPoint {
  timestamp: string;
  temperature?: number;
  temperatureMin?: number;
  temperatureMax?: number;
  humidity?: number;
  humidityMin?: number;
  humidityMax?: number;
  vpd?: number;
  co2?: number;
  lightIntensity?: number;
  soilMoisture?: number;
}

export interface ParameterStatistics {
  min: number;
  max: number;
  average: number;
  variance: number;
  standardDeviation: number;
  optimalRange: {
    min: number;
    max: number;
    unit: string;
  };
}

export interface EnvironmentalSummary {
  temperature: ParameterStatistics | null;
  humidity: ParameterStatistics | null;
  vpd: ParameterStatistics | null;
  co2: ParameterStatistics | null;
  light: ParameterStatistics | null;
  soilMoisture: ParameterStatistics | null;
  daysOutOfRange: number;
  stabilityScore: number;
}

export interface StageEnvironmentalData {
  avgTemperature: number;
  avgHumidity: number;
  avgVpd: number;
  avgCo2: number | null;
  avgLight: number | null;
  avgSoilMoisture: number | null;
  dataPointCount: number;
}

export interface StageComparison {
  vegetative: StageEnvironmentalData | null;
  flowering: StageEnvironmentalData | null;
}

export interface EnvironmentalTrendsResponse {
  dataPoints: EnvironmentalDataPoint[];
  summary: EnvironmentalSummary;
  stageComparison: StageComparison;
}

export interface EnvironmentalTrendsRequest {
  growId?: string;
  startDate?: string;
  endDate?: string;
  aggregation?: 'hourly' | 'daily' | 'weekly' | 'monthly';
}

// ============================================================================
// Feeding Analytics Types
// ============================================================================

export interface FeedingEventData {
  id: string;
  timestamp: string;
  plantId: string;
  plantTag: string;
  ec: number | null;
  ph: number | null;
  waterVolume: number;
  feedingType: 'nutrients' | 'watering' | 'supplement' | 'flush';
  nutrients: string[];
}

export interface StageBreakdown {
  avgEc: number;
  avgPh: number;
  avgWaterVolume: number;
  eventCount: number;
}

export interface NutrientMetrics {
  totalEc: number;
  avgEc: number;
  avgPh: number;
  totalWaterVolume: number;
  feedingEventCount: number;
  vegetativeAvg: StageBreakdown;
  floweringAvg: StageBreakdown;
}

export interface FeedingEfficiencyMetrics {
  feedEfficiency: number | null;
  waterUseEfficiency: number | null;
  feedEfficiencyUnit: string;
  waterEfficiencyUnit: string;
  totalYield: number | null;
}

export interface TrendPoint {
  timestamp: string;
  value: number;
  variance: number;
  plantStage: string;
}

export interface FeedingAnalyticsResponse {
  nutrientMetrics: NutrientMetrics;
  efficiencyMetrics: FeedingEfficiencyMetrics;
  phTrend: TrendPoint[];
  ecTrend: TrendPoint[];
  feedingTimeline: FeedingEventData[];
}

export interface FeedingAnalyticsRequest {
  growId?: string;
  plantId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// Cultivar Comparison Types
// ============================================================================

export interface CultivarPerformanceMetrics {
  cultivarId: string;
  cultivarName: string;
  type: string;
  totalGrows: number;
  totalPlants: number;
  performance: {
    avgYieldPerPlant: number;
    avgYieldPerSqFt: number | null;
    successRate: number;
    easeOfGrowthScore: number;
    avgDaysToHarvest: number;
    wetToDryRatio: number;
  };
  environmentalPreferences: {
    optimalTemperature: number;
    optimalHumidity: number;
    optimalVpd: number;
    optimalCo2: number;
    optimalLight: number;
  };
  quality: {
    avgPotency: number;
    avgQualityScore: number;
    dominantTerpene: string | null;
    defectCounts: Record<string, number>;
  };
}

export interface CultivarComparisonResponse {
  cultivars: CultivarPerformanceMetrics[];
  bestPerformers: {
    highestYield: string;
    fastestGrowth: string;
    easiestToGrow: string;
    highestQuality: string;
  };
}

export interface CultivarComparisonRequest {
  cultivarIds: string[]; // 2-4 cultivar IDs to compare
  includeHistorical?: boolean; // compare same cultivar over time
}

// ============================================================================
// Yield Analytics Types
// ============================================================================

export interface YieldMetrics {
  totalYield: number;
  avgYieldPerPlant: number;
  avgYieldPerCultivar: number;
  avgYieldPerGrow: number;
  avgWetWeight: number;
  avgDryWeight: number;
  avgWetToDryRatio: number;
  totalHashYield: number;
  avgHashYieldPerPlant: number;
  avgHashYieldPercentage: number;
  totalHarvests: number;
  totalPlantsHarvested: number;
}

export interface ProductionEfficiency {
  gramsPerWatt: number | null;
  successRate: number;
  avgDaysToHarvest: number;
  yieldPerSqFt: number | null;
  trend: 'improving' | 'stable' | 'declining';
}

export interface QualityDistribution {
  excellent: number;
  good: number;
  average: number;
  poor: number;
}

export interface QualityTracking {
  avgPotency: number;
  qualityDistribution: QualityDistribution;
  defectCount: number;
  commonDefects: string[];
}

export interface YieldTrendPoint {
  harvestDate: string;
  growId: string;
  growName: string;
  cultivarId: string;
  cultivarName: string;
  totalYield: number;
  plantCount: number;
  avgYieldPerPlant: number;
}

export interface TopPerformer {
  id: string;
  type: 'grow' | 'plant';
  name: string;
  cultivarName: string;
  yield: number;
  quality: number;
  harvestDate: string;
}

export interface YieldAnalyticsResponse {
  yieldMetrics: YieldMetrics;
  productionEfficiency: ProductionEfficiency;
  qualityTracking: QualityTracking;
  yieldTrend: YieldTrendPoint[];
  topPerformers: TopPerformer[];
}

export interface YieldAnalyticsRequest {
  growId?: string;
  cultivarId?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// Timeline Events Types
// ============================================================================

export interface TimelineEventDetails {
  ec?: number | null;
  ph?: number | null;
  waterVolume?: number | null;
  nutrients?: string[] | null;
  amendments?: Amendment[] | null;
  activityType?: string | null;
  notes?: string | null;
  temperature?: number | null;
  humidity?: number | null;
  light?: number | null;
  observationType?: string | null;
  photoUrls?: string[] | null;
  tags?: string[] | null;
  wetWeight?: number | null;
  dryWeight?: number | null;
}

export interface TimelineEvent {
  id: string;
  eventType: 'feeding' | 'watering' | 'training' | 'pruning' | 'observation' | 'transplant' | 'harvest' | 'defoliation';
  description: string;
  timestamp: string;
  plantId?: string;
  plantTag?: string;
  growId: string;
  growName: string;
  details: TimelineEventDetails;
}

export interface TimelineMilestone {
  id: string;
  type: 'germination' | 'transplant' | 'veg_start' | 'flower_start' | 'harvest';
  date: string;
  plantId?: string;
  plantTag?: string;
  growId: string;
}

export interface TimelinePhoto {
  observationId: string;
  timestamp: string;
  plantId: string;
  plantTag: string;
  plantStage: string;
  photoUrl: string;
  thumbnailUrl: string;
  caption?: string;
}

export interface TimelineEventsResponse {
  events: TimelineEvent[];
  milestones: TimelineMilestone[];
  photos: TimelinePhoto[];
}

export interface TimelineEventsRequest {
  growId?: string;
  plantId?: string;
  startDate?: string;
  endDate?: string;
  eventTypes?: string[]; // filter by event types
}