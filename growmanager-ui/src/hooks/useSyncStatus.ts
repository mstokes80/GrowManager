/**
 * Sync Status Hook
 *
 * Provides real-time sync status, progress tracking, and manual sync trigger.
 */

import { useState, useEffect, useCallback } from 'react'
import { getSyncStatus, syncNow, startAutoSync, stopAutoSync } from '@/services/syncService'
import { getSyncQueueCount } from '@/services/offlineStorage'
import { useOnlineStatus } from './useOnlineStatus'

export interface SyncStatusData {
  state: 'idle' | 'syncing' | 'error'
  progress: { current: number; total: number }
  pendingCount: number
  lastSyncTime?: number
  autoSyncEnabled: boolean
  isOnline: boolean
}

/**
 * Hook to track and control background sync status
 *
 * @returns sync status data and control functions
 */
export function useSyncStatus() {
  const isOnline = useOnlineStatus()
  const [syncStatus, setSyncStatus] = useState<SyncStatusData>({
    state: 'idle',
    progress: { current: 0, total: 0 },
    pendingCount: 0,
    autoSyncEnabled: false,
    isOnline,
  })

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const count = await getSyncQueueCount('pending')
      setSyncStatus((prev) => ({ ...prev, pendingCount: count }))
    } catch (error) {
      console.error('Failed to get pending count:', error)
    }
  }, [])

  // Update sync status from service
  const updateSyncStatus = useCallback(() => {
    const status = getSyncStatus()
    setSyncStatus((prev) => ({
      ...prev,
      state: status.state,
      progress: status.progress,
      lastSyncTime: status.lastSyncTime,
      autoSyncEnabled: status.autoSyncEnabled,
      isOnline,
    }))
  }, [isOnline])

  // Manual sync trigger
  const triggerSync = useCallback(async () => {
    try {
      await syncNow()
      await updatePendingCount()
      updateSyncStatus()
    } catch (error) {
      console.error('Manual sync failed:', error)
      setSyncStatus((prev) => ({ ...prev, state: 'error' }))
    }
  }, [updatePendingCount, updateSyncStatus])

  // Enable auto-sync
  const enableAutoSync = useCallback(() => {
    startAutoSync()
    updateSyncStatus()
  }, [updateSyncStatus])

  // Disable auto-sync
  const disableAutoSync = useCallback(() => {
    stopAutoSync()
    updateSyncStatus()
  }, [updateSyncStatus])

  // Poll for status updates
  useEffect(() => {
    // Initial load
    updatePendingCount()
    updateSyncStatus()

    // Poll every 2 seconds while syncing, every 5 seconds otherwise
    const interval = setInterval(
      () => {
        updatePendingCount()
        updateSyncStatus()
      },
      syncStatus.state === 'syncing' ? 2000 : 5000
    )

    return () => clearInterval(interval)
  }, [updatePendingCount, updateSyncStatus, syncStatus.state])

  // Update online status
  useEffect(() => {
    setSyncStatus((prev) => ({ ...prev, isOnline }))
  }, [isOnline])

  return {
    ...syncStatus,
    triggerSync,
    enableAutoSync,
    disableAutoSync,
  }
}