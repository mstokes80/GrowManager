import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  EnvironmentalSnapshot,
  CreateEnvironmentalSnapshotRequest,
} from '@/types/environmentalSnapshot';

/**
 * Environmental Snapshots API Service
 * Handles all environmental snapshot-related API calls and React Query hooks
 */

/**
 * Get all environmental snapshots for a grow
 */
export const getSnapshotsByGrow = async (
  growId: string,
  startDate?: string,
  endDate?: string
): Promise<EnvironmentalSnapshot[]> => {
  const params = new URLSearchParams();
  if (startDate) params.append('startDate', startDate);
  if (endDate) params.append('endDate', endDate);

  const queryString = params.toString();
  const url = `/api/grows/${growId}/environmental${queryString ? `?${queryString}` : ''}`;

  const response = await api.get<EnvironmentalSnapshot[]>(url);
  return response.data;
};

/**
 * Get all environmental snapshots for a plant
 */
export const getSnapshotsByPlant = async (plantId: string): Promise<EnvironmentalSnapshot[]> => {
  const response = await api.get<EnvironmentalSnapshot[]>(`/api/plants/${plantId}/environmental`);
  return response.data;
};

/**
 * Create a new environmental snapshot for a grow
 */
export const createSnapshotForGrow = async (
  growId: string,
  data: CreateEnvironmentalSnapshotRequest
): Promise<EnvironmentalSnapshot> => {
  const response = await api.post<EnvironmentalSnapshot>(`/api/grows/${growId}/environmental`, data);
  return response.data;
};

/**
 * Create a new environmental snapshot for a plant
 */
export const createSnapshotForPlant = async (
  plantId: string,
  data: CreateEnvironmentalSnapshotRequest
): Promise<EnvironmentalSnapshot> => {
  const response = await api.post<EnvironmentalSnapshot>(`/api/plants/${plantId}/environmental`, data);
  return response.data;
};

/**
 * Delete an environmental snapshot
 */
export const deleteSnapshot = async (id: string): Promise<void> => {
  await api.delete(`/api/environmental/${id}`);
};

/**
 * React Query hook to fetch environmental snapshots for a grow
 */
export const useEnvironmentalSnapshotsByGrow = (
  growId: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery({
    queryKey: ['environmental-snapshots', 'grow', growId, startDate, endDate],
    queryFn: () => getSnapshotsByGrow(growId, startDate, endDate),
    enabled: !!growId,
  });
};

/**
 * React Query hook to fetch environmental snapshots for a plant
 */
export const useEnvironmentalSnapshotsByPlant = (plantId: string) => {
  return useQuery({
    queryKey: ['environmental-snapshots', 'plant', plantId],
    queryFn: () => getSnapshotsByPlant(plantId),
    enabled: !!plantId,
  });
};

/**
 * React Query mutation hook to create a new environmental snapshot for a grow
 */
export const useCreateSnapshotForGrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ growId, data }: { growId: string; data: CreateEnvironmentalSnapshotRequest }) =>
      createSnapshotForGrow(growId, data),
    onSuccess: (_, variables) => {
      // Invalidate snapshots for this grow
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots', 'grow', variables.growId] });
    },
  });
};

/**
 * React Query mutation hook to create a new environmental snapshot for a plant
 */
export const useCreateSnapshotForPlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plantId, data }: { plantId: string; data: CreateEnvironmentalSnapshotRequest }) =>
      createSnapshotForPlant(plantId, data),
    onSuccess: (newSnapshot) => {
      // Invalidate snapshots for this plant
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots', 'plant', newSnapshot.plantId] });
      // Also invalidate for the grow
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots', 'grow', newSnapshot.growId] });
    },
  });
};

/**
 * React Query mutation hook to delete an environmental snapshot
 */
export const useDeleteSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSnapshot,
    onSuccess: () => {
      // Invalidate all environmental snapshots queries
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots'] });
    },
  });
};