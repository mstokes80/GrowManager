/**
 * Offline Storage Service
 *
 * Provides CRUD operations for offline data storage using IndexedDB.
 * Manages sync queue for tracking changes made while offline.
 */

import { db, SyncQueueItem } from '@/lib/db'
import type { Grow } from '@/services/growsApi'
import type { Cultivar } from '@/services/cultivarsApi'
import type { Plant } from '@/types/plant'
import type { Observation } from '@/types/observation'
import type { FeedingEvent } from '@/types/feedingEvent'
import type { ActivityLog } from '@/types/activityLog'
import type { Harvest } from '@/types/harvest'
import type { EnvironmentSnapshot } from '@/lib/db'

/**
 * Entity types supported by offline storage
 */
export type EntityType =
  | 'grows'
  | 'cultivars'
  | 'plants'
  | 'observations'
  | 'feedingEvents'
  | 'activities'
  | 'environmentSnapshots'
  | 'harvests'
  | 'photos' // Special case - handled via photoQueue

/**
 * Union type for all entity data
 */
export type EntityData =
  | Grow
  | Cultivar
  | Plant
  | Observation
  | FeedingEvent
  | ActivityLog
  | EnvironmentSnapshot
  | Harvest

/**
 * Get the appropriate table for an entity type
 */
function getTable(entityType: EntityType) {
  switch (entityType) {
    case 'grows':
      return db.grows
    case 'cultivars':
      return db.cultivars
    case 'plants':
      return db.plants
    case 'observations':
      return db.observations
    case 'feedingEvents':
      return db.feedingEvents
    case 'activities':
      return db.activities
    case 'environmentSnapshots':
      return db.environmentSnapshots
    case 'harvests':
      return db.harvests
    case 'photos':
      // Photos are handled via photoQueue, not a regular entity table
      return db.photoQueue as any
  }
}

/**
 * Save an entity to IndexedDB
 */
export async function saveToIndexedDB<T extends EntityData>(
  entityType: EntityType,
  data: T,
): Promise<void> {
  const table = getTable(entityType)
  await table.put(data as any)
}

/**
 * Get an entity from IndexedDB by ID
 */
export async function getFromIndexedDB<T extends EntityData>(
  entityType: EntityType,
  id: string,
): Promise<T | undefined> {
  const table = getTable(entityType)
  return (await table.get(id)) as T | undefined
}

/**
 * Update an entity in IndexedDB
 */
export async function updateInIndexedDB<T extends EntityData>(
  entityType: EntityType,
  id: string,
  data: Partial<T>,
): Promise<void> {
  const table = getTable(entityType)
  await table.update(id, data)
}

/**
 * Delete an entity from IndexedDB
 */
export async function deleteFromIndexedDB(
  entityType: EntityType,
  id: string,
): Promise<void> {
  const table = getTable(entityType)
  await table.delete(id)
}

/**
 * Get all entities of a specific type from IndexedDB
 */
export async function getAllFromIndexedDB<T extends EntityData>(
  entityType: EntityType,
): Promise<T[]> {
  const table = getTable(entityType)
  return (await table.toArray()) as T[]
}

/**
 * Query entities by a specific field
 */
export async function queryIndexedDB<T extends EntityData>(
  entityType: EntityType,
  field: string,
  value: any,
): Promise<T[]> {
  const table = getTable(entityType)
  return (await table.where(field).equals(value).toArray()) as T[]
}

/**
 * Add an item to the sync queue
 */
export async function addToSyncQueue(
  action: 'create' | 'update' | 'delete' | 'upload-photo',
  entityType: EntityType,
  data: EntityData,
): Promise<number> {
  const queueItem: Omit<SyncQueueItem, 'id'> = {
    entityType,
    entityId: (data as any).id,
    action,
    data,
    timestamp: Date.now(),
    status: 'pending',
    retryCount: 0,
  }

  return await db.syncQueue.add(queueItem as SyncQueueItem)
}

/**
 * Get all pending sync queue items
 */
export async function getSyncQueue(): Promise<SyncQueueItem[]> {
  return await db.syncQueue.where('status').equals('pending').sortBy('timestamp')
}

/**
 * Get sync queue items by status
 */
export async function getSyncQueueByStatus(
  status: 'pending' | 'syncing' | 'synced' | 'error',
): Promise<SyncQueueItem[]> {
  return await db.syncQueue.where('status').equals(status).sortBy('timestamp')
}

/**
 * Mark a sync queue item as complete
 */
export async function markSyncComplete(id: number): Promise<void> {
  await db.syncQueue.update(id, {
    status: 'synced',
  })
}

/**
 * Mark a sync queue item as syncing
 */
export async function markSyncInProgress(id: number): Promise<void> {
  await db.syncQueue.update(id, {
    status: 'syncing',
  })
}

/**
 * Mark a sync queue item as error
 */
export async function markSyncError(id: number, error: string): Promise<void> {
  const item = await db.syncQueue.get(id)
  if (item) {
    await db.syncQueue.update(id, {
      status: 'error',
      error,
      retryCount: item.retryCount + 1,
      lastRetryAt: Date.now(),
    })
  }
}

/**
 * Retry a failed sync queue item
 */
export async function retrySyncItem(id: number): Promise<void> {
  await db.syncQueue.update(id, {
    status: 'pending',
    error: undefined,
  })
}

/**
 * Remove a sync queue item
 */
export async function removeSyncQueueItem(id: number): Promise<void> {
  await db.syncQueue.delete(id)
}

/**
 * Clear completed sync items (older than 24 hours)
 */
export async function clearCompletedSyncItems(): Promise<void> {
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  await db.syncQueue
    .where('status')
    .equals('synced')
    .and((item) => item.timestamp < oneDayAgo)
    .delete()
}

/**
 * Get sync queue count by status
 */
export async function getSyncQueueCount(
  status?: 'pending' | 'syncing' | 'synced' | 'error',
): Promise<number> {
  if (status) {
    return await db.syncQueue.where('status').equals(status).count()
  }
  return await db.syncQueue.count()
}