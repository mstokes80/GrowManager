/**
 * Offline Storage Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, clearDatabase } from '@/lib/db'
import {
  saveToIndexedDB,
  getFromIndexedDB,
  updateInIndexedDB,
  deleteFromIndexedDB,
  getAllFromIndexedDB,
  queryIndexedDB,
  addToSyncQueue,
  getSyncQueue,
  markSyncComplete,
  markSyncError,
  getSyncQueueCount,
} from './offlineStorage'
import type { Grow } from '@/services/growsApi'
import type { Plant } from '@/types/plant'

describe('Offline Storage Service', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await clearDatabase()
  })

  afterEach(async () => {
    // Clean up after each test
    await clearDatabase()
  })

  describe('Entity CRUD Operations', () => {
    it('should save an entity to IndexedDB', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await saveToIndexedDB('grows', grow)

      const saved = await db.grows.get('grow-1')
      expect(saved).toEqual(grow)
    })

    it('should get an entity from IndexedDB', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await db.grows.add(grow)

      const fetched = await getFromIndexedDB<Grow>('grows', 'grow-1')
      expect(fetched).toEqual(grow)
    })

    it('should return undefined for non-existent entity', async () => {
      const fetched = await getFromIndexedDB<Grow>('grows', 'non-existent')
      expect(fetched).toBeUndefined()
    })

    it('should update an entity in IndexedDB', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await db.grows.add(grow)

      await updateInIndexedDB('grows', 'grow-1', { name: 'Updated Grow' })

      const updated = await db.grows.get('grow-1')
      expect(updated?.name).toBe('Updated Grow')
    })

    it('should delete an entity from IndexedDB', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await db.grows.add(grow)

      await deleteFromIndexedDB('grows', 'grow-1')

      const deleted = await db.grows.get('grow-1')
      expect(deleted).toBeUndefined()
    })

    it('should get all entities of a type', async () => {
      const grows: Grow[] = [
        {
          id: 'grow-1',
          userId: 'user-1',
          name: 'Grow 1',
          startDate: '2025-01-01',
          status: 'active',
          environmentType: 'indoor',
          isArchived: false,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'grow-2',
          userId: 'user-1',
          name: 'Grow 2',
          startDate: '2025-02-01',
          status: 'planning',
          environmentType: 'outdoor',
          isArchived: false,
          createdAt: '2025-02-01T00:00:00Z',
          updatedAt: '2025-02-01T00:00:00Z',
        },
      ]

      await db.grows.bulkAdd(grows)

      const allGrows = await getAllFromIndexedDB<Grow>('grows')
      expect(allGrows).toHaveLength(2)
      expect(allGrows.map((g) => g.id)).toEqual(['grow-1', 'grow-2'])
    })

    it('should query entities by field', async () => {
      const plants: Plant[] = [
        {
          id: 'plant-1',
          growId: 'grow-1',
          plantTag: 'Plant 1',
          plantedDate: '2025-01-01',
          stage: 'seedling',
          healthStatus: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'plant-2',
          growId: 'grow-1',
          plantTag: 'Plant 2',
          plantedDate: '2025-01-01',
          stage: 'vegetative',
          healthStatus: 'active',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'plant-3',
          growId: 'grow-2',
          plantTag: 'Plant 3',
          plantedDate: '2025-02-01',
          stage: 'seedling',
          healthStatus: 'active',
          createdAt: '2025-02-01T00:00:00Z',
          updatedAt: '2025-02-01T00:00:00Z',
        },
      ]

      await db.plants.bulkAdd(plants)

      const grow1Plants = await queryIndexedDB<Plant>('plants', 'growId', 'grow-1')
      expect(grow1Plants).toHaveLength(2)
      expect(grow1Plants.map((p) => p.id)).toEqual(['plant-1', 'plant-2'])
    })
  })

  describe('Sync Queue Operations', () => {
    it('should add item to sync queue', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const queueId = await addToSyncQueue('create', 'grows', grow)

      expect(queueId).toBeGreaterThan(0)

      const queueItem = await db.syncQueue.get(queueId)
      expect(queueItem).toBeDefined()
      expect(queueItem?.entityType).toBe('grows')
      expect(queueItem?.action).toBe('create')
      expect(queueItem?.status).toBe('pending')
    })

    it('should get pending sync queue items', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await addToSyncQueue('create', 'grows', grow)
      await addToSyncQueue('update', 'grows', { ...grow, name: 'Updated' })

      const queue = await getSyncQueue()
      expect(queue).toHaveLength(2)
    })

    it('should mark sync item as complete', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const queueId = await addToSyncQueue('create', 'grows', grow)

      await markSyncComplete(queueId)

      const queueItem = await db.syncQueue.get(queueId)
      expect(queueItem?.status).toBe('synced')
    })

    it('should mark sync item as error', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const queueId = await addToSyncQueue('create', 'grows', grow)

      await markSyncError(queueId, 'Network error')

      const queueItem = await db.syncQueue.get(queueId)
      expect(queueItem?.status).toBe('error')
      expect(queueItem?.error).toBe('Network error')
      expect(queueItem?.retryCount).toBe(1)
    })

    it('should get sync queue count', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await addToSyncQueue('create', 'grows', grow)
      await addToSyncQueue('update', 'grows', { ...grow, name: 'Updated' })

      const count = await getSyncQueueCount('pending')
      expect(count).toBe(2)
    })
  })
})