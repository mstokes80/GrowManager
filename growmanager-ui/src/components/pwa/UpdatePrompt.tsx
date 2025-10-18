/**
 * PWA Update Prompt Component
 *
 * Displays a prompt when a new version of the app is available.
 * Allows the user to reload the app to use the new version.
 */

import { Button } from '@/components/ui/button'
import { RefreshCw, X } from 'lucide-react'

interface UpdatePromptProps {
  /** Whether the update prompt should be shown */
  show: boolean
  /** Callback to update the service worker */
  onUpdate: () => void
  /** Callback to dismiss the prompt */
  onDismiss: () => void
}

/**
 * Update prompt component for service worker updates
 */
export function UpdatePrompt({ show, onUpdate, onDismiss }: UpdatePromptProps) {
  if (!show) {
    return null
  }

  const handleUpdate = () => {
    onUpdate()
    // Reload the page to activate the new service worker
    window.location.reload()
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Update Available
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              A new version of GrowManager is available. Reload to update.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleUpdate}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Reload
              </Button>
              <Button size="sm" variant="outline" onClick={onDismiss}>
                Later
              </Button>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}