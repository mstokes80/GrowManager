/**
 * Sync Indicator Component
 *
 * Displays current sync status in the app header with icons and details.
 */

import { useState } from 'react'
import {
  CloudOff,
  CloudUpload,
  Check,
  AlertCircle,
  RefreshCw,
  X,
} from 'lucide-react'
import { useSyncStatus } from '@/hooks/useSyncStatus'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

/**
 * Sync Indicator Component
 *
 * Shows:
 * - Sync status icon (synced, pending, syncing, error, offline)
 * - On click: popup with details (pending items, last sync time, retry button)
 */
export function SyncIndicator() {
  const {
    state,
    progress,
    pendingCount,
    lastSyncTime,
    isOnline,
    triggerSync,
  } = useSyncStatus()
  const [isOpen, setIsOpen] = useState(false)

  // Determine icon and color based on status
  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-5 w-5 text-gray-400" />
    }

    if (state === 'syncing') {
      return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
    }

    if (state === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }

    if (pendingCount > 0) {
      return <CloudUpload className="h-5 w-5 text-orange-500" />
    }

    return <Check className="h-5 w-5 text-green-500" />
  }

  const getStatusText = () => {
    if (!isOnline) {
      return 'Offline'
    }

    if (state === 'syncing') {
      return `Syncing ${progress.current} of ${progress.total}...`
    }

    if (state === 'error') {
      return 'Sync error'
    }

    if (pendingCount > 0) {
      return `${pendingCount} pending`
    }

    return 'All synced'
  }

  const formatLastSyncTime = (timestamp?: number) => {
    if (!timestamp) {
      return 'Never'
    }

    const now = Date.now()
    const diff = now - timestamp
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
      return 'Just now'
    } else if (minutes < 60) {
      return `${minutes}m ago`
    } else {
      const hours = Math.floor(minutes / 60)
      return `${hours}h ago`
    }
  }

  const handleRetrySync = async () => {
    await triggerSync()
    setIsOpen(false)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-2"
          title={getStatusText()}
        >
          {getStatusIcon()}
          <span className="hidden md:inline text-sm">{getStatusText()}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Sync Status</h3>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Connection</span>
              <span className="font-medium">
                {isOnline ? (
                  <span className="text-green-600">Online</span>
                ) : (
                  <span className="text-gray-600">Offline</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status</span>
              <span className="font-medium">{getStatusText()}</span>
            </div>

            {state === 'syncing' && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium">
                  {progress.current} / {progress.total}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Pending Items</span>
              <span className="font-medium">{pendingCount}</span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Last Sync</span>
              <span className="font-medium">{formatLastSyncTime(lastSyncTime)}</span>
            </div>
          </div>

          {(state === 'error' || pendingCount > 0) && isOnline && (
            <Button
              onClick={handleRetrySync}
              className="w-full"
              disabled={state === 'syncing'}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {state === 'syncing' ? 'Syncing...' : 'Retry Sync'}
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}