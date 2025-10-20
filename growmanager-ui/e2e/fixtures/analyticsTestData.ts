/**
 * Test data fixtures for analytics E2E tests
 */

export const analyticsTestGrow = {
  id: 'grow-test-123',
  name: 'Test Analytics Grow',
  status: 'active',
  startDate: '2025-01-01',
  environmentType: 'INDOOR',
};

export const analyticsTestCultivars = [
  {
    id: 'cultivar-1',
    name: 'Northern Lights',
    type: 'INDICA',
    breeder: 'Sensi Seeds',
    avgYield: 450,
    avgThc: 18.0,
  },
  {
    id: 'cultivar-2',
    name: 'Sour Diesel',
    type: 'SATIVA',
    breeder: 'Original Breeder',
    avgYield: 500,
    avgThc: 20.0,
  },
  {
    id: 'cultivar-3',
    name: 'Blue Dream',
    type: 'HYBRID',
    breeder: 'Unknown',
    avgYield: 525,
    avgThc: 19.5,
  },
];

export const analyticsTestPlants = [
  {
    id: 'plant-1',
    growId: 'grow-test-123',
    cultivarId: 'cultivar-1',
    plantTag: 'NL-001',
    stage: 'FLOWERING',
    healthStatus: 'HEALTHY',
  },
  {
    id: 'plant-2',
    growId: 'grow-test-123',
    cultivarId: 'cultivar-1',
    plantTag: 'NL-002',
    stage: 'FLOWERING',
    healthStatus: 'HEALTHY',
  },
];

export const environmentalTestData = {
  trends: {
    temperature: [
      { timestamp: '2025-01-01T10:00:00Z', value: 24.5, optimal: 24 },
      { timestamp: '2025-01-01T14:00:00Z', value: 26.0, optimal: 24 },
      { timestamp: '2025-01-01T18:00:00Z', value: 23.5, optimal: 24 },
    ],
    humidity: [
      { timestamp: '2025-01-01T10:00:00Z', value: 55, optimal: 60 },
      { timestamp: '2025-01-01T14:00:00Z', value: 50, optimal: 60 },
      { timestamp: '2025-01-01T18:00:00Z', value: 58, optimal: 60 },
    ],
    vpd: [
      { timestamp: '2025-01-01T10:00:00Z', value: 1.2, optimal: 1.0 },
      { timestamp: '2025-01-01T14:00:00Z', value: 1.5, optimal: 1.0 },
      { timestamp: '2025-01-01T18:00:00Z', value: 1.1, optimal: 1.0 },
    ],
  },
  stats: {
    temperature: { min: 23.5, max: 26.0, avg: 24.7, variance: 0.85 },
    humidity: { min: 50, max: 58, avg: 54.3, variance: 12.5 },
    vpd: { min: 1.1, max: 1.5, avg: 1.27, variance: 0.03 },
  },
};

export const feedingTestData = {
  schedule: [
    {
      date: '2025-01-05',
      nutrientAmount: 2.5,
      ph: 6.2,
      ec: 1.8,
      nutrients: ['Base A', 'Base B', 'Cal-Mag'],
    },
    {
      date: '2025-01-08',
      nutrientAmount: 3.0,
      ph: 6.1,
      ec: 2.0,
      nutrients: ['Base A', 'Base B', 'Bloom'],
    },
  ],
  trends: {
    ph: [
      { timestamp: '2025-01-05', value: 6.2, optimal: 6.0 },
      { timestamp: '2025-01-08', value: 6.1, optimal: 6.0 },
    ],
    ec: [
      { timestamp: '2025-01-05', value: 1.8, optimal: 1.8 },
      { timestamp: '2025-01-08', value: 2.0, optimal: 1.8 },
    ],
  },
  efficiency: {
    totalNutrients: 5.5,
    avgPh: 6.15,
    avgEc: 1.9,
    feedingFrequency: 3,
  },
};

export const yieldTestData = {
  summary: {
    totalYield: 900,
    wetToDryRatio: 0.22,
    successRate: 95,
    gramsPerWatt: 0.9,
  },
  byCultivar: [
    {
      cultivarId: 'cultivar-1',
      cultivarName: 'Northern Lights',
      totalYield: 450,
      avgYieldPerPlant: 225,
      wetWeight: 2045,
      dryWeight: 450,
      qualityGrade: 'A',
    },
    {
      cultivarId: 'cultivar-2',
      cultivarName: 'Sour Diesel',
      totalYield: 500,
      avgYieldPerPlant: 250,
      wetWeight: 2273,
      dryWeight: 500,
      qualityGrade: 'A+',
    },
  ],
  qualityDistribution: [
    { grade: 'A+', count: 1, percentage: 50 },
    { grade: 'A', count: 1, percentage: 50 },
  ],
};

export const comparisonTestData = {
  cultivars: [
    {
      cultivarId: 'cultivar-1',
      cultivarName: 'Northern Lights',
      avgYield: 450,
      growthDuration: 75,
      successRate: 95,
      avgThc: 18.0,
      avgCbd: 0.1,
      optimalTemp: 24,
      optimalHumidity: 55,
    },
    {
      cultivarId: 'cultivar-2',
      cultivarName: 'Sour Diesel',
      avgYield: 500,
      growthDuration: 70,
      successRate: 92,
      avgThc: 20.0,
      avgCbd: 0.2,
      optimalTemp: 25,
      optimalHumidity: 50,
    },
  ],
};

export const timelineTestData = {
  events: [
    {
      id: 'event-1',
      type: 'feeding',
      timestamp: '2025-01-05T10:00:00Z',
      description: 'Fed with Base nutrients',
      metadata: { ph: 6.2, ec: 1.8 },
    },
    {
      id: 'event-2',
      type: 'watering',
      timestamp: '2025-01-07T09:00:00Z',
      description: 'Plain water flush',
      metadata: { volume: 5.0 },
    },
    {
      id: 'event-3',
      type: 'training',
      timestamp: '2025-01-10T14:00:00Z',
      description: 'LST applied to main stem',
      metadata: { technique: 'LST' },
    },
    {
      id: 'event-4',
      type: 'observation',
      timestamp: '2025-01-12T16:00:00Z',
      description: 'Healthy growth, good color',
      metadata: { hasPhoto: true },
    },
    {
      id: 'event-5',
      type: 'stage_transition',
      timestamp: '2025-01-15T00:00:00Z',
      description: 'Transitioned to flowering',
      metadata: { fromStage: 'VEGETATIVE', toStage: 'FLOWERING' },
    },
  ],
};

export const dashboardTestData = {
  metrics: {
    activeGrows: 2,
    totalPlants: 8,
    harvestsThisMonth: 1,
    avgYield: 475,
  },
  recentActivity: [
    {
      type: 'feeding',
      description: 'Fed plants in Grow Tent A',
      timestamp: '2025-01-18T10:00:00Z',
    },
    {
      type: 'observation',
      description: 'Added photos to NL-001',
      timestamp: '2025-01-17T15:30:00Z',
    },
  ],
  environmentalSummary: {
    temperature: { current: 24.5, status: 'optimal' },
    humidity: { current: 55, status: 'optimal' },
    vpd: { current: 1.2, status: 'good' },
  },
};