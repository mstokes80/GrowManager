/**
 * Conflict Resolution Modal
 *
 * Shows side-by-side comparison of local and server data when a sync conflict occurs.
 * User can choose to keep their local version or accept the server version.
 */

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export interface ConflictData {
  entityType: string
  entityId: string
  localData: any
  serverData: any
}

interface ConflictResolutionModalProps {
  open: boolean
  onClose: () => void
  conflict: ConflictData | null
  onResolve: (useLocalVersion: boolean) => void
}

/**
 * Conflict Resolution Modal Component
 *
 * Displays:
 * - Warning message about conflict
 * - Side-by-side comparison of local vs server data
 * - Buttons to choose local version or server version
 */
export function ConflictResolutionModal({
  open,
  onClose,
  conflict,
  onResolve,
}: ConflictResolutionModalProps) {
  const [isResolving, setIsResolving] = useState(false)

  if (!conflict) {
    return null
  }

  const handleResolve = async (useLocalVersion: boolean) => {
    setIsResolving(true)
    try {
      await onResolve(useLocalVersion)
      onClose()
    } catch (error) {
      console.error('Failed to resolve conflict:', error)
    } finally {
      setIsResolving(false)
    }
  }

  // Format data for display
  const formatData = (data: any) => {
    if (!data) return 'N/A'

    // Extract relevant fields for display
    const displayFields: Record<string, any> = {}
    const excludeFields = ['id', 'userId', 'createdAt']

    Object.keys(data).forEach((key) => {
      if (!excludeFields.includes(key)) {
        displayFields[key] = data[key]
      }
    })

    return JSON.stringify(displayFields, null, 2)
  }

  const getEntityTypeName = (type: string) => {
    const names: Record<string, string> = {
      grows: 'Grow',
      plants: 'Plant',
      observations: 'Observation',
      cultivars: 'Cultivar',
      feedingEvents: 'Feeding Event',
      activities: 'Activity',
      environmentSnapshots: 'Environment Snapshot',
      harvests: 'Harvest',
    }
    return names[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Sync Conflict Detected
          </DialogTitle>
          <DialogDescription>
            This {getEntityTypeName(conflict.entityType).toLowerCase()} was modified on another device.
            Please choose which version to keep.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-4">
          {/* Local Version */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Your Local Changes</h3>
              <span className="text-xs text-gray-500">
                {conflict.localData?.updatedAt ? (
                  new Date(conflict.localData.updatedAt).toLocaleString()
                ) : (
                  'Unknown time'
                )}
              </span>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {formatData(conflict.localData)}
              </pre>
            </div>
          </div>

          {/* Server Version */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-sm">Server Version</h3>
              <span className="text-xs text-gray-500">
                {conflict.serverData?.updatedAt ? (
                  new Date(conflict.serverData.updatedAt).toLocaleString()
                ) : (
                  'Unknown time'
                )}
              </span>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-md p-3">
              <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
                {formatData(conflict.serverData)}
              </pre>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 text-sm">
          <p className="text-yellow-800">
            <strong>Note:</strong> If you choose "Use My Version", your local changes will overwrite the server data.
            If you choose "Use Server Version", your local changes will be discarded.
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => handleResolve(false)}
            disabled={isResolving}
          >
            Use Server Version
          </Button>
          <Button
            onClick={() => handleResolve(true)}
            disabled={isResolving}
          >
            Use My Version
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}