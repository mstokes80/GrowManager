/**
 * InstallPrompt Component Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { InstallPrompt } from './InstallPrompt'

describe('InstallPrompt Component', () => {
  it('does not render when show is false', () => {
    const { container } = render(
      <InstallPrompt show={false} onInstall={vi.fn()} onDismiss={vi.fn()} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders after delay when show is true', async () => {
    vi.useFakeTimers()

    render(<InstallPrompt show={true} onInstall={vi.fn()} onDismiss={vi.fn()} />)

    // Should not be visible immediately
    expect(screen.queryByText('Install GrowManager')).not.toBeInTheDocument()

    // Fast-forward time
    act(() => {
      vi.advanceTimersByTime(3000)
    })

    // Should now be visible
    expect(screen.getByText('Install GrowManager')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('calls onInstall when Install button is clicked', () => {
    vi.useFakeTimers()

    const mockInstall = vi.fn().mockResolvedValue(undefined)
    render(<InstallPrompt show={true} onInstall={mockInstall} onDismiss={vi.fn()} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const installButton = screen.getByRole('button', { name: /install/i })

    act(() => {
      fireEvent.click(installButton)
    })

    expect(mockInstall).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('calls onDismiss when Not now button is clicked', () => {
    vi.useFakeTimers()

    const mockDismiss = vi.fn()
    render(<InstallPrompt show={true} onInstall={vi.fn()} onDismiss={mockDismiss} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const dismissButton = screen.getByRole('button', { name: /not now/i })
    fireEvent.click(dismissButton)

    expect(mockDismiss).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('calls onDismiss when X button is clicked', () => {
    vi.useFakeTimers()

    const mockDismiss = vi.fn()
    render(<InstallPrompt show={true} onInstall={vi.fn()} onDismiss={mockDismiss} />)

    act(() => {
      vi.advanceTimersByTime(3000)
    })

    const closeButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(closeButton)

    expect(mockDismiss).toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('shows Installing... text when install is in progress', async () => {
    const mockInstall = vi.fn().mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100)),
    )
    render(<InstallPrompt show={true} onInstall={mockInstall} onDismiss={vi.fn()} />)

    // Wait for the component to become visible (uses real timers for this test)
    await waitFor(
      () => {
        expect(screen.getByText('Install GrowManager')).toBeInTheDocument()
      },
      { timeout: 4000 },
    )

    const installButton = screen.getByRole('button', { name: /install/i })
    fireEvent.click(installButton)

    // Should show Installing... while promise is pending
    await waitFor(() => {
      expect(screen.getByText('Installing...')).toBeInTheDocument()
    })
  })
})