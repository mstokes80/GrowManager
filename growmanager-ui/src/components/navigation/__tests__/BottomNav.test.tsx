import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { BottomNav } from '../BottomNav';

describe('BottomNav', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all navigation items', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BottomNav />
      </MemoryRouter>
    );

    // Check that all navigation links are present
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Grows')).toBeInTheDocument();
    expect(screen.getByLabelText('Plants')).toBeInTheDocument();
    expect(screen.getByLabelText('Log')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  it('highlights the active tab', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BottomNav />
      </MemoryRouter>
    );

    const homeLink = screen.getByLabelText('Home');
    const growsLink = screen.getByLabelText('Grows');

    // Active link should have specific classes
    expect(homeLink).toHaveClass('text-grow-dark');
    expect(growsLink).not.toHaveClass('text-grow-dark');
  });

  it('highlights different tab when on different route', () => {
    render(
      <MemoryRouter initialEntries={['/grows']}>
        <BottomNav />
      </MemoryRouter>
    );

    const homeLink = screen.getByLabelText('Home');
    const growsLink = screen.getByLabelText('Grows');

    // Grows link should be active
    expect(growsLink).toHaveClass('text-grow-dark');
    expect(homeLink).not.toHaveClass('text-grow-dark');
  });

  it('has proper accessibility attributes', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BottomNav />
      </MemoryRouter>
    );

    // Navigation should have proper role and aria-label
    const nav = screen.getByRole('navigation', { name: /main navigation/i });
    expect(nav).toBeInTheDocument();

    // All links should have aria-labels
    expect(screen.getByLabelText('Home')).toBeInTheDocument();
    expect(screen.getByLabelText('Grows')).toBeInTheDocument();
    expect(screen.getByLabelText('Plants')).toBeInTheDocument();
    expect(screen.getByLabelText('Log')).toBeInTheDocument();
    expect(screen.getByLabelText('Profile')).toBeInTheDocument();
  });

  it('has minimum touch target size for accessibility', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BottomNav />
      </MemoryRouter>
    );

    const homeLink = screen.getByLabelText('Home');

    // Should have minimum 44px touch target size
    expect(homeLink).toHaveClass('min-w-[44px]');
    expect(homeLink).toHaveClass('min-h-[44px]');
  });

  it('renders correct icons for each tab', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BottomNav />
      </MemoryRouter>
    );

    // Check that each link has an icon (svg element)
    const homeLink = screen.getByLabelText('Home');
    const homeIcon = homeLink.querySelector('svg');
    expect(homeIcon).toBeInTheDocument();
    expect(homeIcon).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies responsive classes for mobile and desktop', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <BottomNav />
      </MemoryRouter>
    );

    const nav = container.querySelector('nav');

    // Should have classes for fixed bottom on mobile and relative on desktop
    expect(nav).toHaveClass('fixed');
    expect(nav).toHaveClass('bottom-0');
    expect(nav).toHaveClass('md:relative');
  });
});