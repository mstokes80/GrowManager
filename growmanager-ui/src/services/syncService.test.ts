/**
 * Background Sync Service Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { db, clearDatabase } from '@/lib/db'
import {
  syncAll,
  syncItem,
  startAutoSync,
  stopAutoSync,
  getSyncStatus,
} from './syncService'
import { addToSyncQueue } from './offlineStorage'
import type { Grow } from '@/services/growsApi'
import type { Plant } from '@/types/plant'
import * as growsApi from '@/services/growsApi'
import * as plantsApi from '@/services/plantsApi'

// Mock API modules
vi.mock('@/services/growsApi')
vi.mock('@/services/plantsApi')

describe('Background Sync Service', () => {
  beforeEach(async () => {
    await clearDatabase()
    vi.clearAllMocks()
  })

  afterEach(async () => {
    await clearDatabase()
    stopAutoSync()
  })

  describe('syncItem', () => {
    it('should sync create action for grows', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const queueId = await addToSyncQueue('create', 'grows', grow)
      const queueItem = await db.syncQueue.get(queueId)

      // Mock API response
      vi.mocked(growsApi.createGrow).mockResolvedValue(grow)

      const result = await syncItem(queueItem!)

      expect(result.success).toBe(true)
      expect(growsApi.createGrow).toHaveBeenCalledWith(grow)
    })

    it('should sync update action for grows', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Updated Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-02T00:00:00Z',
      }

      const queueId = await addToSyncQueue('update', 'grows', grow)
      const queueItem = await db.syncQueue.get(queueId)

      vi.mocked(growsApi.updateGrow).mockResolvedValue(grow)

      const result = await syncItem(queueItem!)

      expect(result.success).toBe(true)
      expect(growsApi.updateGrow).toHaveBeenCalledWith('grow-1', grow)
    })

    it('should sync delete action for grows', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const queueId = await addToSyncQueue('delete', 'grows', grow)
      const queueItem = await db.syncQueue.get(queueId)

      vi.mocked(growsApi.deleteGrow).mockResolvedValue(undefined)

      const result = await syncItem(queueItem!)

      expect(result.success).toBe(true)
      expect(growsApi.deleteGrow).toHaveBeenCalledWith('grow-1')
    })

    it('should handle sync failure with retry', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const queueId = await addToSyncQueue('create', 'grows', grow)
      const queueItem = await db.syncQueue.get(queueId)

      vi.mocked(growsApi.createGrow).mockRejectedValue(new Error('Network error'))

      const result = await syncItem(queueItem!)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
      expect(result.shouldRetry).toBe(true)
    })

    it('should detect conflict when server data is newer', async () => {
      const localGrow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Local Changes',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T10:00:00Z',
      }

      const serverGrow: Grow = {
        ...localGrow,
        name: 'Server Changes',
        updatedAt: '2025-01-01T12:00:00Z', // Newer than local
      }

      await db.grows.add(serverGrow) // Simulate server data already in DB

      const queueId = await addToSyncQueue('update', 'grows', localGrow)
      const queueItem = await db.syncQueue.get(queueId)

      const result = await syncItem(queueItem!)

      expect(result.success).toBe(false)
      expect(result.conflict).toBe(true)
      expect(result.localData).toEqual(localGrow)
      expect(result.serverData).toEqual(serverGrow)
    })
  })

  describe('syncAll', () => {
    it('should sync items in correct order', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      const plant: Plant = {
        id: 'plant-1',
        growId: 'grow-1',
        plantTag: 'Plant 1',
        plantedDate: '2025-01-01',
        stage: 'seedling',
        healthStatus: 'active',
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      // Add in reverse order (plant first, then grow)
      // Sync should still process grow first due to dependency order
      await addToSyncQueue('create', 'plants', plant)
      await addToSyncQueue('create', 'grows', grow)

      vi.mocked(growsApi.createGrow).mockResolvedValue(grow)
      vi.mocked(plantsApi.createPlant).mockResolvedValue(plant)

      const results = await syncAll()

      expect(results.synced).toBe(2)
      expect(results.failed).toBe(0)

      // Verify grows was called before plants
      const growsCallOrder = vi.mocked(growsApi.createGrow).mock.invocationCallOrder[0]
      const plantsCallOrder = vi.mocked(plantsApi.createPlant).mock.invocationCallOrder[0]
      expect(growsCallOrder).toBeDefined()
      expect(plantsCallOrder).toBeDefined()
      expect(growsCallOrder!).toBeLessThan(plantsCallOrder!)
    })

    it('should track sync progress', async () => {
      const grows: Grow[] = [
        {
          id: 'grow-1',
          userId: 'user-1',
          name: 'Grow 1',
          startDate: '2025-01-01',
          status: 'active',
          environmentType: 'indoor',
          isArchived: false,
          sortOrder: 0,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        },
        {
          id: 'grow-2',
          userId: 'user-1',
          name: 'Grow 2',
          startDate: '2025-01-02',
          status: 'active',
          environmentType: 'outdoor',
          isArchived: false,
          sortOrder: 0,
          createdAt: '2025-01-02T00:00:00Z',
          updatedAt: '2025-01-02T00:00:00Z',
        },
      ]

      await addToSyncQueue('create', 'grows', grows[0]!)
      await addToSyncQueue('create', 'grows', grows[1]!)

      vi.mocked(growsApi.createGrow).mockResolvedValue(grows[0]!)
      vi.mocked(growsApi.createGrow).mockResolvedValue(grows[1]!)

      const progressUpdates: Array<{ current: number; total: number }> = []

      await syncAll((progress) => {
        progressUpdates.push(progress)
      })

      expect(progressUpdates.length).toBeGreaterThan(0)
      expect(progressUpdates[progressUpdates.length - 1]).toEqual({
        current: 2,
        total: 2,
      })
    })

    it('should retry failed syncs with exponential backoff', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      await addToSyncQueue('create', 'grows', grow)

      // Fail first 2 attempts, succeed on 3rd
      vi.mocked(growsApi.createGrow)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(grow)

      const results = await syncAll()

      expect(results.synced).toBe(1)
      expect(results.failed).toBe(0)
      expect(growsApi.createGrow).toHaveBeenCalledTimes(3)
    })

    it(
      'should stop retrying after max attempts',
      async () => {
        const grow: Grow = {
          id: 'grow-1',
          userId: 'user-1',
          name: 'Test Grow',
          startDate: '2025-01-01',
          status: 'active',
          environmentType: 'indoor',
          isArchived: false,
          sortOrder: 0,
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-01-01T00:00:00Z',
        }

        await addToSyncQueue('create', 'grows', grow)

        // Always fail
        vi.mocked(growsApi.createGrow).mockRejectedValue(new Error('Network error'))

        const results = await syncAll()

        expect(results.synced).toBe(0)
        expect(results.failed).toBe(1)
        // Should retry max 4 times (initial + 3 retries)
        expect(growsApi.createGrow).toHaveBeenCalledTimes(4)
      },
      10000
    ) // 10s timeout for retry delays
  })

  describe('Auto Sync', () => {
    it('should start auto sync on online event', async () => {
      const grow: Grow = {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Test Grow',
        startDate: '2025-01-01',
        status: 'active',
        environmentType: 'indoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      }

      // Set navigator.onLine to false initially to prevent immediate sync
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: false,
      })

      await addToSyncQueue('create', 'grows', grow)
      vi.mocked(growsApi.createGrow).mockResolvedValue(grow)

      startAutoSync()

      // Now simulate coming online
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        configurable: true,
        value: true,
      })
      window.dispatchEvent(new Event('online'))

      // Wait for sync to complete
      await new Promise((resolve) => setTimeout(resolve, 200))

      expect(growsApi.createGrow).toHaveBeenCalled()
    })

    it('should stop auto sync when requested', () => {
      startAutoSync()
      const status1 = getSyncStatus()
      expect(status1.autoSyncEnabled).toBe(true)

      stopAutoSync()
      const status2 = getSyncStatus()
      expect(status2.autoSyncEnabled).toBe(false)
    })
  })
})