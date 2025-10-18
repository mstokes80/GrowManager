/**
 * PWA Install Prompt Component
 *
 * Displays a prompt to install the application as a PWA.
 * Appears when the app is installable and shows a toast notification.
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'

interface InstallPromptProps {
  /** Whether the install prompt should be shown */
  show: boolean
  /** Callback to trigger the install */
  onInstall: () => Promise<void>
  /** Callback to dismiss the prompt */
  onDismiss: () => void
}

/**
 * Install prompt component for PWA installation
 */
export function InstallPrompt({ show, onInstall, onDismiss }: InstallPromptProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (show) {
      // Delay showing the prompt to avoid being intrusive
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    }

    setIsVisible(false)
    return undefined
  }, [show])

  if (!isVisible) {
    return null
  }

  const handleInstall = async () => {
    setIsInstalling(true)
    try {
      await onInstall()
    } finally {
      setIsInstalling(false)
      setIsVisible(false)
    }
  }

  const handleDismiss = () => {
    setIsVisible(false)
    onDismiss()
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
            <Download className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Install GrowManager
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Install our app for offline access and a better experience.
            </p>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                onClick={handleInstall}
                disabled={isInstalling}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isInstalling ? 'Installing...' : 'Install'}
              </Button>
              <Button size="sm" variant="outline" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
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