/**
 * IndexedDB Database Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { db, clearDatabase, getDatabaseStats } from './db'
import type { Grow } from '@/services/growsApi'
import type { Plant } from '@/types/plant'

describe('IndexedDB Database', () => {
  beforeEach(async () => {
    await clearDatabase()
  })

  afterEach(async () => {
    await clearDatabase()
  })

  it('should create database with correct tables', () => {
    expect(db.grows).toBeDefined()
    expect(db.cultivars).toBeDefined()
    expect(db.plants).toBeDefined()
    expect(db.observations).toBeDefined()
    expect(db.feedingEvents).toBeDefined()
    expect(db.activities).toBeDefined()
    expect(db.environmentSnapshots).toBeDefined()
    expect(db.harvests).toBeDefined()
    expect(db.syncQueue).toBeDefined()
  })

  it('should add and retrieve a grow', async () => {
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

    await db.grows.add(grow)

    const retrieved = await db.grows.get('grow-1')
    expect(retrieved).toEqual(grow)
  })

  it('should clear all data', async () => {
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

    await db.grows.add(grow)
    await db.plants.add(plant)

    await clearDatabase()

    const growCount = await db.grows.count()
    const plantCount = await db.plants.count()

    expect(growCount).toBe(0)
    expect(plantCount).toBe(0)
  })

  it('should get database statistics', async () => {
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

    await db.grows.add(grow)

    await db.syncQueue.add({
      entityType: 'grows',
      entityId: 'grow-1',
      action: 'create',
      data: grow,
      timestamp: Date.now(),
      status: 'pending',
      retryCount: 0,
    })

    const stats = await getDatabaseStats()

    expect(stats.grows).toBe(1)
    expect(stats.pendingSyncItems).toBe(1)
  })

  it('should query grows by status', async () => {
    const grows: Grow[] = [
      {
        id: 'grow-1',
        userId: 'user-1',
        name: 'Active Grow',
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
        name: 'Planning Grow',
        startDate: '2025-02-01',
        status: 'planning',
        environmentType: 'outdoor',
        isArchived: false,
        sortOrder: 0,
        createdAt: '2025-02-01T00:00:00Z',
        updatedAt: '2025-02-01T00:00:00Z',
      },
    ]

    await db.grows.bulkAdd(grows)

    const activeGrows = await db.grows.where('status').equals('active').toArray()

    expect(activeGrows).toHaveLength(1)
    expect(activeGrows[0]?.id).toBe('grow-1')
  })

  it('should query plants by growId', async () => {
    const plants: Plant[] = [
      {
        id: 'plant-1',
        growId: 'grow-1',
        plantTag: 'Plant 1',
        plantedDate: '2025-01-01',
        stage: 'seedling',
        healthStatus: 'active',
        sortOrder: 0,
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
        sortOrder: 0,
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
        sortOrder: 0,
        createdAt: '2025-02-01T00:00:00Z',
        updatedAt: '2025-02-01T00:00:00Z',
      },
    ]

    await db.plants.bulkAdd(plants)

    const grow1Plants = await db.plants.where('growId').equals('grow-1').toArray()

    expect(grow1Plants).toHaveLength(2)
    expect(grow1Plants.map((p) => p.id).sort()).toEqual(['plant-1', 'plant-2'])
  })
})