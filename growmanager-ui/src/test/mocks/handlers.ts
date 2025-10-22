import { http, HttpResponse, delay } from 'msw';
import { Plant, CreatePlantRequest, UpdatePlantRequest } from '@/types/plant';
import {
  FeedingEvent,
  CreateFeedingEventRequest,
  UpdateFeedingEventRequest,
} from '@/types/feedingEvent';
import {
  ActivityLog,
  CreateActivityLogRequest,
  UpdateActivityLogRequest,
} from '@/types/activityLog';
import type {
  DashboardMetricsResponse,
  EnvironmentalTrendsResponse,
  FeedingAnalyticsResponse,
  CultivarComparisonResponse,
  YieldAnalyticsResponse,
  TimelineEventsResponse,
} from '@/types/analytics';

// Mock data factories
export const createMockPlant = (overrides?: Partial<Plant>): Plant => ({
  id: 'plant-1',
  growId: 'grow-1',
  cultivarId: 'cultivar-1',
  plantTag: 'Plant #1',
  plantedDate: '2025-01-01T00:00:00Z',
  stage: 'vegetative',
  healthStatus: 'active',
  notes: 'Test plant notes',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-05T00:00:00Z',
  cultivarName: 'Blue Dream',
  sortOrder: 0,
  ...overrides,
});

export const createMockFeedingEvent = (overrides?: Partial<FeedingEvent>): FeedingEvent => ({
  id: 'feeding-1',
  plantId: 'plant-1',
  feedingType: 'nutrients',
  amountMl: 500,
  ecLevel: 1.5,
  phLevel: 6.2,
  nutrientMix: 'Grow nutrients',
  notes: 'Fed with grow nutrients',
  fedAt: '2025-01-05T10:00:00Z',
  createdAt: '2025-01-05T10:00:00Z',
  updatedAt: '2025-01-05T10:00:00Z',
  plantTag: 'Plant #1',
  ...overrides,
});

export const createMockActivityLog = (overrides?: Partial<ActivityLog>): ActivityLog => ({
  id: 'activity-1',
  plantId: 'plant-1',
  activityType: 'training',
  description: 'LST training',
  notes: 'Bent main stem to promote lateral growth',
  loggedAt: '2025-01-04T14:00:00Z',
  createdAt: '2025-01-04T14:00:00Z',
  updatedAt: '2025-01-04T14:00:00Z',
  plantTag: 'Plant #1',
  ...overrides,
});

// Analytics mock data factories
export const createMockDashboardMetrics = (): DashboardMetricsResponse => ({
  environmentalQuality: [
    {
      parameter: 'temperature',
      currentValue: 24.5,
      unit: '°C',
      status: 'optimal',
      optimalMin: 20,
      optimalMax: 28,
    },
    {
      parameter: 'humidity',
      currentValue: 65,
      unit: '%',
      status: 'optimal',
      optimalMin: 40,
      optimalMax: 70,
    },
    {
      parameter: 'vpd',
      currentValue: 1.2,
      unit: 'kPa',
      status: 'optimal',
      optimalMin: 0.8,
      optimalMax: 1.5,
    },
  ],
  plantStageDistribution: [
    { stage: 'seedling', count: 2, percentage: 20 },
    { stage: 'vegetative', count: 5, percentage: 50 },
    { stage: 'flowering', count: 3, percentage: 30 },
    { stage: 'harvested', count: 0, percentage: 0 },
  ],
  issueTracking: {
    totalIssues: 5,
    unresolvedCount: 2,
    resolvedCount: 3,
    trend: 'down',
    recentIssues: [
      {
        id: 'issue-1',
        type: 'pest',
        description: 'Spider mites detected on Plant #3',
        createdAt: '2025-01-10T10:00:00Z',
      },
      {
        id: 'issue-2',
        type: 'nutrient',
        description: 'Nitrogen deficiency on Plant #5',
        createdAt: '2025-01-09T14:00:00Z',
      },
    ],
  },
  recentActivities: [
    {
      id: 'activity-1',
      type: 'feeding',
      description: 'Fed with bloom nutrients',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2025',
      timestamp: '2025-01-10T15:00:00Z',
    },
    {
      id: 'activity-2',
      type: 'training',
      description: 'LST training applied',
      plantId: 'plant-2',
      plantTag: 'Plant #2',
      growId: 'grow-1',
      growName: 'Summer 2025',
      timestamp: '2025-01-10T10:00:00Z',
    },
  ],
  summary: {
    activeGrows: 2,
    activePlants: 10,
    totalObservations: 45,
    upcomingHarvests: 3,
  },
});

export const createMockEnvironmentalTrends = (): EnvironmentalTrendsResponse => ({
  dataPoints: [
    {
      timestamp: '2025-01-01T00:00:00Z',
      temperature: 24.0,
      temperatureMin: 22.5,
      temperatureMax: 25.5,
      humidity: 60,
      humidityMin: 55,
      humidityMax: 65,
      vpd: 1.15,
      co2: 800,
      lightIntensity: 600,
    },
    {
      timestamp: '2025-01-02T00:00:00Z',
      temperature: 24.5,
      temperatureMin: 23.0,
      temperatureMax: 26.0,
      humidity: 62,
      humidityMin: 58,
      humidityMax: 67,
      vpd: 1.18,
      co2: 850,
      lightIntensity: 620,
    },
    {
      timestamp: '2025-01-03T00:00:00Z',
      temperature: 25.0,
      temperatureMin: 23.5,
      temperatureMax: 26.5,
      humidity: 65,
      humidityMin: 60,
      humidityMax: 70,
      vpd: 1.22,
      co2: 900,
      lightIntensity: 650,
    },
  ],
  summary: {
    temperature: {
      min: 22.0,
      max: 26.5,
      average: 24.5,
      variance: 1.2,
      standardDeviation: 1.1,
      optimalRange: {
        min: 20.0,
        max: 28.0,
        unit: '°C',
      },
    },
    humidity: {
      min: 55,
      max: 70,
      average: 62,
      variance: 12.5,
      standardDeviation: 3.5,
      optimalRange: {
        min: 40.0,
        max: 70.0,
        unit: '%',
      },
    },
    vpd: {
      min: 1.0,
      max: 1.5,
      average: 1.18,
      variance: 0.02,
      standardDeviation: 0.14,
      optimalRange: {
        min: 0.8,
        max: 1.5,
        unit: 'kPa',
      },
    },
    co2: null,
    light: null,
    soilMoisture: null,
    daysOutOfRange: 2,
    stabilityScore: 85.5,
  },
  stageComparison: {
    vegetative: {
      avgTemperature: 24.0,
      avgHumidity: 65,
      avgVpd: 1.1,
      avgCo2: 900,
      avgLight: 600,
      avgSoilMoisture: null,
      dataPointCount: 150,
    },
    flowering: {
      avgTemperature: 22.5,
      avgHumidity: 50,
      avgVpd: 1.3,
      avgCo2: 1200,
      avgLight: 800,
      avgSoilMoisture: null,
      dataPointCount: 120,
    },
  },
});

export const createMockFeedingAnalytics = (): FeedingAnalyticsResponse => ({
  nutrientMetrics: {
    totalWaterVolume: 1300,
    totalEc: 4.95,
    avgEc: 1.65,
    avgPh: 6.23,
    feedingEventCount: 3,
    vegetativeAvg: { avgEc: 1.5, avgPh: 6.2, avgWaterVolume: 400, eventCount: 1 },
    floweringAvg: { avgEc: 1.8, avgPh: 6.0, avgWaterVolume: 500, eventCount: 2 },
  },
  efficiencyMetrics: {
    feedEfficiency: 0.8,
    waterUseEfficiency: 0.9,
    feedEfficiencyUnit: 'g/L',
    waterEfficiencyUnit: 'L/g',
    totalYield: 450,
  },
  phTrend: [
    { timestamp: '2025-01-01T00:00:00Z', value: 6.2, variance: 0.1, plantStage: 'vegetative' },
    { timestamp: '2025-01-02T00:00:00Z', value: 6.1, variance: 0.15, plantStage: 'vegetative' },
    { timestamp: '2025-01-03T00:00:00Z', value: 6.3, variance: 0.12, plantStage: 'flowering' },
  ],
  ecTrend: [
    { timestamp: '2025-01-01T00:00:00Z', value: 1.5, variance: 0.1, plantStage: 'vegetative' },
    { timestamp: '2025-01-02T00:00:00Z', value: 1.6, variance: 0.08, plantStage: 'vegetative' },
    { timestamp: '2025-01-03T00:00:00Z', value: 1.7, variance: 0.12, plantStage: 'flowering' },
  ],
  feedingTimeline: [
    {
      id: 'feeding-1',
      timestamp: '2025-01-01T10:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      feedingType: 'nutrients',
      waterVolume: 500,
      ec: 1.5,
      ph: 6.2,
      nutrients: ['Grow A', 'Grow B'],
    },
    {
      id: 'feeding-2',
      timestamp: '2025-01-03T10:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      feedingType: 'watering',
      waterVolume: 300,
      ec: null,
      ph: 6.5,
      nutrients: [],
    },
    {
      id: 'feeding-3',
      timestamp: '2025-01-05T10:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      feedingType: 'nutrients',
      waterVolume: 500,
      ec: 1.8,
      ph: 6.0,
      nutrients: ['Bloom A', 'Bloom B'],
    },
  ],
});

export const createMockCultivarComparison = (): CultivarComparisonResponse => ({
  cultivars: [
    {
      cultivarId: 'cultivar-1',
      cultivarName: 'Blue Dream',
      type: 'hybrid',
      totalGrows: 5,
      totalPlants: 20,
      performance: {
        avgYieldPerPlant: 450,
        avgYieldPerSqFt: 1.8,
        successRate: 95,
        easeOfGrowthScore: 90,
        avgDaysToHarvest: 75,
        wetToDryRatio: 4.5,
      },
      environmentalPreferences: {
        optimalTemperature: 24,
        optimalHumidity: 60,
        optimalVpd: 1.2,
        optimalCo2: 1000,
        optimalLight: 800,
      },
      quality: {
        avgPotency: 20.5,
        avgQualityScore: 8.5,
        dominantTerpene: 'Myrcene',
        defectCounts: {},
      },
    },
    {
      cultivarId: 'cultivar-2',
      cultivarName: 'OG Kush',
      type: 'indica',
      totalGrows: 3,
      totalPlants: 12,
      performance: {
        avgYieldPerPlant: 400,
        avgYieldPerSqFt: 1.6,
        successRate: 90,
        easeOfGrowthScore: 70,
        avgDaysToHarvest: 70,
        wetToDryRatio: 4.2,
      },
      environmentalPreferences: {
        optimalTemperature: 22,
        optimalHumidity: 55,
        optimalVpd: 1.3,
        optimalCo2: 950,
        optimalLight: 750,
      },
      quality: {
        avgPotency: 22.0,
        avgQualityScore: 9.0,
        dominantTerpene: 'Caryophyllene',
        defectCounts: {},
      },
    },
  ],
  bestPerformers: {
    highestYield: 'cultivar-1',
    fastestGrowth: 'cultivar-2',
    easiestToGrow: 'cultivar-1',
    highestQuality: 'cultivar-2',
  },
});

export const createMockYieldAnalytics = (): YieldAnalyticsResponse => ({
  yieldMetrics: {
    totalYield: 2250,
    avgYieldPerPlant: 450,
    avgYieldPerCultivar: 425,
    avgYieldPerGrow: 1125,
    avgWetWeight: 450 * 4.5,
    avgDryWeight: 450,
    avgWetToDryRatio: 4.5,
    totalHashYield: 45,
    avgHashYieldPerPlant: 9,
    avgHashYieldPercentage: 2.0,
    totalHarvests: 2,
    totalPlantsHarvested: 5,
  },
  productionEfficiency: {
    gramsPerWatt: 1.2,
    successRate: 92,
    avgDaysToHarvest: 75,
    yieldPerSqFt: 1.8,
    trend: 'improving',
  },
  qualityTracking: {
    avgPotency: 22,
    qualityDistribution: { excellent: 3, good: 2, average: 0, poor: 0 },
    defectCount: 0,
    commonDefects: [],
  },
  yieldTrend: [
    {
      harvestDate: '2024-01-01',
      growId: 'grow-1',
      growName: 'Winter 2024',
      cultivarId: 'cultivar-1',
      cultivarName: 'Blue Dream',
      totalYield: 400,
      plantCount: 4,
      avgYieldPerPlant: 100,
    },
    {
      harvestDate: '2024-06-01',
      growId: 'grow-2',
      growName: 'Summer 2024',
      cultivarId: 'cultivar-2',
      cultivarName: 'OG Kush',
      totalYield: 450,
      plantCount: 5,
      avgYieldPerPlant: 90,
    },
    {
      harvestDate: '2025-01-01',
      growId: 'grow-3',
      growName: 'Winter 2025',
      cultivarId: 'cultivar-1',
      cultivarName: 'Blue Dream',
      totalYield: 500,
      plantCount: 5,
      avgYieldPerPlant: 100,
    },
  ],
  topPerformers: [
    {
      id: 'grow-1',
      type: 'grow',
      name: 'Summer 2025',
      cultivarName: 'Blue Dream',
      yield: 1350,
      quality: 8.5,
      harvestDate: '2025-05-01',
    },
    {
      id: 'grow-2',
      type: 'grow',
      name: 'Spring 2025',
      cultivarName: 'OG Kush',
      yield: 900,
      quality: 9.0,
      harvestDate: '2025-03-15',
    },
  ],
});

export const createMockTimelineEvents = (): TimelineEventsResponse => ({
  events: [
    {
      id: 'event-1',
      eventType: 'feeding',
      description: 'Fed with bloom nutrients',
      timestamp: '2025-01-10T10:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2025',
      details: { ec: 1.8, ph: 6.0 },
    },
    {
      id: 'event-2',
      eventType: 'training',
      description: 'Applied low stress training',
      timestamp: '2025-01-09T14:00:00Z',
      plantId: 'plant-2',
      plantTag: 'Plant #2',
      growId: 'grow-1',
      growName: 'Summer 2025',
      details: { activityType: 'LST' },
    },
    {
      id: 'event-3',
      eventType: 'observation',
      description: 'Plants looking healthy',
      timestamp: '2025-01-08T12:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2025',
      details: { observationType: 'weekly_check' },
    },
  ],
  milestones: [
    {
      id: 'milestone-1',
      type: 'flower_start',
      date: '2025-01-05T00:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
    },
    {
      id: 'milestone-2',
      type: 'veg_start',
      date: '2025-01-01T00:00:00Z',
      plantId: 'plant-2',
      plantTag: 'Plant #2',
      growId: 'grow-1',
    },
  ],
  photos: [
    {
      observationId: 'obs-1',
      timestamp: '2025-01-10T12:00:00Z',
      photoUrl: 'https://example.com/photo1.jpg',
      thumbnailUrl: 'https://example.com/photo1-thumb.jpg',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      plantStage: 'flowering',
      caption: 'Flowering progress',
    },
    {
      observationId: 'obs-2',
      timestamp: '2025-01-05T12:00:00Z',
      photoUrl: 'https://example.com/photo2.jpg',
      thumbnailUrl: 'https://example.com/photo2-thumb.jpg',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      plantStage: 'vegetative',
      caption: 'Vegetative growth',
    },
  ],
});

// Mock handlers
export const handlers = [
  // Plants API
  http.get('/api/plants', async () => {
    await delay(100);
    return HttpResponse.json([
      createMockPlant(),
      createMockPlant({
        id: 'plant-2',
        plantTag: 'Plant #2',
        stage: 'flowering',
        healthStatus: 'removed',
      }),
      createMockPlant({
        id: 'plant-3',
        plantTag: 'Plant #3',
        stage: 'seedling',
        healthStatus: 'active',
      }),
    ]);
  }),

  http.get('/api/plants/:plantId', async ({ params }) => {
    await delay(100);
    const { plantId } = params;
    return HttpResponse.json(createMockPlant({ id: plantId as string }));
  }),

  http.post('/api/plants', async ({ request }) => {
    await delay(100);
    const body = (await request.json()) as CreatePlantRequest;
    return HttpResponse.json(
      createMockPlant({
        ...body,
        id: 'new-plant-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.put('/api/plants/:plantId', async ({ params, request }) => {
    await delay(100);
    const { plantId } = params;
    const body = (await request.json()) as UpdatePlantRequest;
    return HttpResponse.json(
      createMockPlant({
        id: plantId as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete('/api/plants/:plantId', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Feeding Events API
  http.get('/api/plants/:plantId/feeding-events', async ({ params }) => {
    await delay(100);
    const { plantId } = params;
    return HttpResponse.json([
      createMockFeedingEvent({ plantId: plantId as string }),
      createMockFeedingEvent({
        id: 'feeding-2',
        plantId: plantId as string,
        feedingType: 'watering',
        amountMl: 300,
        ecLevel: undefined,
        phLevel: 6.5,
        nutrientMix: undefined,
        notes: 'Plain water',
        fedAt: '2025-01-03T10:00:00Z',
      }),
    ]);
  }),

  http.post('/api/plants/:plantId/feeding-events', async ({ params, request }) => {
    await delay(100);
    const { plantId } = params;
    const body = (await request.json()) as CreateFeedingEventRequest;
    return HttpResponse.json(
      createMockFeedingEvent({
        ...body,
        plantId: plantId as string,
        id: 'new-feeding-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.put('/api/feeding-events/:eventId', async ({ params, request }) => {
    await delay(100);
    const { eventId } = params;
    const body = (await request.json()) as UpdateFeedingEventRequest;
    return HttpResponse.json(
      createMockFeedingEvent({
        id: eventId as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete('/api/feeding-events/:eventId', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Activity Logs API
  http.get('/api/plants/:plantId/activity-logs', async ({ params }) => {
    await delay(100);
    const { plantId } = params;
    return HttpResponse.json([
      createMockActivityLog({ plantId: plantId as string }),
      createMockActivityLog({
        id: 'activity-2',
        plantId: plantId as string,
        activityType: 'pruning',
        description: 'Removed lower fan leaves',
        notes: 'Improved air circulation',
        loggedAt: '2025-01-02T14:00:00Z',
      }),
    ]);
  }),

  http.post('/api/plants/:plantId/activity-logs', async ({ params, request }) => {
    await delay(100);
    const { plantId } = params;
    const body = (await request.json()) as CreateActivityLogRequest;
    return HttpResponse.json(
      createMockActivityLog({
        ...body,
        plantId: plantId as string,
        id: 'new-activity-id',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
      { status: 201 }
    );
  }),

  http.put('/api/activity-logs/:logId', async ({ params, request }) => {
    await delay(100);
    const { logId } = params;
    const body = (await request.json()) as UpdateActivityLogRequest;
    return HttpResponse.json(
      createMockActivityLog({
        id: logId as string,
        ...body,
        updatedAt: new Date().toISOString(),
      })
    );
  }),

  http.delete('/api/activity-logs/:logId', async () => {
    await delay(100);
    return new HttpResponse(null, { status: 204 });
  }),

  // Cultivars API (needed for plant form)
  http.get('/api/cultivars', async () => {
    await delay(100);
    return HttpResponse.json([
      {
        id: 'cultivar-1',
        userId: 'user-1',
        name: 'Blue Dream',
        breeder: 'HSC',
        description: 'Sativa-dominant hybrid',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      {
        id: 'cultivar-2',
        userId: 'user-1',
        name: 'OG Kush',
        breeder: 'Unknown',
        description: 'Classic indica',
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ]);
  }),

  // Grows API (needed for plants list page)
  http.get('/api/grows', async () => {
    await delay(100);
    return HttpResponse.json([
      {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Summer 2025',
        startDate: '2025-01-01T00:00:00Z',
        status: 'vegetative',
        environmentType: 'indoor',
        notes: 'First grow of the year',
        isArchived: false,
        plantCount: 3,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-05T00:00:00Z',
      },
      {
        id: 'grow-2',
        userId: 'user-1',
        name: 'Fall 2024',
        startDate: '2024-09-01T00:00:00Z',
        status: 'harvested',
        environmentType: 'outdoor',
        notes: 'Outdoor harvest',
        isArchived: true,
        plantCount: 6,
        sortOrder: 1,
        createdAt: '2024-09-01T00:00:00Z',
        updatedAt: '2024-11-15T00:00:00Z',
      },
    ]);
  }),

  // Analytics API endpoints
  http.get('/api/analytics/dashboard', async () => {
    await delay(100);
    return HttpResponse.json(createMockDashboardMetrics());
  }),

  http.get('/api/analytics/environmental', async () => {
    await delay(100);
    return HttpResponse.json(createMockEnvironmentalTrends());
  }),

  http.get('/api/analytics/feeding', async () => {
    await delay(100);
    return HttpResponse.json(createMockFeedingAnalytics());
  }),

  http.get('/api/analytics/cultivars/compare', async () => {
    await delay(100);
    return HttpResponse.json(createMockCultivarComparison());
  }),

  http.get('/api/analytics/yield', async () => {
    await delay(100);
    return HttpResponse.json(createMockYieldAnalytics());
  }),

  http.get('/api/analytics/timeline', async () => {
    await delay(100);
    return HttpResponse.json(createMockTimelineEvents());
  }),
];

// Error handlers for testing error scenarios
export const errorHandlers = {
  plantsError: http.get('/api/plants', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch plants' }, { status: 500 });
  }),

  createPlantError: http.post('/api/plants', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to create plant' }, { status: 500 });
  }),

  feedingEventsError: http.get('/api/plants/:plantId/feeding-events', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch feeding events' }, { status: 500 });
  }),

  createFeedingError: http.post('/api/plants/:plantId/feeding-events', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to create feeding event' }, { status: 500 });
  }),

  activityLogsError: http.get('/api/plants/:plantId/activity-logs', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch activity logs' }, { status: 500 });
  }),

  createActivityError: http.post('/api/plants/:plantId/activity-logs', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to create activity log' }, { status: 500 });
  }),

  // Analytics error handlers
  dashboardError: http.get('/api/analytics/dashboard', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }),

  environmentalError: http.get('/api/analytics/environmental', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch environmental trends' }, { status: 500 });
  }),

  feedingAnalyticsError: http.get('/api/analytics/feeding', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch feeding analytics' }, { status: 500 });
  }),

  cultivarComparisonError: http.get('/api/analytics/cultivars/compare', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch cultivar comparison' }, { status: 500 });
  }),

  yieldError: http.get('/api/analytics/yield', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch yield analytics' }, { status: 500 });
  }),

  timelineError: http.get('/api/analytics/timeline', async () => {
    await delay(100);
    return HttpResponse.json({ message: 'Failed to fetch timeline events' }, { status: 500 });
  }),
};