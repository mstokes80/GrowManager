import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

/**
 * Grows API Service
 * Handles all grow-related API calls and React Query hooks
 */

export type LightingType = 'led' | 'hps' | 'mh' | 'cmh' | 'fluorescent' | 'natural';
export type MediumType = 'soil' | 'coco' | 'hydro' | 'aeroponics' | 'aquaponics';

export interface Grow {
  id: string;
  userId: string;
  name: string;
  startDate: string;
  endDate?: string;
  status: 'planning' | 'active' | 'flowering' | 'drying' | 'completed';
  environmentType: 'indoor' | 'outdoor' | 'greenhouse';
  notes?: string;
  lightingType?: LightingType;
  mediumType?: MediumType;
  location?: string;
  targetTempMin?: number;
  targetTempMax?: number;
  targetHumidityMin?: number;
  targetHumidityMax?: number;
  expectedHarvestDate?: string;
  tags?: string[];
  isArchived: boolean;
  sortOrder: number;
  plantCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGrowRequest {
  name: string;
  startDate: string;
  environmentType: 'indoor' | 'outdoor' | 'greenhouse';
  notes?: string;
  lightingType?: LightingType;
  mediumType?: MediumType;
  location?: string;
  targetTempMin?: number;
  targetTempMax?: number;
  targetHumidityMin?: number;
  targetHumidityMax?: number;
  expectedHarvestDate?: string;
  tags?: string[];
}

export interface UpdateGrowRequest {
  name?: string;
  endDate?: string;
  status?: 'planning' | 'active' | 'flowering' | 'drying' | 'completed';
  environmentType?: 'indoor' | 'outdoor' | 'greenhouse';
  notes?: string;
  lightingType?: LightingType;
  mediumType?: MediumType;
  location?: string;
  targetTempMin?: number;
  targetTempMax?: number;
  targetHumidityMin?: number;
  targetHumidityMax?: number;
  expectedHarvestDate?: string;
  tags?: string[];
}

/**
 * Get all grows for the authenticated user
 */
export const getGrows = async (): Promise<Grow[]> => {
  const response = await api.get<Grow[]>('/api/grows');
  return response.data;
};

/**
 * Get a single grow by ID
 */
export const getGrowById = async (id: string): Promise<Grow> => {
  const response = await api.get<Grow>(`/api/grows/${id}`);
  return response.data;
};

/**
 * Create a new grow
 */
export const createGrow = async (data: CreateGrowRequest): Promise<Grow> => {
  const response = await api.post<Grow>('/api/grows', data);
  return response.data;
};

/**
 * Update an existing grow
 */
export const updateGrow = async (
  id: string,
  data: UpdateGrowRequest
): Promise<Grow> => {
  const response = await api.put<Grow>(`/api/grows/${id}`, data);
  return response.data;
};

/**
 * Archive a grow
 */
export const archiveGrow = async (id: string): Promise<Grow> => {
  const response = await api.post<Grow>(`/api/grows/${id}/archive`);
  return response.data;
};

/**
 * Unarchive a grow
 */
export const unarchiveGrow = async (id: string): Promise<Grow> => {
  const response = await api.post<Grow>(`/api/grows/${id}/unarchive`);
  return response.data;
};

/**
 * Delete a grow (only if archived)
 */
export const deleteGrow = async (id: string): Promise<void> => {
  await api.delete(`/api/grows/${id}`);
};

/**
 * React Query hook to fetch all grows
 */
export const useGrows = () => {
  return useQuery({
    queryKey: ['grows'],
    queryFn: getGrows,
  });
};

/**
 * React Query hook to fetch a single grow by ID
 */
export const useGrow = (id: string) => {
  return useQuery({
    queryKey: ['grows', id],
    queryFn: () => getGrowById(id),
    enabled: !!id,
  });
};

/**
 * React Query mutation hook to create a new grow
 */
export const useCreateGrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createGrow,
    onSuccess: () => {
      // Invalidate and refetch grows list
      queryClient.invalidateQueries({ queryKey: ['grows'] });
    },
  });
};

/**
 * React Query mutation hook to update a grow
 */
export const useUpdateGrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGrowRequest }) =>
      updateGrow(id, data),
    onSuccess: (updatedGrow) => {
      // Invalidate grows list
      queryClient.invalidateQueries({ queryKey: ['grows'] });
      // Invalidate the specific grow
      queryClient.invalidateQueries({ queryKey: ['grows', updatedGrow.id] });
    },
  });
};

/**
 * React Query mutation hook to archive a grow
 */
export const useArchiveGrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: archiveGrow,
    onSuccess: (archivedGrow) => {
      // Invalidate grows list
      queryClient.invalidateQueries({ queryKey: ['grows'] });
      // Invalidate the specific grow
      queryClient.invalidateQueries({ queryKey: ['grows', archivedGrow.id] });
    },
  });
};

/**
 * React Query mutation hook to unarchive a grow
 */
export const useUnarchiveGrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unarchiveGrow,
    onSuccess: (unarchivedGrow) => {
      // Invalidate grows list
      queryClient.invalidateQueries({ queryKey: ['grows'] });
      // Invalidate the specific grow
      queryClient.invalidateQueries({ queryKey: ['grows', unarchivedGrow.id] });
    },
  });
};

/**
 * React Query mutation hook to delete a grow
 */
export const useDeleteGrow = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteGrow,
    onSuccess: () => {
      // Invalidate and refetch grows list
      queryClient.invalidateQueries({ queryKey: ['grows'] });
    },
  });
};

export interface SortOrderItem {
  id: string;
  sortOrder: number;
}

export interface UpdateSortOrderRequest {
  items: SortOrderItem[];
}

/**
 * Update sort order of grows
 */
export const updateGrowSortOrder = async (data: UpdateSortOrderRequest): Promise<void> => {
  await api.put('/api/grows/sort-order', data);
};

/**
 * React Query mutation hook to update grow sort order
 */
export const useUpdateGrowSortOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateGrowSortOrder,
    onSuccess: () => {
      // Invalidate and refetch grows list
      queryClient.invalidateQueries({ queryKey: ['grows'] });
    },
  });
};