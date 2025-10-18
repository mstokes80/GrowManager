import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  ActivityLog,
  ActivityType,
  CreateActivityLogRequest,
  UpdateActivityLogRequest,
} from '@/types/activityLog';

/**
 * Activity Logs API Service
 * Handles all activity log-related API calls and React Query hooks
 */

/**
 * Get all activity logs for a specific plant
 */
export const getActivityLogsByPlant = async (plantId: string): Promise<ActivityLog[]> => {
  const response = await api.get<ActivityLog[]>(`/api/plants/${plantId}/activity-logs`);
  return response.data;
};

/**
 * Get all activity logs for a specific grow
 */
export const getActivityLogsByGrow = async (growId: string): Promise<ActivityLog[]> => {
  const response = await api.get<ActivityLog[]>(`/api/grows/${growId}/activity-logs`);
  return response.data;
};

/**
 * Get activity logs by type for a plant
 */
export const getActivityLogsByType = async (
  plantId: string,
  activityType: ActivityType
): Promise<ActivityLog[]> => {
  const response = await api.get<ActivityLog[]>(
    `/api/plants/${plantId}/activity-logs/type/${activityType}`
  );
  return response.data;
};

/**
 * Get a single activity log by ID
 */
export const getActivityLogById = async (id: string): Promise<ActivityLog> => {
  const response = await api.get<ActivityLog>(`/api/activity-logs/${id}`);
  return response.data;
};

/**
 * Get recent activity logs for a plant
 */
export const getRecentActivityLogs = async (
  plantId: string,
  limit: number = 10
): Promise<ActivityLog[]> => {
  const response = await api.get<ActivityLog[]>(
    `/api/plants/${plantId}/activity-logs/recent?limit=${limit}`
  );
  return response.data;
};

/**
 * Create a new activity log
 */
export const createActivityLog = async (
  data: CreateActivityLogRequest
): Promise<ActivityLog> => {
  const response = await api.post<ActivityLog>(
    `/api/plants/${data.plantId}/activity-logs`,
    data
  );
  return response.data;
};

/**
 * Update an existing activity log
 */
export const updateActivityLog = async (
  id: string,
  data: UpdateActivityLogRequest
): Promise<ActivityLog> => {
  const response = await api.put<ActivityLog>(`/api/activity-logs/${id}`, data);
  return response.data;
};

/**
 * Delete an activity log
 */
export const deleteActivityLog = async (id: string): Promise<void> => {
  await api.delete(`/api/activity-logs/${id}`);
};

/**
 * React Query hook to fetch activity logs for a plant
 */
export const useActivityLogsByPlant = (plantId: string) => {
  return useQuery({
    queryKey: ['activity-logs', 'plant', plantId],
    queryFn: () => getActivityLogsByPlant(plantId),
    enabled: !!plantId,
  });
};

/**
 * React Query hook to fetch activity logs for a grow
 */
export const useActivityLogsByGrow = (growId: string) => {
  return useQuery({
    queryKey: ['activity-logs', 'grow', growId],
    queryFn: () => getActivityLogsByGrow(growId),
    enabled: !!growId,
  });
};

/**
 * React Query hook to fetch activity logs by type
 */
export const useActivityLogsByType = (plantId: string, activityType: ActivityType) => {
  return useQuery({
    queryKey: ['activity-logs', 'plant', plantId, 'type', activityType],
    queryFn: () => getActivityLogsByType(plantId, activityType),
    enabled: !!plantId && !!activityType,
  });
};

/**
 * React Query hook to fetch a single activity log
 */
export const useActivityLog = (id: string) => {
  return useQuery({
    queryKey: ['activity-logs', id],
    queryFn: () => getActivityLogById(id),
    enabled: !!id,
  });
};

/**
 * React Query hook to fetch recent activity logs
 */
export const useRecentActivityLogs = (plantId: string, limit: number = 10) => {
  return useQuery({
    queryKey: ['activity-logs', 'plant', plantId, 'recent', limit],
    queryFn: () => getRecentActivityLogs(plantId, limit),
    enabled: !!plantId,
  });
};

/**
 * React Query mutation hook to create an activity log
 */
export const useCreateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createActivityLog,
    onSuccess: (newLog) => {
      // Invalidate activity logs for this plant
      queryClient.invalidateQueries({ queryKey: ['activity-logs', 'plant', newLog.plantId] });
    },
  });
};

/**
 * React Query mutation hook to update an activity log
 */
export const useUpdateActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityLogRequest }) =>
      updateActivityLog(id, data),
    onSuccess: (updatedLog) => {
      // Invalidate activity logs for this plant
      queryClient.invalidateQueries({ queryKey: ['activity-logs', 'plant', updatedLog.plantId] });
      // Invalidate the specific log
      queryClient.invalidateQueries({ queryKey: ['activity-logs', updatedLog.id] });
    },
  });
};

/**
 * React Query mutation hook to delete an activity log
 */
export const useDeleteActivityLog = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteActivityLog,
    onSuccess: () => {
      // Invalidate all activity logs queries
      queryClient.invalidateQueries({ queryKey: ['activity-logs'] });
    },
  });
};