/**
 * Service Worker Registration and Update Handling
 *
 * Provides utilities for registering the service worker and handling updates.
 * Uses Workbox for service worker lifecycle management.
 */

import { Workbox } from 'workbox-window'

export interface ServiceWorkerUpdateCallback {
  onNeedRefresh?: () => void
  onOfflineReady?: () => void
  onRegistered?: (registration: ServiceWorkerRegistration) => void
  onRegisterError?: (error: Error) => void
}

/**
 * Registers the service worker and sets up update detection
 *
 * @param callbacks - Callbacks for various service worker lifecycle events
 * @returns Workbox instance for controlling the service worker
 */
export function registerSW(
  callbacks?: ServiceWorkerUpdateCallback,
): Workbox | undefined {
  if ('serviceWorker' in navigator) {
    const wb = new Workbox('/sw.js')

    // Handle waiting service worker (update available)
    wb.addEventListener('waiting', () => {
      callbacks?.onNeedRefresh?.()
    })

    // Handle activated service worker
    wb.addEventListener('activated', (event) => {
      // Check if this is the first activation (fresh install)
      if (!event.isUpdate) {
        callbacks?.onOfflineReady?.()
      }
    })

    // Register the service worker
    wb.register()
      .then((registration) => {
        if (registration) {
          callbacks?.onRegistered?.(registration)

          // Check for updates every hour
          setInterval(
            () => {
              registration.update()
            },
            60 * 60 * 1000,
          )
        }
      })
      .catch((error) => {
        console.error('Service worker registration failed:', error)
        callbacks?.onRegisterError?.(error)
      })

    return wb
  }

  return undefined
}

/**
 * Updates the service worker when a new version is available
 *
 * @param wb - Workbox instance
 */
export function updateSW(wb: Workbox): void {
  wb.messageSkipWaiting()
}

/**
 * Checks if the browser supports service workers
 *
 * @returns true if service workers are supported
 */
export function isServiceWorkerSupported(): boolean {
  return 'serviceWorker' in navigator
}

/**
 * Unregisters all service workers (useful for development/testing)
 */
export async function unregisterAllServiceWorkers(): Promise<void> {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
  }
}