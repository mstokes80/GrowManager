import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type {
  Observation,
  CreateObservationRequest,
  UpdateObservationRequest,
} from '@/types/observation';

/**
 * Observations API Service
 * Handles all observation-related API calls and React Query hooks
 */

/**
 * Get all observations for a specific plant
 */
export const getObservationsByPlant = async (plantId: string): Promise<Observation[]> => {
  const response = await api.get<Observation[]>(`/api/plants/${plantId}/observations`);
  return response.data;
};

/**
 * Get a single observation by ID
 */
export const getObservationById = async (id: string): Promise<Observation> => {
  const response = await api.get<Observation>(`/api/observations/${id}`);
  return response.data;
};

/**
 * Create a new observation with photos
 */
export const createObservation = async (
  plantId: string,
  data: CreateObservationRequest,
  files?: File[]
): Promise<Observation> => {
  const formData = new FormData();

  // Append observation data fields
  formData.append('timestamp', data.timestamp);
  formData.append('note', data.note);
  formData.append('observationType', data.observationType);

  // Append each tag separately (Spring will bind as List<String>)
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach((tag) => {
      formData.append('tags', tag);
    });
  }

  // Append photo files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('photos', file);
    });
  }

  const response = await api.post<Observation>(
    `/api/plants/${plantId}/observations`,
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
 * Update an existing observation
 */
export const updateObservation = async (
  id: string,
  data: UpdateObservationRequest,
  files?: File[],
  photosToRemove?: string[]
): Promise<Observation> => {
  const formData = new FormData();

  // Append observation data
  if (data.timestamp) formData.append('timestamp', data.timestamp);
  if (data.note !== undefined) formData.append('note', data.note);
  if (data.observationType) formData.append('observationType', data.observationType);

  // Append each tag separately (Spring will bind as List<String>)
  if (data.tags && data.tags.length > 0) {
    data.tags.forEach((tag) => {
      formData.append('tags', tag);
    });
  }

  // Append new photo files
  if (files && files.length > 0) {
    files.forEach((file) => {
      formData.append('photos', file);
    });
  }

  // Append each photo URL to remove separately (Spring will bind as List<String>)
  if (photosToRemove && photosToRemove.length > 0) {
    photosToRemove.forEach((url) => {
      formData.append('photosToRemove', url);
    });
  }

  const response = await api.put<Observation>(`/api/observations/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Delete an observation
 */
export const deleteObservation = async (id: string): Promise<void> => {
  await api.delete(`/api/observations/${id}`);
};

/**
 * React Query hook to fetch observations for a plant
 */
export const useObservationsByPlant = (plantId: string) => {
  return useQuery({
    queryKey: ['observations', 'plant', plantId],
    queryFn: () => getObservationsByPlant(plantId),
    enabled: !!plantId,
  });
};

/**
 * React Query hook to fetch a single observation
 */
export const useObservation = (id: string) => {
  return useQuery({
    queryKey: ['observations', id],
    queryFn: () => getObservationById(id),
    enabled: !!id,
  });
};

/**
 * React Query mutation hook to create an observation
 */
export const useCreateObservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ plantId, data, files }: {
      plantId: string;
      data: CreateObservationRequest;
      files?: File[]
    }) => createObservation(plantId, data, files),
    onSuccess: (newObservation) => {
      // Invalidate observations list for this plant
      queryClient.invalidateQueries({ queryKey: ['observations', 'plant', newObservation.plantId] });
    },
  });
};

/**
 * React Query mutation hook to update an observation
 */
export const useUpdateObservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
      files,
      photosToRemove
    }: {
      id: string;
      data: UpdateObservationRequest;
      files?: File[];
      photosToRemove?: string[];
    }) => updateObservation(id, data, files, photosToRemove),
    onSuccess: (updatedObservation) => {
      // Invalidate observations list for this plant
      queryClient.invalidateQueries({ queryKey: ['observations', 'plant', updatedObservation.plantId] });
      // Invalidate the specific observation
      queryClient.invalidateQueries({ queryKey: ['observations', updatedObservation.id] });
    },
  });
};

/**
 * React Query mutation hook to delete an observation
 */
export const useDeleteObservation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteObservation,
    onSuccess: () => {
      // Invalidate all observations queries
      queryClient.invalidateQueries({ queryKey: ['observations'] });
    },
  });
};