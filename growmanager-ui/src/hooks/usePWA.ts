/**
 * PWA (Progressive Web App) Hook
 *
 * Manages PWA installation prompt and service worker lifecycle.
 * Provides state and actions for installing the app and handling updates.
 */

import { useEffect, useState } from 'react'
import { registerSW, updateSW } from '@/utils/serviceWorker'
import type { Workbox } from 'workbox-window'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface UsePWAReturn {
  /** Whether the app can be installed */
  canInstall: boolean
  /** Whether a service worker update is available */
  needRefresh: boolean
  /** Whether the app is ready for offline use */
  offlineReady: boolean
  /** Workbox instance */
  workbox: Workbox | undefined
  /** Trigger the install prompt */
  install: () => Promise<void>
  /** Update the service worker to the new version */
  updateServiceWorker: () => void
  /** Dismiss the install prompt */
  dismissInstall: () => void
}

/**
 * Hook for managing PWA installation and service worker updates
 *
 * @returns PWA state and control functions
 */
export function usePWA(): UsePWAReturn {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [canInstall, setCanInstall] = useState(false)
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [workbox, setWorkbox] = useState<Workbox>()

  useEffect(() => {
    // Handle beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the default mini-infobar from appearing
      e.preventDefault()
      // Save the event for later use
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setCanInstall(true)
    }

    // Handle app installed event
    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setCanInstall(false)
      console.log('PWA was installed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // Register service worker
    const wb = registerSW({
      onNeedRefresh: () => setNeedRefresh(true),
      onOfflineReady: () => setOfflineReady(true),
      onRegistered: (registration) => {
        console.log('Service worker registered:', registration)
      },
      onRegisterError: (error) => {
        console.error('Service worker registration error:', error)
      },
    })

    if (wb) {
      setWorkbox(wb)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  /**
   * Trigger the install prompt
   */
  const install = async () => {
    if (!deferredPrompt) {
      console.warn('Install prompt not available')
      return
    }

    // Show the install prompt
    await deferredPrompt.prompt()

    // Wait for the user's response
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    // Clear the deferred prompt
    setDeferredPrompt(null)
    setCanInstall(false)
  }

  /**
   * Update the service worker
   */
  const updateServiceWorker = () => {
    if (workbox) {
      updateSW(workbox)
      setNeedRefresh(false)
    }
  }

  /**
   * Dismiss the install prompt
   */
  const dismissInstall = () => {
    setDeferredPrompt(null)
    setCanInstall(false)
  }

  return {
    canInstall,
    needRefresh,
    offlineReady,
    workbox,
    install,
    updateServiceWorker,
    dismissInstall,
  }
}