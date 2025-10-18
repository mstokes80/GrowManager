import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';

/**
 * Cultivars API Service
 * Handles all cultivar-related API calls and React Query hooks
 */

export interface Cultivar {
  id: string;
  userId: string;
  name: string;
  breeder?: string;
  genetics?: string;
  type: 'indica' | 'sativa' | 'hybrid' | 'auto' | 'unknown';
  characteristics?: Record<string, any>;
  notes?: string;
  plantCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCultivarRequest {
  name: string;
  breeder?: string;
  genetics?: string;
  type: 'indica' | 'sativa' | 'hybrid' | 'auto' | 'unknown';
  characteristics?: Record<string, any>;
  notes?: string;
}

export interface UpdateCultivarRequest {
  name?: string;
  breeder?: string;
  genetics?: string;
  type?: 'indica' | 'sativa' | 'hybrid' | 'auto' | 'unknown';
  characteristics?: Record<string, any>;
  notes?: string;
}

/**
 * Get all cultivars for the authenticated user
 */
export const getCultivars = async (): Promise<Cultivar[]> => {
  const response = await api.get<Cultivar[]>('/api/cultivars');
  return response.data;
};

/**
 * Get a single cultivar by ID
 */
export const getCultivarById = async (id: string): Promise<Cultivar> => {
  const response = await api.get<Cultivar>(`/api/cultivars/${id}`);
  return response.data;
};

/**
 * Create a new cultivar
 */
export const createCultivar = async (data: CreateCultivarRequest): Promise<Cultivar> => {
  const response = await api.post<Cultivar>('/api/cultivars', data);
  return response.data;
};

/**
 * Update an existing cultivar
 */
export const updateCultivar = async (
  id: string,
  data: UpdateCultivarRequest
): Promise<Cultivar> => {
  const response = await api.put<Cultivar>(`/api/cultivars/${id}`, data);
  return response.data;
};

/**
 * Delete a cultivar
 */
export const deleteCultivar = async (id: string): Promise<void> => {
  await api.delete(`/api/cultivars/${id}`);
};

/**
 * React Query hook to fetch all cultivars
 */
export const useCultivars = () => {
  return useQuery({
    queryKey: ['cultivars'],
    queryFn: getCultivars,
  });
};

/**
 * React Query hook to fetch a single cultivar by ID
 */
export const useCultivar = (id: string) => {
  return useQuery({
    queryKey: ['cultivars', id],
    queryFn: () => getCultivarById(id),
    enabled: !!id,
  });
};

/**
 * React Query mutation hook to create a new cultivar
 */
export const useCreateCultivar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCultivar,
    onSuccess: () => {
      // Invalidate and refetch cultivars list
      queryClient.invalidateQueries({ queryKey: ['cultivars'] });
    },
  });
};

/**
 * React Query mutation hook to update a cultivar
 */
export const useUpdateCultivar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCultivarRequest }) =>
      updateCultivar(id, data),
    onSuccess: (updatedCultivar) => {
      // Invalidate cultivars list
      queryClient.invalidateQueries({ queryKey: ['cultivars'] });
      // Invalidate the specific cultivar
      queryClient.invalidateQueries({ queryKey: ['cultivars', updatedCultivar.id] });
    },
  });
};

/**
 * React Query mutation hook to delete a cultivar
 */
export const useDeleteCultivar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCultivar,
    onSuccess: () => {
      // Invalidate and refetch cultivars list
      queryClient.invalidateQueries({ queryKey: ['cultivars'] });
    },
  });
};