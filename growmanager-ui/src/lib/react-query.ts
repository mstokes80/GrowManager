import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

// Query key factory for consistent query keys
export const queryKeys = {
  all: ['grows'] as const,
  grows: {
    all: ['grows'] as const,
    lists: () => [...queryKeys.grows.all, 'list'] as const,
    list: (filters: string) => [...queryKeys.grows.lists(), { filters }] as const,
    details: () => [...queryKeys.grows.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.grows.details(), id] as const,
  },
  plants: {
    all: ['plants'] as const,
    lists: () => [...queryKeys.plants.all, 'list'] as const,
    list: (growId: number) => [...queryKeys.plants.lists(), { growId }] as const,
    details: () => [...queryKeys.plants.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.plants.details(), id] as const,
  },
  activities: {
    all: ['activities'] as const,
    lists: () => [...queryKeys.activities.all, 'list'] as const,
    list: (plantId: number) => [...queryKeys.activities.lists(), { plantId }] as const,
    byGrow: (growId: number) => [...queryKeys.activities.all, 'byGrow', growId] as const,
  },
  observations: {
    all: ['observations'] as const,
    lists: () => [...queryKeys.observations.all, 'list'] as const,
    list: (plantId: number) => [...queryKeys.observations.lists(), { plantId }] as const,
  },
  environment: {
    all: ['environment'] as const,
    lists: () => [...queryKeys.environment.all, 'list'] as const,
    list: (growId: number) => [...queryKeys.environment.lists(), { growId }] as const,
  },
  cultivars: {
    all: ['cultivars'] as const,
    lists: () => [...queryKeys.cultivars.all, 'list'] as const,
    list: (filters?: string) => [...queryKeys.cultivars.lists(), { filters }] as const,
    details: () => [...queryKeys.cultivars.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.cultivars.details(), id] as const,
  },
  user: {
    current: ['user', 'current'] as const,
    profile: ['user', 'profile'] as const,
  },
};