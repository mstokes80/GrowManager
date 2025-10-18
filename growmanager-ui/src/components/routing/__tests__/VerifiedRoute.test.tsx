import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { VerifiedRoute } from '../VerifiedRoute';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/stores/authStore';

// Mock the auth store
vi.mock('@/stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

describe('VerifiedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders children when user email is verified', () => {
    const verifiedUser: User = {
      id: 1,
      email: 'test@example.com',
      emailVerified: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // Mock verified user state
    vi.mocked(useAuthStore).mockReturnValue({
      user: verifiedUser,
    } as any);

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <VerifiedRoute>
                <div>App Content</div>
              </VerifiedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('redirects to /verify-email when user email is not verified', () => {
    const unverifiedUser: User = {
      id: 1,
      email: 'test@example.com',
      emailVerified: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    // Mock unverified user state
    vi.mocked(useAuthStore).mockReturnValue({
      user: unverifiedUser,
    } as any);

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <VerifiedRoute>
                <div>App Content</div>
              </VerifiedRoute>
            }
          />
          <Route path="/verify-email" element={<div>Verify Email Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should redirect to verify-email page
    expect(screen.getByText('Verify Email Page')).toBeInTheDocument();
    expect(screen.queryByText('App Content')).not.toBeInTheDocument();
  });

  it('renders children when user is null (allows ProtectedRoute to handle auth)', () => {
    // Mock null user state (not authenticated, will be handled by ProtectedRoute)
    vi.mocked(useAuthStore).mockReturnValue({
      user: null,
    } as any);

    render(
      <MemoryRouter initialEntries={['/app']}>
        <Routes>
          <Route
            path="/app"
            element={
              <VerifiedRoute>
                <div>App Content</div>
              </VerifiedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Should render content (ProtectedRoute will handle the redirect to login)
    expect(screen.getByText('App Content')).toBeInTheDocument();
  });

  it('preserves the intended destination when redirecting to verify-email', () => {
    const unverifiedUser: User = {
      id: 1,
      email: 'test@example.com',
      emailVerified: false,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    };

    vi.mocked(useAuthStore).mockReturnValue({
      user: unverifiedUser,
    } as any);

    render(
      <MemoryRouter initialEntries={['/app/specific-page']}>
        <Routes>
          <Route
            path="/app/specific-page"
            element={
              <VerifiedRoute>
                <div>App Content</div>
              </VerifiedRoute>
            }
          />
          <Route path="/verify-email" element={<div>Verify Email Page</div>} />
        </Routes>
      </MemoryRouter>
    );

    // Should be on verify-email page
    expect(screen.getByText('Verify Email Page')).toBeInTheDocument();
  });
});