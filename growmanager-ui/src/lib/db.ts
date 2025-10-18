/**
 * IndexedDB Database Configuration
 *
 * Uses Dexie.js to manage offline storage for GrowManager data.
 * Stores entities locally and tracks sync queue for offline operations.
 */

import Dexie, { Table } from 'dexie'
import type { Grow } from '@/services/growsApi'
import type { Cultivar } from '@/services/cultivarsApi'
import type { Plant } from '@/types/plant'
import type { Observation } from '@/types/observation'
import type { FeedingEvent } from '@/types/feedingEvent'
import type { ActivityLog } from '@/types/activityLog'
import type { Harvest } from '@/types/harvest'

/**
 * Sync queue item for tracking offline changes
 */
export interface SyncQueueItem {
  id?: number // Auto-incremented primary key
  entityType:
    | 'grows'
    | 'cultivars'
    | 'plants'
    | 'observations'
    | 'feedingEvents'
    | 'activities'
    | 'environmentSnapshots'
    | 'harvests'
    | 'photos' // For photo uploads
  entityId: string // UUID of the entity (or photo ID)
  action: 'create' | 'update' | 'delete' | 'upload-photo'
  data: any // The entity data to sync
  timestamp: number // Unix timestamp when queued
  status: 'pending' | 'syncing' | 'synced' | 'error'
  error?: string // Error message if sync failed
  retryCount: number // Number of retry attempts
  lastRetryAt?: number // Unix timestamp of last retry
}

/**
 * Photo queue item for offline photo storage
 */
export interface PhotoQueueItem {
  id?: number // Auto-incremented primary key
  photoId: string // Unique ID for this photo
  entityType: 'observations' | 'activities' // Type of entity this photo belongs to
  entityId: string // ID of the parent entity
  blob: Blob // Compressed photo data
  fileName: string // Original file name
  mimeType: string // Image MIME type (e.g., image/jpeg)
  localUrl: string // Blob URL for displaying in UI
  timestamp: number // Unix timestamp when added
  status: 'pending' | 'uploading' | 'uploaded' | 'error'
  s3Url?: string // S3 URL after successful upload
  error?: string // Error message if upload failed
  retryCount: number // Number of retry attempts
}

/**
 * Environmental snapshot data
 */
export interface EnvironmentSnapshot {
  id: string
  growId: string
  timestamp: string
  temperature?: number
  humidity?: number
  co2?: number
  lightIntensity?: number
  vpd?: number
  source: 'manual' | 'sensor'
  createdAt: string
}

/**
 * GrowManager IndexedDB Database
 */
export class GrowManagerDB extends Dexie {
  // Entity tables
  grows!: Table<Grow, string>
  cultivars!: Table<Cultivar, string>
  plants!: Table<Plant, string>
  observations!: Table<Observation, string>
  feedingEvents!: Table<FeedingEvent, string>
  activities!: Table<ActivityLog, string>
  environmentSnapshots!: Table<EnvironmentSnapshot, string>
  harvests!: Table<Harvest, string>

  // Sync queue
  syncQueue!: Table<SyncQueueItem, number>

  // Photo queue
  photoQueue!: Table<PhotoQueueItem, number>

  constructor() {
    super('GrowManagerDB')

    this.version(1).stores({
      // Entity tables - indexed by id and relevant foreign keys
      grows: 'id, userId, status, isArchived, updatedAt',
      cultivars: 'id, userId, name, type',
      plants: 'id, growId, cultivarId, stage, healthStatus, updatedAt',
      observations: 'id, plantId, timestamp, observationType',
      feedingEvents: 'id, plantId, timestamp, feedingType',
      activities: 'id, plantId, timestamp, activityType',
      environmentSnapshots: 'id, growId, timestamp',
      harvests: 'id, plantId, growId, harvestDate',

      // Sync queue - indexed by status and timestamp for efficient querying
      syncQueue: '++id, entityType, entityId, status, timestamp',

      // Photo queue - indexed by photoId, entityId, and status for efficient querying
      photoQueue: '++id, photoId, entityType, entityId, status, timestamp',
    })
  }
}

// Export singleton instance
export const db = new GrowManagerDB()

/**
 * Clear all data from the database (useful for logout or testing)
 */
export async function clearDatabase(): Promise<void> {
  await db.grows.clear()
  await db.cultivars.clear()
  await db.plants.clear()
  await db.observations.clear()
  await db.feedingEvents.clear()
  await db.activities.clear()
  await db.environmentSnapshots.clear()
  await db.harvests.clear()
  await db.syncQueue.clear()
  await db.photoQueue.clear()
}

/**
 * Get database statistics
 */
export async function getDatabaseStats() {
  return {
    grows: await db.grows.count(),
    cultivars: await db.cultivars.count(),
    plants: await db.plants.count(),
    observations: await db.observations.count(),
    feedingEvents: await db.feedingEvents.count(),
    activities: await db.activities.count(),
    environmentSnapshots: await db.environmentSnapshots.count(),
    harvests: await db.harvests.count(),
    pendingSyncItems: await db.syncQueue.where('status').equals('pending').count(),
    pendingPhotoUploads: await db.photoQueue.where('status').equals('pending').count(),
  }
}