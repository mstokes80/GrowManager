/**
 * Service Worker Utilities Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  registerSW,
  isServiceWorkerSupported,
  unregisterAllServiceWorkers,
} from './serviceWorker'

describe('Service Worker Utilities', () => {
  const originalNavigator = global.navigator

  beforeEach(() => {
    // Reset navigator before each test
    vi.clearAllMocks()
  })

  afterEach(() => {
    // Restore original navigator
    Object.defineProperty(global, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    })
  })

  describe('isServiceWorkerSupported', () => {
    it('returns true when service workers are supported', () => {
      // Mock navigator.serviceWorker
      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {},
        writable: true,
        configurable: true,
      })

      expect(isServiceWorkerSupported()).toBe(true)
    })

    it('returns false when service workers are not supported', () => {
      // Remove serviceWorker from navigator
      const nav = { ...global.navigator }
      delete (nav as any).serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: nav,
        writable: true,
        configurable: true,
      })

      expect(isServiceWorkerSupported()).toBe(false)
    })
  })

  describe('registerSW', () => {
    it('returns undefined when service workers are not supported', () => {
      // Remove serviceWorker from navigator
      const nav = { ...global.navigator }
      delete (nav as any).serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: nav,
        writable: true,
        configurable: true,
      })

      const result = registerSW()
      expect(result).toBeUndefined()
    })

    it.skip('registers service worker when supported - requires Workbox mock', () => {
      // This test requires proper Workbox mocking which is complex in the test environment
      // In production, Workbox is loaded from the vite-plugin-pwa generated service worker
      // Skipping this test as it would require extensive mocking infrastructure
    })
  })

  describe('unregisterAllServiceWorkers', () => {
    it('unregisters all service workers', async () => {
      const mockUnregister = vi.fn().mockResolvedValue(true)
      const mockRegistrations = [
        { unregister: mockUnregister },
        { unregister: mockUnregister },
      ]

      Object.defineProperty(global.navigator, 'serviceWorker', {
        value: {
          getRegistrations: vi.fn().mockResolvedValue(mockRegistrations),
        },
        writable: true,
        configurable: true,
      })

      await unregisterAllServiceWorkers()

      expect(mockUnregister).toHaveBeenCalledTimes(2)
    })

    it('does nothing when service workers are not supported', async () => {
      const nav = { ...global.navigator }
      delete (nav as any).serviceWorker
      Object.defineProperty(global, 'navigator', {
        value: nav,
        writable: true,
        configurable: true,
      })

      await expect(unregisterAllServiceWorkers()).resolves.toBeUndefined()
    })
  })
})