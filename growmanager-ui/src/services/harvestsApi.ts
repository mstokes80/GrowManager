import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  Harvest,
  CreateHarvestRequest,
  UpdateHarvestRequest,
  HarvestSummary,
} from '@/types/harvest';

/**
 * Harvests API Service
 * Handles all harvest-related API calls and React Query hooks
 */

/**
 * Get all harvests for a specific grow
 */
export const getHarvestsByGrow = async (growId: string): Promise<Harvest[]> => {
  const response = await api.get<Harvest[]>(`/api/grows/${growId}/harvests`);
  return response.data;
};

/**
 * Get harvest summary with aggregate statistics for a grow
 */
export const getHarvestSummary = async (growId: string): Promise<HarvestSummary> => {
  const response = await api.get<HarvestSummary>(`/api/grows/${growId}/harvests/summary`);
  return response.data;
};

/**
 * Get a single harvest by ID
 */
export const getHarvestById = async (id: string): Promise<Harvest> => {
  const response = await api.get<Harvest>(`/api/harvests/${id}`);
  return response.data;
};

/**
 * Create a new harvest for a plant
 */
export const createHarvest = async (
  plantId: string,
  data: CreateHarvestRequest
): Promise<Harvest> => {
  const response = await api.post<Harvest>(`/api/plants/${plantId}/harvests`, data);
  return response.data;
};

/**
 * Update an existing harvest
 */
export const updateHarvest = async (
  id: string,
  data: UpdateHarvestRequest
): Promise<Harvest> => {
  const response = await api.put<Harvest>(`/api/harvests/${id}`, data);
  return response.data;
};

/**
 * Delete a harvest
 */
export const deleteHarvest = async (id: string): Promise<void> => {
  await api.delete(`/api/harvests/${id}`);
};

/**
 * React Query hook to fetch harvests for a grow
 */
export const useHarvestsByGrow = (growId: string) => {
  return useQuery({
    queryKey: ['harvests', 'grow', growId],
    queryFn: () => getHarvestsByGrow(growId),
    enabled: !!growId,
  });
};

/**
 * React Query hook to fetch harvest summary for a grow
 */
export const useHarvestSummary = (growId: string) => {
  return useQuery({
    queryKey: ['harvests', 'grow', growId, 'summary'],
    queryFn: () => getHarvestSummary(growId),
    enabled: !!growId,
  });
};

/**
 * React Query hook to fetch a single harvest
 */
export const useHarvest = (id: string) => {
  return useQuery({
    queryKey: ['harvests', id],
    queryFn: () => getHarvestById(id),
    enabled: !!id,
  });
};

/**
 * React Query mutation hook to create a harvest
 */
export const useCreateHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plantId, data }: { plantId: string; data: CreateHarvestRequest }) =>
      createHarvest(plantId, data),
    onSuccess: (newHarvest) => {
      // Invalidate harvests list for this grow
      queryClient.invalidateQueries({ queryKey: ['harvests', 'grow', newHarvest.growId] });
      // Invalidate harvest summary
      queryClient.invalidateQueries({
        queryKey: ['harvests', 'grow', newHarvest.growId, 'summary'],
      });
      // Invalidate plant data (status changed to harvested)
      queryClient.invalidateQueries({ queryKey: ['plants', newHarvest.plantId] });
      // Invalidate plants list
      queryClient.invalidateQueries({ queryKey: ['plants'] });
    },
  });
};

/**
 * React Query mutation hook to update a harvest
 */
export const useUpdateHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHarvestRequest }) =>
      updateHarvest(id, data),
    onSuccess: (updatedHarvest) => {
      // Invalidate harvests list for this grow
      queryClient.invalidateQueries({
        queryKey: ['harvests', 'grow', updatedHarvest.growId],
      });
      // Invalidate harvest summary
      queryClient.invalidateQueries({
        queryKey: ['harvests', 'grow', updatedHarvest.growId, 'summary'],
      });
      // Invalidate the specific harvest
      queryClient.invalidateQueries({ queryKey: ['harvests', updatedHarvest.id] });
    },
  });
};

/**
 * React Query mutation hook to delete a harvest
 */
export const useDeleteHarvest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteHarvest,
    onSuccess: () => {
      // Invalidate all harvests queries
      queryClient.invalidateQueries({ queryKey: ['harvests'] });
    },
  });
};