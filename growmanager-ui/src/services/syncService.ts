/**
 * Background Sync Service
 *
 * Handles synchronization of offline changes with the server.
 * Implements:
 * - Automatic sync when coming back online
 * - Retry logic with exponential backoff
 * - Conflict detection and resolution
 * - Sync progress tracking
 */

import {
  getSyncQueue,
  markSyncComplete,
  markSyncError,
  getFromIndexedDB,
  saveToIndexedDB,
  type EntityType,
} from './offlineStorage'
import type { SyncQueueItem } from '@/lib/db'
import * as growsApi from '@/services/growsApi'
import * as plantsApi from '@/services/plantsApi'
import * as cultivarsApi from '@/services/cultivarsApi'
import * as observationsApi from '@/services/observationsApi'
import * as feedingEventsApi from '@/services/feedingEventsApi'
import * as activityLogsApi from '@/services/activityLogsApi'
import * as harvestsApi from '@/services/harvestsApi'
import { uploadAllPendingPhotos } from './photoUploadService'
import { db } from '@/lib/db'

/**
 * Result of syncing a single item
 */
export interface SyncItemResult {
  success: boolean
  error?: string
  shouldRetry?: boolean
  conflict?: boolean
  localData?: any
  serverData?: any
}

/**
 * Result of syncing all items
 */
export interface SyncAllResult {
  synced: number
  failed: number
  conflicts: number
  errors: Array<{ entityType: string; entityId: string; error: string }>
  photosUploaded?: number
  photosFailed?: number
  photoErrors?: Array<{ photoId: string; error: string }>
}

/**
 * Sync progress callback
 */
export type SyncProgressCallback = (progress: { current: number; total: number }) => void

/**
 * Sync status
 */
interface SyncStatus {
  state: 'idle' | 'syncing' | 'error'
  progress: { current: number; total: number }
  lastSyncTime?: number
  autoSyncEnabled: boolean
}

// Global sync status
let syncStatus: SyncStatus = {
  state: 'idle',
  progress: { current: 0, total: 0 },
  autoSyncEnabled: false,
}

// Auto-sync listener
let onlineListener: (() => void) | null = null

// Maximum retry attempts
const MAX_RETRIES = 3

// Exponential backoff delays (ms)
const RETRY_DELAYS = [1000, 2000, 4000, 8000]

/**
 * Entity sync order (respects dependencies)
 * Grows must be created before plants, plants before observations, etc.
 * Note: photos are handled separately by uploadAllPendingPhotos
 */
const ENTITY_SYNC_ORDER: EntityType[] = [
  'grows',
  'cultivars',
  'plants',
  'observations',
  'feedingEvents',
  'activities',
  'environmentSnapshots',
  'harvests',
  'photos', // Handled separately, but included for type safety
]

/**
 * Sync a single queue item
 */
export async function syncItem(queueItem: SyncQueueItem): Promise<SyncItemResult> {
  try {
    const { entityType, entityId, action, data } = queueItem

    // Photos and upload-photo actions are handled separately by uploadAllPendingPhotos
    if (action === 'upload-photo' || entityType === 'photos') {
      console.warn('Photo sync attempted through regular sync flow - photos should use uploadAllPendingPhotos')
      return { success: true }
    }

    // Check for conflicts before syncing updates
    if (action === 'update') {
      const conflict = await detectConflict(entityType, entityId, data)
      if (conflict) {
        return {
          success: false,
          conflict: true,
          localData: data,
          serverData: conflict.serverData,
        }
      }
    }

    // Perform the sync operation based on entity type and action
    // At this point, action is narrowed to 'create' | 'update' | 'delete'
    let result: any

    switch (entityType) {
      case 'grows':
        result = await syncGrow(action, entityId, data)
        break
      case 'cultivars':
        result = await syncCultivar(action, entityId, data)
        break
      case 'plants':
        result = await syncPlant(action, entityId, data)
        break
      case 'observations':
        result = await syncObservation(action, entityId, data)
        break
      case 'feedingEvents':
        result = await syncFeedingEvent(action, entityId, data)
        break
      case 'activities':
        result = await syncActivityLog(action, entityId, data)
        break
      case 'harvests':
        result = await syncHarvest(action, entityId, data)
        break
      default:
        throw new Error(`Unsupported entity type: ${entityType}`)
    }

    // Update IndexedDB with server response
    if (action !== 'delete' && result) {
      await saveToIndexedDB(entityType, result)
    }

    return { success: true }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`Sync failed for ${queueItem.entityType}:${queueItem.entityId}:`, error)

    return {
      success: false,
      error: errorMessage,
      shouldRetry: true,
    }
  }
}

/**
 * Sync all pending items in the queue
 */
export async function syncAll(
  onProgress?: SyncProgressCallback
): Promise<SyncAllResult> {
  if (syncStatus.state === 'syncing') {
    console.log('Sync already in progress')
    return { synced: 0, failed: 0, conflicts: 0, errors: [] }
  }

  syncStatus.state = 'syncing'

  try {
    const queueItems = await getSyncQueue()
    const total = queueItems.length

    if (total === 0) {
      console.log('No items to sync')
      syncStatus.state = 'idle'
      syncStatus.lastSyncTime = Date.now()
      return { synced: 0, failed: 0, conflicts: 0, errors: [] }
    }

    console.log(`Starting sync of ${total} items`)

    // Sort queue items by entity sync order
    const sortedItems = sortByEntityOrder(queueItems)

    const results: SyncAllResult = {
      synced: 0,
      failed: 0,
      conflicts: 0,
      errors: [],
    }

    for (let i = 0; i < sortedItems.length; i++) {
      const item = sortedItems[i]

      // Skip if item is somehow undefined (shouldn't happen, but TypeScript safety)
      if (!item) {
        console.error('Encountered undefined item in sync queue')
        continue
      }

      syncStatus.progress = { current: i + 1, total }

      if (onProgress) {
        onProgress(syncStatus.progress)
      }

      // Attempt sync with retries
      const result = await syncItemWithRetry(item)

      if (result.success) {
        results.synced++
        if (item.id) {
          await markSyncComplete(item.id)
        }
      } else if (result.conflict) {
        results.conflicts++
        // Don't mark as complete - user needs to resolve
      } else {
        results.failed++
        results.errors.push({
          entityType: item.entityType,
          entityId: item.entityId,
          error: result.error || 'Unknown error',
        })
        if (item.id) {
          await markSyncError(item.id, result.error || 'Unknown error')
        }
      }
    }

    console.log(`Entity sync complete: ${results.synced} synced, ${results.failed} failed, ${results.conflicts} conflicts`)

    // Upload pending photos after entities are synced
    try {
      console.log('Starting photo uploads...')
      const photoResults = await uploadAllPendingPhotos()
      results.photosUploaded = photoResults.uploaded
      results.photosFailed = photoResults.failed
      results.photoErrors = photoResults.errors
      console.log(`Photo upload complete: ${photoResults.uploaded} uploaded, ${photoResults.failed} failed`)
    } catch (error) {
      console.error('Photo upload failed:', error)
      results.photosFailed = 0
      results.photosUploaded = 0
    }

    syncStatus.state = results.failed > 0 ? 'error' : 'idle'
    syncStatus.lastSyncTime = Date.now()

    return results
  } catch (error) {
    console.error('Sync failed:', error)
    syncStatus.state = 'error'
    return { synced: 0, failed: 0, conflicts: 0, errors: [] }
  }
}

/**
 * Sync item with retry logic
 */
async function syncItemWithRetry(item: SyncQueueItem): Promise<SyncItemResult> {
  let lastResult: SyncItemResult = { success: false }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) {
      // Wait before retrying
      const delay = RETRY_DELAYS[Math.min(attempt - 1, RETRY_DELAYS.length - 1)]
      console.log(`Retrying sync of ${item.entityType}:${item.entityId} in ${delay}ms (attempt ${attempt + 1}/${MAX_RETRIES + 1})`)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }

    lastResult = await syncItem(item)

    if (lastResult.success || lastResult.conflict) {
      return lastResult
    }

    if (!lastResult.shouldRetry) {
      break
    }
  }

  return lastResult
}

/**
 * Sort queue items by entity dependency order
 */
function sortByEntityOrder(items: SyncQueueItem[]): SyncQueueItem[] {
  return items.sort((a, b) => {
    const orderA = ENTITY_SYNC_ORDER.indexOf(a.entityType)
    const orderB = ENTITY_SYNC_ORDER.indexOf(b.entityType)
    return orderA - orderB
  })
}

/**
 * Detect conflicts between local and server data
 */
async function detectConflict(
  entityType: EntityType,
  entityId: string,
  localData: any
): Promise<{ serverData: any } | null> {
  try {
    // Get current data from IndexedDB (which should have latest server data)
    const serverData = await getFromIndexedDB(entityType, entityId)

    if (!serverData) {
      return null // No conflict if item doesn't exist on server
    }

    // Compare updatedAt timestamps (if they exist)
    const localUpdatedAt = new Date((localData as any).updatedAt || 0).getTime()
    const serverUpdatedAt = new Date((serverData as any).updatedAt || 0).getTime()

    if (serverUpdatedAt > localUpdatedAt) {
      console.warn(`Conflict detected for ${entityType}:${entityId}`)
      return { serverData }
    }

    return null
  } catch (error) {
    console.error('Error detecting conflict:', error)
    return null
  }
}

/**
 * Sync grow entity
 */
async function syncGrow(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create':
      return await growsApi.createGrow(data)
    case 'update':
      return await growsApi.updateGrow(id, data)
    case 'delete':
      await growsApi.deleteGrow(id)
      return null
  }
}

/**
 * Sync cultivar entity
 */
async function syncCultivar(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create':
      return await cultivarsApi.createCultivar(data)
    case 'update':
      return await cultivarsApi.updateCultivar(id, data)
    case 'delete':
      await cultivarsApi.deleteCultivar(id)
      return null
  }
}

/**
 * Sync plant entity
 */
async function syncPlant(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create':
      return await plantsApi.createPlant(data)
    case 'update':
      return await plantsApi.updatePlant(id, data)
    case 'delete':
      await plantsApi.deletePlant(id)
      return null
  }
}

/**
 * Sync observation entity
 * Handles photo attachments from offline queue
 */
async function syncObservation(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create': {
      // Extract plantId from data for create
      const plantId = data.plantId

      // Check if observation has photos in the queue
      let files: File[] | undefined
      if (data.photoIds && data.photoIds.length > 0) {
        files = []
        // Get photos from photo queue
        const photoPromises = data.photoIds.map(async (photoId: string) => {
          const photo = await db.photoQueue.where('photoId').equals(photoId).first()
          if (photo) {
            // Convert blob to File
            const file = new File([photo.blob], photo.fileName, { type: photo.mimeType })
            return file
          }
          return null
        })

        const photoFiles = await Promise.all(photoPromises)
        files = photoFiles.filter((f): f is File => f !== null)
        console.log(`Found ${files.length} photos for observation ${id} in queue`)
      }

      // Create observation data without photoIds
      const { photoIds, ...observationData } = data

      return await observationsApi.createObservation(plantId, observationData, files)
    }
    case 'update':
      return await observationsApi.updateObservation(id, data)
    case 'delete':
      await observationsApi.deleteObservation(id)
      return null
  }
}

/**
 * Sync feeding event entity
 */
async function syncFeedingEvent(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create':
      return await feedingEventsApi.createFeedingEvent(data)
    case 'update':
      return await feedingEventsApi.updateFeedingEvent(id, data)
    case 'delete':
      await feedingEventsApi.deleteFeedingEvent(id)
      return null
  }
}

/**
 * Sync activity log entity
 */
async function syncActivityLog(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create':
      return await activityLogsApi.createActivityLog(data)
    case 'update':
      return await activityLogsApi.updateActivityLog(id, data)
    case 'delete':
      await activityLogsApi.deleteActivityLog(id)
      return null
  }
}

/**
 * Sync harvest entity
 */
async function syncHarvest(
  action: 'create' | 'update' | 'delete',
  id: string,
  data: any
) {
  switch (action) {
    case 'create':
      // Extract plantId from data for create
      const plantId = data.plantId
      return await harvestsApi.createHarvest(plantId, data)
    case 'update':
      return await harvestsApi.updateHarvest(id, data)
    case 'delete':
      await harvestsApi.deleteHarvest(id)
      return null
  }
}

/**
 * Start automatic sync on online events
 */
export function startAutoSync(): void {
  if (syncStatus.autoSyncEnabled) {
    console.log('Auto-sync already enabled')
    return
  }

  console.log('Starting auto-sync')
  syncStatus.autoSyncEnabled = true

  onlineListener = () => {
    console.log('Device came online, triggering sync')
    syncAll().catch((error) => {
      console.error('Auto-sync failed:', error)
    })
  }

  window.addEventListener('online', onlineListener)

  // Trigger immediate sync if online
  if (navigator.onLine) {
    syncAll().catch((error) => {
      console.error('Initial sync failed:', error)
    })
  }
}

/**
 * Stop automatic sync
 */
export function stopAutoSync(): void {
  console.log('Stopping auto-sync')
  syncStatus.autoSyncEnabled = false

  if (onlineListener) {
    window.removeEventListener('online', onlineListener)
    onlineListener = null
  }
}

/**
 * Get current sync status
 */
export function getSyncStatus(): SyncStatus {
  return { ...syncStatus }
}

/**
 * Manually trigger sync
 */
export async function syncNow(): Promise<SyncAllResult> {
  console.log('Manual sync triggered')
  return await syncAll()
}