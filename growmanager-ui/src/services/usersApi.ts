import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { User } from '@/stores/authStore';
import { useAuthStore } from '@/stores/authStore';

export interface UpdateProfileRequest {
  displayName?: string;
  timezone?: string;
}

/**
 * Get current user profile
 */
export const getCurrentUser = async (): Promise<User> => {
  const { data } = await apiClient.get<User>('/api/users/me');
  return data;
};

/**
 * Update current user profile
 */
export const updateUserProfile = async (request: UpdateProfileRequest): Promise<User> => {
  const { data } = await apiClient.put<User>('/api/users/me', request);
  return data;
};

/**
 * Hook to fetch current user profile
 */
export const useCurrentUser = () => {
  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: getCurrentUser,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update user profile
 */
export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useAuthStore();

  return useMutation({
    mutationFn: updateUserProfile,
    onSuccess: (updatedUser) => {
      // Update the query cache
      queryClient.setQueryData(['users', 'me'], updatedUser);
      // Update the auth store
      updateUser(updatedUser);
    },
  });
};