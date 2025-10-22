import { useMutation, useQuery, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  EnvironmentalSnapshot,
  CreateEnvironmentalSnapshotRequest,
  EnvironmentalImportResponse,
  PageResponse,
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
 * Get paginated environmental snapshots for a grow
 */
export const getSnapshotsByGrowPaginated = async (
  growId: string,
  page: number = 0,
  size: number = 20,
  sort: string = 'timestamp,desc'
): Promise<PageResponse<EnvironmentalSnapshot>> => {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('size', size.toString());
  params.append('sort', sort);

  const url = `/api/grows/${growId}/environmental?${params.toString()}`;

  const response = await api.get<PageResponse<EnvironmentalSnapshot>>(url);
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
 * React Query infinite hook for paginated environmental snapshots
 * Used for infinite scrolling
 */
export const useInfiniteEnvironmentalSnapshots = (growId: string, pageSize: number = 20) => {
  return useInfiniteQuery({
    queryKey: ['environmental-snapshots-infinite', 'grow', growId],
    queryFn: ({ pageParam = 0 }) => getSnapshotsByGrowPaginated(growId, pageParam, pageSize, 'timestamp,desc'),
    getNextPageParam: (lastPage) => {
      return lastPage.hasNext ? lastPage.page + 1 : undefined;
    },
    enabled: !!growId,
    initialPageParam: 0,
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
      // Invalidate snapshots for this grow (both regular and infinite queries)
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots', 'grow', variables.growId] });
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots-infinite', 'grow', variables.growId] });
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
      // Invalidate all environmental snapshots queries (both regular and infinite)
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots'] });
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots-infinite'] });
    },
  });
};

/**
 * Import environmental data from a CSV file
 */
export const importEnvironmentalCSV = async (
  growId: string,
  file: File
): Promise<EnvironmentalImportResponse> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post<EnvironmentalImportResponse>(
    `/api/grows/${growId}/environmental/import`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * React Query mutation hook to import environmental data from CSV
 */
export const useImportEnvironmentalCSV = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ growId, file }: { growId: string; file: File }) =>
      importEnvironmentalCSV(growId, file),
    onSuccess: (_, variables) => {
      // Invalidate snapshots for this grow to refresh the data (both regular and infinite queries)
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots', 'grow', variables.growId] });
      queryClient.invalidateQueries({ queryKey: ['environmental-snapshots-infinite', 'grow', variables.growId] });
    },
  });
};