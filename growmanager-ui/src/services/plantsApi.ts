import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  Plant,
  CreatePlantRequest,
  UpdatePlantRequest,
} from '@/types/plant';

/**
 * Plants API Service
 * Handles all plant-related API calls and React Query hooks
 */

/**
 * Get all plants for a specific grow
 */
export const getPlantsByGrow = async (growId: string): Promise<Plant[]> => {
  const response = await api.get<Plant[]>(`/api/grows/${growId}/plants`);
  return response.data;
};

/**
 * Get a single plant by ID
 */
export const getPlantById = async (id: string): Promise<Plant> => {
  const response = await api.get<Plant>(`/api/plants/${id}`);
  return response.data;
};

/**
 * Create a new plant
 */
export const createPlant = async (data: CreatePlantRequest): Promise<Plant> => {
  const { growId, ...plantData } = data;
  const response = await api.post<Plant>(`/api/grows/${growId}/plants`, plantData);
  return response.data;
};

/**
 * Update an existing plant
 */
export const updatePlant = async (
  id: string,
  data: UpdatePlantRequest
): Promise<Plant> => {
  const response = await api.put<Plant>(`/api/plants/${id}`, data);
  return response.data;
};

/**
 * Delete a plant
 */
export const deletePlant = async (id: string): Promise<void> => {
  await api.delete(`/api/plants/${id}`);
};

/**
 * React Query hook to fetch all plants for a grow
 */
export const usePlantsByGrow = (growId: string) => {
  return useQuery({
    queryKey: ['plants', 'grow', growId],
    queryFn: () => getPlantsByGrow(growId),
    enabled: !!growId,
  });
};

/**
 * React Query hook to fetch a single plant by ID
 */
export const usePlant = (id: string) => {
  return useQuery({
    queryKey: ['plants', id],
    queryFn: () => getPlantById(id),
    enabled: !!id,
  });
};

/**
 * React Query mutation hook to create a new plant
 */
export const useCreatePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPlant,
    onSuccess: (newPlant) => {
      // Invalidate plants list for this grow
      queryClient.invalidateQueries({ queryKey: ['plants', 'grow', newPlant.growId] });
      // Invalidate grow details to update plant count
      queryClient.invalidateQueries({ queryKey: ['grows', newPlant.growId] });
    },
  });
};

/**
 * React Query mutation hook to update a plant
 */
export const useUpdatePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePlantRequest }) =>
      updatePlant(id, data),
    onSuccess: (updatedPlant) => {
      // Invalidate plants list for this grow
      queryClient.invalidateQueries({ queryKey: ['plants', 'grow', updatedPlant.growId] });
      // Invalidate the specific plant
      queryClient.invalidateQueries({ queryKey: ['plants', updatedPlant.id] });
    },
  });
};

/**
 * React Query mutation hook to delete a plant
 */
export const useDeletePlant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePlant,
    onSuccess: () => {
      // Invalidate all plants queries
      queryClient.invalidateQueries({ queryKey: ['plants'] });
      // Invalidate grows to update plant counts
      queryClient.invalidateQueries({ queryKey: ['grows'] });
    },
  });
};