import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  DashboardMetricsResponse,
  EnvironmentalTrendsResponse,
  EnvironmentalTrendsRequest,
  FeedingAnalyticsResponse,
  FeedingAnalyticsRequest,
  CultivarComparisonResponse,
  CultivarComparisonRequest,
  YieldAnalyticsResponse,
  YieldAnalyticsRequest,
  TimelineEventsResponse,
  TimelineEventsRequest,
} from '@/types/analytics';

/**
 * Analytics API Service
 * Handles all analytics-related API calls and React Query hooks
 */

// ============================================================================
// API Functions
// ============================================================================

/**
 * Get enhanced dashboard metrics
 */
export const getDashboardMetrics = async (): Promise<DashboardMetricsResponse> => {
  const response = await api.get<DashboardMetricsResponse>('/api/analytics/dashboard');
  return response.data;
};

/**
 * Get environmental trends data
 */
export const getEnvironmentalTrends = async (
  params: EnvironmentalTrendsRequest = {}
): Promise<EnvironmentalTrendsResponse> => {
  const response = await api.get<EnvironmentalTrendsResponse>('/api/analytics/environmental', {
    params,
  });
  return response.data;
};

/**
 * Get feeding analytics data
 */
export const getFeedingAnalytics = async (
  params: FeedingAnalyticsRequest = {}
): Promise<FeedingAnalyticsResponse> => {
  const response = await api.get<FeedingAnalyticsResponse>('/api/analytics/feeding', {
    params,
  });
  return response.data;
};

/**
 * Get cultivar comparison data
 */
export const getCultivarComparison = async (
  params: CultivarComparisonRequest
): Promise<CultivarComparisonResponse> => {
  const response = await api.get<CultivarComparisonResponse>('/api/analytics/cultivars/compare', {
    params: {
      cultivarIds: params.cultivarIds.join(','),
      includeHistorical: params.includeHistorical,
    },
  });
  return response.data;
};

/**
 * Get yield analytics data
 */
export const getYieldAnalytics = async (
  params: YieldAnalyticsRequest = {}
): Promise<YieldAnalyticsResponse> => {
  const response = await api.get<YieldAnalyticsResponse>('/api/analytics/yield', {
    params,
  });
  return response.data;
};

/**
 * Get timeline events data
 */
export const getTimelineEvents = async (
  params: TimelineEventsRequest = {}
): Promise<TimelineEventsResponse> => {
  const response = await api.get<TimelineEventsResponse>('/api/analytics/timeline', {
    params: {
      ...params,
      eventTypes: params.eventTypes?.join(','),
    },
  });
  return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * React Query hook to fetch dashboard metrics
 * Cached for 5 minutes (300000ms) as per requirements
 */
export const useAnalyticsDashboard = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: getDashboardMetrics,
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * React Query hook to fetch environmental trends
 * Cached for 5 minutes with parameters as part of cache key
 */
export const useEnvironmentalTrends = (
  params: EnvironmentalTrendsRequest = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['analytics', 'environmental', params],
    queryFn: () => getEnvironmentalTrends(params),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true, // Default to enabled if not specified
  });
};

/**
 * React Query hook to fetch feeding analytics
 * Cached for 5 minutes with parameters as part of cache key
 */
export const useFeedingAnalytics = (
  params: FeedingAnalyticsRequest = {},
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['analytics', 'feeding', params],
    queryFn: () => getFeedingAnalytics(params),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: options?.enabled ?? true, // Default to enabled if not specified
  });
};

/**
 * React Query hook to fetch cultivar comparison
 * Only enabled when cultivarIds are provided (2-4 required)
 * Cached for 5 minutes with cultivar IDs as part of cache key
 */
export const useCultivarComparison = (params: CultivarComparisonRequest) => {
  const isEnabled = params.cultivarIds.length >= 2 && params.cultivarIds.length <= 4;

  return useQuery({
    queryKey: ['analytics', 'cultivars', 'compare', params],
    queryFn: () => getCultivarComparison(params),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
    enabled: isEnabled,
  });
};

/**
 * React Query hook to fetch yield analytics
 * Cached for 5 minutes with parameters as part of cache key
 */
export const useYieldAnalytics = (params: YieldAnalyticsRequest = {}) => {
  return useQuery({
    queryKey: ['analytics', 'yield', params],
    queryFn: () => getYieldAnalytics(params),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};

/**
 * React Query hook to fetch timeline events
 * Cached for 5 minutes with parameters as part of cache key
 */
export const useTimelineEvents = (params: TimelineEventsRequest = {}) => {
  return useQuery({
    queryKey: ['analytics', 'timeline', params],
    queryFn: () => getTimelineEvents(params),
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: true,
  });
};