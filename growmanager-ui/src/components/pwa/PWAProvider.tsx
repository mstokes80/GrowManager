/**
 * PWA Provider Component
 *
 * Wraps the application and handles PWA installation and service worker updates.
 * Displays install and update prompts as needed.
 */

import { useState } from 'react'
import { usePWA } from '@/hooks/usePWA'
import { InstallPrompt } from './InstallPrompt'
import { UpdatePrompt } from './UpdatePrompt'

interface PWAProviderProps {
  children: React.ReactNode
}

/**
 * Provider component for PWA functionality
 */
export function PWAProvider({ children }: PWAProviderProps) {
  const { canInstall, needRefresh, install, updateServiceWorker, dismissInstall } =
    usePWA()

  const [showUpdatePrompt, setShowUpdatePrompt] = useState(true)

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false)
  }

  return (
    <>
      {children}

      {/* Install Prompt */}
      <InstallPrompt show={canInstall} onInstall={install} onDismiss={dismissInstall} />

      {/* Update Prompt */}
      <UpdatePrompt
        show={needRefresh && showUpdatePrompt}
        onUpdate={updateServiceWorker}
        onDismiss={handleDismissUpdate}
      />
    </>
  )
}