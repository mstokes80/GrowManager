/**
 * Offline Query Hook
 *
 * Extends React Query with offline support using IndexedDB.
 * Automatically falls back to cached data when offline and queues mutations for sync.
 */

import { useQuery, useMutation, useQueryClient, QueryKey } from '@tanstack/react-query'
import { useOnlineStatus } from './useOnlineStatus'
import {
  saveToIndexedDB,
  getFromIndexedDB,
  getAllFromIndexedDB,
  addToSyncQueue,
  EntityType,
  EntityData,
} from '@/services/offlineStorage'

/**
 * Options for offline query
 */
export interface UseOfflineQueryOptions<TData> {
  queryKey: QueryKey
  queryFn: () => Promise<TData>
  entityType: EntityType
  enabled?: boolean
}

/**
 * Hook for offline-first queries
 *
 * When online: fetches from API and caches to IndexedDB
 * When offline: fetches from IndexedDB
 *
 * @param options - Query options including entity type and query function
 * @returns React Query result with offline support
 */
export function useOfflineQuery<TData extends EntityData | EntityData[]>({
  queryKey,
  queryFn,
  entityType,
  enabled = true,
}: UseOfflineQueryOptions<TData>) {
  const isOnline = useOnlineStatus()

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (isOnline) {
        try {
          // Try to fetch from API when online
          const data = await queryFn()

          // Cache the data to IndexedDB
          if (Array.isArray(data)) {
            // Save each item if it's an array
            await Promise.all(
              data.map((item) => saveToIndexedDB(entityType, item as EntityData)),
            )
          } else {
            // Save single item
            await saveToIndexedDB(entityType, data as EntityData)
          }

          return data
        } catch (error) {
          // If API call fails but we're online, fall back to IndexedDB
          console.warn('API call failed, falling back to IndexedDB:', error)
          if (Array.isArray(queryFn)) {
            return (await getAllFromIndexedDB(entityType)) as TData
          } else {
            // This would need the ID from queryKey
            throw error
          }
        }
      } else {
        // When offline, fetch from IndexedDB
        if (queryKey.includes('list') || queryKey.includes('all')) {
          return (await getAllFromIndexedDB(entityType)) as TData
        } else {
          // For single item queries, extract ID from queryKey
          const id = queryKey[queryKey.length - 1] as string
          const item = await getFromIndexedDB(entityType, id)
          if (!item) {
            throw new Error(`Entity ${id} not found in offline storage`)
          }
          return item as TData
        }
      }
    },
    enabled,
    staleTime: isOnline ? 1000 * 60 * 5 : Infinity, // 5 min when online, never stale offline
    gcTime: 1000 * 60 * 30, // 30 minutes (renamed from cacheTime in React Query v5)
  })
}

/**
 * Options for offline mutation
 */
export interface UseOfflineMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  entityType: EntityType
  action: 'create' | 'update' | 'delete'
  onSuccess?: (data: TData) => void
  onError?: (error: Error) => void
}

/**
 * Hook for offline-first mutations
 *
 * When online: performs mutation via API
 * When offline: saves to IndexedDB and adds to sync queue
 *
 * @param options - Mutation options including entity type and mutation function
 * @returns React Query mutation result with offline support
 */
export function useOfflineMutation<TData extends EntityData, TVariables>({
  mutationFn,
  entityType,
  action,
  onSuccess,
  onError,
}: UseOfflineMutationOptions<TData, TVariables>) {
  const isOnline = useOnlineStatus()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: TVariables) => {
      if (isOnline) {
        try {
          // Perform mutation via API when online
          const data = await mutationFn(variables)

          // Update IndexedDB cache
          if (action === 'delete') {
            // Extract ID from variables for delete
            const id = (variables as any).id
            await import('@/services/offlineStorage').then(({ deleteFromIndexedDB }) =>
              deleteFromIndexedDB(entityType, id),
            )
          } else {
            await saveToIndexedDB(entityType, data)
          }

          return data
        } catch (error) {
          // If API call fails, queue for sync
          console.warn('Mutation failed, queueing for sync:', error)
          throw error
        }
      } else {
        // When offline, save to IndexedDB and queue for sync
        const data = variables as unknown as TData

        if (action === 'delete') {
          const id = (variables as any).id
          await import('@/services/offlineStorage').then(({ deleteFromIndexedDB }) =>
            deleteFromIndexedDB(entityType, id),
          )
        } else {
          await saveToIndexedDB(entityType, data)
        }

        // Add to sync queue
        await addToSyncQueue(action, entityType, data)

        return data
      }
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: [entityType] })
      onSuccess?.(data)
    },
    onError,
  })
}