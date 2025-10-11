import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GrowDetailPage } from '@/pages/GrowDetailPage';
import * as growsApi from '@/services/growsApi';

// Mock the grows API
vi.mock('@/services/growsApi', () => ({
  useGrow: vi.fn(),
  useUpdateGrow: vi.fn(),
  useArchiveGrow: vi.fn(),
  useUnarchiveGrow: vi.fn(),
  useDeleteGrow: vi.fn(),
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

// Mock the PageHeader component
vi.mock('@/components/layouts/PageHeader', () => ({
  PageHeader: ({
    title,
    showBackButton,
    actions,
  }: {
    title: string;
    showBackButton?: boolean;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {showBackButton && <button>Back</button>}
      {actions}
    </div>
  ),
}));

const mockGrow = {
  id: '1',
  userId: 'user-1',
  name: 'Summer 2025 Indoor',
  startDate: '2025-06-01T00:00:00Z',
  status: 'vegetative' as const,
  environmentType: 'indoor' as const,
  notes: 'First indoor grow',
  isArchived: false,
  plantCount: 4,
  createdAt: '2025-06-01T00:00:00Z',
  updatedAt: '2025-06-10T00:00:00Z',
};

const mockArchivedGrow = {
  ...mockGrow,
  id: '2',
  name: 'Archived Grow',
  status: 'archived' as const,
  isArchived: true,
};

describe('GrowDetailPage', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderComponent = (growId = '1') => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/grows/:id" element={<GrowDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>,
      {
        // Set initial route
        wrapper: ({ children }) => {
          window.history.pushState({}, 'Test', `/grows/${growId}`);
          return <>{children}</>;
        },
      }
    );
  };

  it('displays loading state', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('displays error state when grow not found', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Failed to load grow')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to grows/i })).toBeInTheDocument();
  });

  it('displays grow details correctly', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Summer 2025 Indoor')).toBeInTheDocument();
    expect(screen.getByText('vegetative')).toBeInTheDocument();
    expect(screen.getByText('indoor')).toBeInTheDocument();
    expect(screen.getByText('First indoor grow')).toBeInTheDocument();
    expect(screen.getByText('4 plants')).toBeInTheDocument();
  });

  it('displays "No plants" when plantCount is 0', () => {
    const growWithNoPlants = {
      ...mockGrow,
      plantCount: 0,
    };

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: growWithNoPlants,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('No plants')).toBeInTheDocument();
  });

  it('shows edit button', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('shows archive button for non-archived grow', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    // Click dropdown menu trigger
    const moreButton = screen.getAllByRole('button').find((btn) => btn.textContent === '');
    expect(moreButton).toBeDefined();

    if (moreButton) {
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText(/archive/i)).toBeInTheDocument();
      });
    }
  });

  it('shows unarchive and delete buttons for archived grow', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockArchivedGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent('2');

    // Click dropdown menu trigger
    const moreButton = screen.getAllByRole('button').find((btn) => btn.textContent === '');
    expect(moreButton).toBeDefined();

    if (moreButton) {
      await user.click(moreButton);

      await waitFor(() => {
        expect(screen.getByText(/unarchive/i)).toBeInTheDocument();
        expect(screen.getByText(/delete/i)).toBeInTheDocument();
      });
    }
  });

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Grow')).toBeInTheDocument();
    });
  });

  it('displays all tab options', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByRole('tab', { name: /overview/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /plants/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /environment/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /harvests/i })).toBeInTheDocument();
  });

  it('shows placeholder message for plants tab', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const plantsTab = screen.getByRole('tab', { name: /plants/i });
    await user.click(plantsTab);

    await waitFor(() => {
      expect(screen.getByText(/plants feature coming in phase 6/i)).toBeInTheDocument();
    });
  });

  it('shows placeholder message for environment tab', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const environmentTab = screen.getByRole('tab', { name: /environment/i });
    await user.click(environmentTab);

    await waitFor(() => {
      expect(screen.getByText(/environment tracking coming soon/i)).toBeInTheDocument();
    });
  });

  it('shows placeholder message for harvests tab', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(growsApi.useUpdateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useArchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useUnarchiveGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(growsApi.useDeleteGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const harvestsTab = screen.getByRole('tab', { name: /harvests/i });
    await user.click(harvestsTab);

    await waitFor(() => {
      expect(screen.getByText(/harvests feature coming soon/i)).toBeInTheDocument();
    });
  });
});