/**
 * UpdatePrompt Component Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { UpdatePrompt } from './UpdatePrompt'

describe('UpdatePrompt Component', () => {
  const originalLocation = window.location

  beforeEach(() => {
    // Mock window.location.reload
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...originalLocation, reload: vi.fn() },
    })
  })

  afterEach(() => {
    // Restore window.location
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    })
    vi.clearAllMocks()
  })

  it('does not render when show is false', () => {
    const { container } = render(
      <UpdatePrompt show={false} onUpdate={vi.fn()} onDismiss={vi.fn()} />,
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders when show is true', () => {
    render(<UpdatePrompt show={true} onUpdate={vi.fn()} onDismiss={vi.fn()} />)

    expect(screen.getByText('Update Available')).toBeInTheDocument()
    expect(
      screen.getByText('A new version of GrowManager is available. Reload to update.'),
    ).toBeInTheDocument()
  })

  it('calls onUpdate and reloads when Reload button is clicked', () => {
    const mockUpdate = vi.fn()
    render(<UpdatePrompt show={true} onUpdate={mockUpdate} onDismiss={vi.fn()} />)

    const reloadButton = screen.getByRole('button', { name: /reload/i })
    fireEvent.click(reloadButton)

    expect(mockUpdate).toHaveBeenCalled()
    expect(window.location.reload).toHaveBeenCalled()
  })

  it('calls onDismiss when Later button is clicked', () => {
    const mockDismiss = vi.fn()
    render(<UpdatePrompt show={true} onUpdate={vi.fn()} onDismiss={mockDismiss} />)

    const laterButton = screen.getByRole('button', { name: /later/i })
    fireEvent.click(laterButton)

    expect(mockDismiss).toHaveBeenCalled()
    expect(window.location.reload).not.toHaveBeenCalled()
  })

  it('calls onDismiss when X button is clicked', () => {
    const mockDismiss = vi.fn()
    render(<UpdatePrompt show={true} onUpdate={vi.fn()} onDismiss={mockDismiss} />)

    const closeButton = screen.getByRole('button', { name: /dismiss/i })
    fireEvent.click(closeButton)

    expect(mockDismiss).toHaveBeenCalled()
    expect(window.location.reload).not.toHaveBeenCalled()
  })
})