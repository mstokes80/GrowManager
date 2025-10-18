/**
 * usePWA Hook Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePWA } from './usePWA'

// Mock the service worker utilities
vi.mock('@/utils/serviceWorker', () => ({
  registerSW: vi.fn((callbacks) => {
    // Simulate successful registration
    if (callbacks?.onRegistered) {
      setTimeout(() => callbacks.onRegistered({}), 0)
    }
    return {
      register: vi.fn().mockResolvedValue({}),
      addEventListener: vi.fn(),
      messageSkipWaiting: vi.fn(),
    }
  }),
  updateSW: vi.fn(),
}))

describe('usePWA Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes with correct default values', () => {
    const { result } = renderHook(() => usePWA())

    expect(result.current.canInstall).toBe(false)
    expect(result.current.needRefresh).toBe(false)
    expect(result.current.offlineReady).toBe(false)
    expect(typeof result.current.install).toBe('function')
    expect(typeof result.current.updateServiceWorker).toBe('function')
    expect(typeof result.current.dismissInstall).toBe('function')
  })

  it('sets canInstall to true when beforeinstallprompt is fired', async () => {
    const { result } = renderHook(() => usePWA())

    expect(result.current.canInstall).toBe(false)

    // Simulate beforeinstallprompt event
    const mockEvent = new Event('beforeinstallprompt')
    Object.assign(mockEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })

    act(() => {
      window.dispatchEvent(mockEvent)
    })

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true)
    })
  })

  it('resets canInstall when app is installed', async () => {
    const { result } = renderHook(() => usePWA())

    // First, trigger beforeinstallprompt
    const beforeInstallEvent = new Event('beforeinstallprompt')
    Object.assign(beforeInstallEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })

    act(() => {
      window.dispatchEvent(beforeInstallEvent)
    })

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true)
    })

    // Then, trigger appinstalled
    const installedEvent = new Event('appinstalled')

    act(() => {
      window.dispatchEvent(installedEvent)
    })

    await waitFor(() => {
      expect(result.current.canInstall).toBe(false)
    })
  })

  it('dismissInstall resets install prompt state', async () => {
    const { result } = renderHook(() => usePWA())

    // Trigger beforeinstallprompt
    const mockEvent = new Event('beforeinstallprompt')
    Object.assign(mockEvent, {
      prompt: vi.fn(),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })

    act(() => {
      window.dispatchEvent(mockEvent)
    })

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true)
    })

    // Dismiss the prompt
    act(() => {
      result.current.dismissInstall()
    })

    expect(result.current.canInstall).toBe(false)
  })

  it('install triggers the deferred prompt', async () => {
    const { result } = renderHook(() => usePWA())

    const mockPrompt = vi.fn().mockResolvedValue(undefined)
    const mockEvent = new Event('beforeinstallprompt')
    Object.assign(mockEvent, {
      prompt: mockPrompt,
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    })

    act(() => {
      window.dispatchEvent(mockEvent)
    })

    await waitFor(() => {
      expect(result.current.canInstall).toBe(true)
    })

    // Trigger install
    await act(async () => {
      await result.current.install()
    })

    expect(mockPrompt).toHaveBeenCalled()
    expect(result.current.canInstall).toBe(false)
  })

  it('install does nothing when no deferred prompt exists', async () => {
    const { result } = renderHook(() => usePWA())

    // Try to install without a deferred prompt
    await act(async () => {
      await result.current.install()
    })

    // Should not throw and canInstall should remain false
    expect(result.current.canInstall).toBe(false)
  })
})