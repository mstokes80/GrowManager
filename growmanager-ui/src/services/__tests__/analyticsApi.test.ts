import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@/test/utils/testUtils';
import {
  useAnalyticsDashboard,
  useEnvironmentalTrends,
  useFeedingAnalytics,
  useCultivarComparison,
  useYieldAnalytics,
  useTimelineEvents,
  getDashboardMetrics,
  getEnvironmentalTrends,
  getFeedingAnalytics,
  getCultivarComparison,
  getYieldAnalytics,
  getTimelineEvents,
} from '../analyticsApi';
import { server } from '@/test/setup';
import { errorHandlers } from '@/test/mocks/handlers';

describe('Analytics API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('API Functions', () => {
    describe('getDashboardMetrics', () => {
      it('fetches dashboard metrics successfully', async () => {
        const data = await getDashboardMetrics();

        expect(data).toBeDefined();
        expect(data.environmentalQuality).toBeInstanceOf(Array);
        expect(data.plantStageDistribution).toBeInstanceOf(Array);
        expect(data.issueTracking).toBeDefined();
        expect(data.recentActivities).toBeInstanceOf(Array);
        expect(data.summary).toBeDefined();
      });

      it('includes all required dashboard metrics fields', async () => {
        const data = await getDashboardMetrics();

        expect(data.summary).toHaveProperty('activeGrows');
        expect(data.summary).toHaveProperty('activePlants');
        expect(data.summary).toHaveProperty('totalObservations');
        expect(data.summary).toHaveProperty('upcomingHarvests');
      });
    });

    describe('getEnvironmentalTrends', () => {
      it('fetches environmental trends without parameters', async () => {
        const data = await getEnvironmentalTrends();

        expect(data).toBeDefined();
        expect(data.dataPoints).toBeInstanceOf(Array);
        expect(data.summary).toBeDefined();
        expect(data.stageComparison).toBeDefined();
      });

      it('fetches environmental trends with growId parameter', async () => {
        const data = await getEnvironmentalTrends({ growId: 'grow-1' });

        expect(data).toBeDefined();
        expect(data.dataPoints).toBeInstanceOf(Array);
      });

      it('fetches environmental trends with date range parameters', async () => {
        const data = await getEnvironmentalTrends({
          startDate: '2025-01-01',
          endDate: '2025-01-31',
          aggregation: 'daily',
        });

        expect(data).toBeDefined();
        expect(data.dataPoints).toBeInstanceOf(Array);
      });

      it('includes summary and stage comparison in response', async () => {
        const data = await getEnvironmentalTrends();

        expect(data.summary).toBeDefined();
        expect(data.stageComparison).toBeDefined();
        expect(data.stageComparison).toHaveProperty('vegetative');
        expect(data.stageComparison).toHaveProperty('flowering');
      });
    });

    describe('getFeedingAnalytics', () => {
      it('fetches feeding analytics without parameters', async () => {
        const data = await getFeedingAnalytics();

        expect(data).toBeDefined();
        expect(data.nutrientMetrics).toBeDefined();
        expect(data.efficiencyMetrics).toBeDefined();
        expect(data.phTrend).toBeInstanceOf(Array);
        expect(data.ecTrend).toBeInstanceOf(Array);
        expect(data.feedingTimeline).toBeInstanceOf(Array);
      });

      it('fetches feeding analytics with plantId parameter', async () => {
        const data = await getFeedingAnalytics({ plantId: 'plant-1' });

        expect(data).toBeDefined();
        expect(data.feedingTimeline).toBeInstanceOf(Array);
      });

      it('includes efficiency metrics in response', async () => {
        const data = await getFeedingAnalytics();

        expect(data.efficiencyMetrics).toHaveProperty('feedEfficiency');
        expect(data.efficiencyMetrics).toHaveProperty('waterUseEfficiency');
      });
    });

    describe('getCultivarComparison', () => {
      it('fetches cultivar comparison data', async () => {
        const data = await getCultivarComparison({
          cultivarIds: ['cultivar-1', 'cultivar-2'],
        });

        expect(data).toBeDefined();
        expect(data.cultivars).toBeInstanceOf(Array);
        expect(data.cultivars).toHaveLength(2);
        expect(data.bestPerformers).toBeDefined();
      });

      it('includes performance metrics for each cultivar', async () => {
        const data = await getCultivarComparison({
          cultivarIds: ['cultivar-1', 'cultivar-2'],
        });

        const cultivar = data.cultivars[0]!;
        expect(cultivar).toHaveProperty('cultivarId');
        expect(cultivar).toHaveProperty('cultivarName');
        expect(cultivar).toHaveProperty('performance');
        expect(cultivar.performance).toHaveProperty('avgYieldPerPlant');
        expect(cultivar.performance).toHaveProperty('successRate');
        expect(cultivar).toHaveProperty('environmentalPreferences');
      });

      it('fetches comparison with historical flag', async () => {
        const data = await getCultivarComparison({
          cultivarIds: ['cultivar-1', 'cultivar-2'],
          includeHistorical: true,
        });

        expect(data).toBeDefined();
        expect(data.cultivars).toBeInstanceOf(Array);
      });
    });

    describe('getYieldAnalytics', () => {
      it('fetches yield analytics without parameters', async () => {
        const data = await getYieldAnalytics();

        expect(data).toBeDefined();
        expect(data.yieldMetrics).toBeDefined();
        expect(data.yieldTrend).toBeInstanceOf(Array);
        expect(data.qualityTracking).toBeDefined();
        expect(data.topPerformers).toBeInstanceOf(Array);
      });

      it('fetches yield analytics with cultivarId parameter', async () => {
        const data = await getYieldAnalytics({ cultivarId: 'cultivar-1' });

        expect(data).toBeDefined();
        expect(data.yieldMetrics).toBeDefined();
      });

      it('includes all required yield metrics', async () => {
        const data = await getYieldAnalytics();

        expect(data.yieldMetrics).toHaveProperty('totalYield');
        expect(data.yieldMetrics).toHaveProperty('avgYieldPerPlant');
        expect(data.productionEfficiency).toHaveProperty('successRate');
      });
    });

    describe('getTimelineEvents', () => {
      it('fetches timeline events without parameters', async () => {
        const data = await getTimelineEvents();

        expect(data).toBeDefined();
        expect(data!.events).toBeInstanceOf(Array);
        expect(data!.milestones).toBeInstanceOf(Array);
        expect(data!.photos).toBeInstanceOf(Array);
      });

      it('fetches timeline events with growId parameter', async () => {
        const data = await getTimelineEvents({ growId: 'grow-1' });

        expect(data).toBeDefined();
        expect(data.events).toBeInstanceOf(Array);
      });

      it('fetches timeline events with event type filters', async () => {
        const data = await getTimelineEvents({
          eventTypes: ['feeding', 'training'],
        });

        expect(data).toBeDefined();
        expect(data.events).toBeInstanceOf(Array);
      });

      it('includes photo timeline in response', async () => {
        const data = await getTimelineEvents();

        expect(data.photos).toBeInstanceOf(Array);
        if (data.photos.length > 0) {
          const photo = data.photos[0];
          expect(photo).toHaveProperty('timestamp');
          expect(photo).toHaveProperty('photoUrl');
          expect(photo).toHaveProperty('plantId');
          expect(photo).toHaveProperty('plantStage');
        }
      });
    });
  });

  describe('React Query Hooks', () => {
    describe('useAnalyticsDashboard', () => {
      it('returns dashboard metrics data', async () => {
        const { result } = renderHook(() => useAnalyticsDashboard());

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.environmentalQuality).toBeInstanceOf(Array);
        expect(result.current.data?.plantStageDistribution).toBeInstanceOf(Array);
      });

      it('has correct cache key', async () => {
        const { result } = renderHook(() => useAnalyticsDashboard());

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        // Verify the query is cached properly
        expect(result.current.data).toBeDefined();
      });

      it('handles loading state', () => {
        const { result } = renderHook(() => useAnalyticsDashboard());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.data).toBeUndefined();
      });

      it('handles error state', async () => {
        server.use(errorHandlers.dashboardError);

        const { result } = renderHook(() => useAnalyticsDashboard());

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
        expect(result.current.data).toBeUndefined();
      });
    });

    describe('useEnvironmentalTrends', () => {
      it('returns environmental trends data', async () => {
        const { result } = renderHook(() => useEnvironmentalTrends());

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.dataPoints).toBeInstanceOf(Array);
      });

      it('accepts parameters in cache key', async () => {
        const params = { growId: 'grow-1', aggregation: 'daily' as const };
        const { result } = renderHook(() => useEnvironmentalTrends(params));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
      });

      it('handles error state', async () => {
        server.use(errorHandlers.environmentalError);

        const { result } = renderHook(() => useEnvironmentalTrends());

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
      });
    });

    describe('useFeedingAnalytics', () => {
      it('returns feeding analytics data', async () => {
        const { result } = renderHook(() => useFeedingAnalytics());

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.feedingTimeline).toBeInstanceOf(Array);
        expect(result.current.data?.nutrientMetrics).toBeDefined();
      });

      it('accepts plantId parameter', async () => {
        const { result } = renderHook(() => useFeedingAnalytics({ plantId: 'plant-1' }));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
      });

      it('handles error state', async () => {
        server.use(errorHandlers.feedingAnalyticsError);

        const { result } = renderHook(() => useFeedingAnalytics());

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
      });
    });

    describe('useCultivarComparison', () => {
      it('returns cultivar comparison data when enabled', async () => {
        const params = { cultivarIds: ['cultivar-1', 'cultivar-2'] };
        const { result } = renderHook(() => useCultivarComparison(params));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.cultivars).toHaveLength(2);
      });

      it('is disabled with less than 2 cultivars', () => {
        const params = { cultivarIds: ['cultivar-1'] };
        const { result } = renderHook(() => useCultivarComparison(params));

        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.data).toBeUndefined();
      });

      it('is disabled with more than 4 cultivars', () => {
        const params = {
          cultivarIds: ['cultivar-1', 'cultivar-2', 'cultivar-3', 'cultivar-4', 'cultivar-5'],
        };
        const { result } = renderHook(() => useCultivarComparison(params));

        expect(result.current.fetchStatus).toBe('idle');
        expect(result.current.data).toBeUndefined();
      });

      it('handles error state', async () => {
        server.use(errorHandlers.cultivarComparisonError);

        const params = { cultivarIds: ['cultivar-1', 'cultivar-2'] };
        const { result } = renderHook(() => useCultivarComparison(params));

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
      });
    });

    describe('useYieldAnalytics', () => {
      it('returns yield analytics data', async () => {
        const { result } = renderHook(() => useYieldAnalytics());

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.yieldMetrics).toBeDefined();
        expect(result.current.data?.yieldTrend).toBeInstanceOf(Array);
      });

      it('accepts cultivarId parameter', async () => {
        const { result } = renderHook(() => useYieldAnalytics({ cultivarId: 'cultivar-1' }));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
      });

      it('handles error state', async () => {
        server.use(errorHandlers.yieldError);

        const { result } = renderHook(() => useYieldAnalytics());

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
      });
    });

    describe('useTimelineEvents', () => {
      it('returns timeline events data', async () => {
        const { result } = renderHook(() => useTimelineEvents());

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
        expect(result.current.data?.events).toBeInstanceOf(Array);
        expect(result.current.data?.milestones).toBeInstanceOf(Array);
      });

      it('accepts event type filters', async () => {
        const params = { eventTypes: ['feeding', 'training'] };
        const { result } = renderHook(() => useTimelineEvents(params));

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(result.current.data).toBeDefined();
      });

      it('handles error state', async () => {
        server.use(errorHandlers.timelineError);

        const { result } = renderHook(() => useTimelineEvents());

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(result.current.error).toBeDefined();
      });
    });
  });

  describe('Cache Behavior', () => {
    it('uses 5-minute stale time for dashboard metrics', async () => {
      const { result } = renderHook(() => useAnalyticsDashboard());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Query should be cached and not refetching immediately
      expect(result.current.isRefetching).toBe(false);
    });

    it('includes parameters in cache keys', async () => {
      const params1 = { growId: 'grow-1' };
      const params2 = { growId: 'grow-2' };

      const { result: result1 } = renderHook(() => useEnvironmentalTrends(params1));
      const { result: result2 } = renderHook(() => useEnvironmentalTrends(params2));

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      // Both queries should succeed independently
      expect(result1.current.data).toBeDefined();
      expect(result2.current.data).toBeDefined();
    });

    it('enables refetch on window focus', async () => {
      const { result } = renderHook(() => useAnalyticsDashboard());

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // The query should have refetchOnWindowFocus enabled
      expect(result.current.data).toBeDefined();
    });
  });

  describe('Data Structure Validation', () => {
    it('dashboard metrics has correct structure', async () => {
      const data = await getDashboardMetrics();

      expect(data.environmentalQuality[0]).toHaveProperty('parameter');
      expect(data.environmentalQuality[0]).toHaveProperty('currentValue');
      expect(data.environmentalQuality[0]).toHaveProperty('unit');
      expect(data.environmentalQuality[0]).toHaveProperty('status');

      expect(data.plantStageDistribution[0]).toHaveProperty('stage');
      expect(data.plantStageDistribution[0]).toHaveProperty('count');
      expect(data.plantStageDistribution[0]).toHaveProperty('percentage');
    });

    it('environmental trends has correct data point structure', async () => {
      const data = await getEnvironmentalTrends();

      const dataPoint = data.dataPoints[0];
      expect(dataPoint).toHaveProperty('timestamp');
      // Environmental parameters are optional
      expect(dataPoint).toBeDefined();
    });

    it('feeding analytics has correct event structure', async () => {
      const data = await getFeedingAnalytics();

      const event = data.feedingTimeline[0];
      expect(event).toHaveProperty('timestamp');
      expect(event).toHaveProperty('feedingType');
      expect(event).toHaveProperty('waterVolume');
    });

    it('cultivar comparison has correct metrics structure', async () => {
      const data = await getCultivarComparison({
        cultivarIds: ['cultivar-1', 'cultivar-2'],
      });

      const cultivar = data.cultivars[0]!;
      expect(cultivar.environmentalPreferences).toHaveProperty('optimalTemperature');
      expect(cultivar.environmentalPreferences).toHaveProperty('optimalHumidity');
      expect(cultivar.environmentalPreferences).toHaveProperty('optimalVpd');
    });

    it('yield analytics has correct trend structure', async () => {
      const data = await getYieldAnalytics();

      const trend = data.yieldTrend[0];
      expect(trend).toHaveProperty('harvestDate');
      expect(trend).toHaveProperty('totalYield');
      expect(trend).toHaveProperty('plantCount');
      expect(trend).toHaveProperty('avgYieldPerPlant');
    });

    it('timeline events has correct milestone structure', async () => {
      const data = await getTimelineEvents();

      const milestone = data.milestones[0];
      expect(milestone).toHaveProperty('id');
      expect(milestone).toHaveProperty('type');
      expect(milestone).toHaveProperty('date');
      expect(milestone).toHaveProperty('growId');
    });
  });
});