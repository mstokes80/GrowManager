import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  FeedingEvent,
  CreateFeedingEventRequest,
  UpdateFeedingEventRequest,
  FeedingEventStats,
} from '@/types/feedingEvent';

/**
 * Feeding Events API Service
 * Handles all feeding event-related API calls and React Query hooks
 */

/**
 * Get all feeding events for a specific plant
 */
export const getFeedingEventsByPlant = async (plantId: string): Promise<FeedingEvent[]> => {
  const response = await api.get<FeedingEvent[]>(`/api/plants/${plantId}/feeding-events`);
  return response.data;
};

/**
 * Get all feeding events for a specific grow
 */
export const getFeedingEventsByGrow = async (growId: string): Promise<FeedingEvent[]> => {
  const response = await api.get<FeedingEvent[]>(`/api/grows/${growId}/feeding-events`);
  return response.data;
};

/**
 * Get a single feeding event by ID
 */
export const getFeedingEventById = async (id: string): Promise<FeedingEvent> => {
  const response = await api.get<FeedingEvent>(`/api/feeding-events/${id}`);
  return response.data;
};

/**
 * Get recent feeding events for a plant
 */
export const getRecentFeedingEvents = async (
  plantId: string,
  limit: number = 10
): Promise<FeedingEvent[]> => {
  const response = await api.get<FeedingEvent[]>(
    `/api/plants/${plantId}/feeding-events/recent?limit=${limit}`
  );
  return response.data;
};

/**
 * Get feeding event statistics for a plant
 */
export const getFeedingEventStats = async (plantId: string): Promise<FeedingEventStats> => {
  const response = await api.get<FeedingEventStats>(`/api/plants/${plantId}/feeding-events/stats`);
  return response.data;
};

/**
 * Create a new feeding event
 */
export const createFeedingEvent = async (
  data: CreateFeedingEventRequest
): Promise<FeedingEvent> => {
  const response = await api.post<FeedingEvent>(
    `/api/plants/${data.plantId}/feeding-events`,
    data
  );
  return response.data;
};

/**
 * Update an existing feeding event
 */
export const updateFeedingEvent = async (
  id: string,
  data: UpdateFeedingEventRequest
): Promise<FeedingEvent> => {
  const response = await api.put<FeedingEvent>(`/api/feeding-events/${id}`, data);
  return response.data;
};

/**
 * Delete a feeding event
 */
export const deleteFeedingEvent = async (id: string): Promise<void> => {
  await api.delete(`/api/feeding-events/${id}`);
};

/**
 * React Query hook to fetch feeding events for a plant
 */
export const useFeedingEventsByPlant = (plantId: string) => {
  return useQuery({
    queryKey: ['feeding-events', 'plant', plantId],
    queryFn: () => getFeedingEventsByPlant(plantId),
    enabled: !!plantId,
  });
};

/**
 * React Query hook to fetch feeding events for a grow
 */
export const useFeedingEventsByGrow = (growId: string) => {
  return useQuery({
    queryKey: ['feeding-events', 'grow', growId],
    queryFn: () => getFeedingEventsByGrow(growId),
    enabled: !!growId,
  });
};

/**
 * React Query hook to fetch a single feeding event
 */
export const useFeedingEvent = (id: string) => {
  return useQuery({
    queryKey: ['feeding-events', id],
    queryFn: () => getFeedingEventById(id),
    enabled: !!id,
  });
};

/**
 * React Query hook to fetch recent feeding events
 */
export const useRecentFeedingEvents = (plantId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['feeding-events', 'plant', plantId, 'recent', limit],
    queryFn: () => getRecentFeedingEvents(plantId, limit),
    enabled: !!plantId,
  });
};

/**
 * React Query hook to fetch feeding event stats
 */
export const useFeedingEventStats = (plantId: string) => {
  return useQuery({
    queryKey: ['feeding-events', 'plant', plantId, 'stats'],
    queryFn: () => getFeedingEventStats(plantId),
    enabled: !!plantId,
  });
};

/**
 * React Query mutation hook to create a feeding event
 */
export const useCreateFeedingEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createFeedingEvent,
    onSuccess: (newEvent) => {
      // Invalidate feeding events for this plant
      queryClient.invalidateQueries({ queryKey: ['feeding-events', 'plant', newEvent.plantId] });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['feeding-events', 'plant', newEvent.plantId, 'stats'] });
    },
  });
};

/**
 * React Query mutation hook to update a feeding event
 */
export const useUpdateFeedingEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateFeedingEventRequest }) =>
      updateFeedingEvent(id, data),
    onSuccess: (updatedEvent) => {
      // Invalidate feeding events for this plant
      queryClient.invalidateQueries({ queryKey: ['feeding-events', 'plant', updatedEvent.plantId] });
      // Invalidate the specific event
      queryClient.invalidateQueries({ queryKey: ['feeding-events', updatedEvent.id] });
      // Invalidate stats
      queryClient.invalidateQueries({ queryKey: ['feeding-events', 'plant', updatedEvent.plantId, 'stats'] });
    },
  });
};

/**
 * React Query mutation hook to delete a feeding event
 */
export const useDeleteFeedingEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteFeedingEvent,
    onSuccess: () => {
      // Invalidate all feeding events queries
      queryClient.invalidateQueries({ queryKey: ['feeding-events'] });
    },
  });
};