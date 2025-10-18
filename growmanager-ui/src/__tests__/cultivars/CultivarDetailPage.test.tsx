import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CultivarDetailPage from '@/pages/CultivarDetailPage';
import * as cultivarsApi from '@/services/cultivarsApi';

// Mock the cultivars API
vi.mock('@/services/cultivarsApi', () => ({
  useCultivar: vi.fn(),
  useUpdateCultivar: vi.fn(),
  useDeleteCultivar: vi.fn(),
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

const mockCultivar = {
  id: '1',
  userId: 'user-1',
  name: 'Blue Dream',
  breeder: 'Humboldt Seed Organization',
  genetics: 'Blueberry x Haze',
  type: 'hybrid' as const,
  characteristics: {
    flowering_time: '8-9 weeks',
    yield: 'high',
    thc: '20-25%',
  },
  notes: 'Great for beginners. Easy to grow.',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
};

describe('CultivarDetailPage', () => {
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

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/cultivars/:id" element={<CultivarDetailPage />} />
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
  };

  it('renders loading state', () => {
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders error state when cultivar not found', () => {
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Not found'),
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Failed to load cultivar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /back to cultivars/i })).toBeInTheDocument();
  });

  it('displays cultivar details correctly', () => {
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: mockCultivar,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    expect(screen.getByText('Humboldt Seed Organization')).toBeInTheDocument();
    expect(screen.getByText('Blueberry x Haze')).toBeInTheDocument();
    expect(screen.getByText('hybrid')).toBeInTheDocument();
    expect(screen.getByText('Great for beginners. Easy to grow.')).toBeInTheDocument();
  });

  it('displays characteristics correctly', () => {
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: mockCultivar,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Characteristics')).toBeInTheDocument();
    expect(screen.getByText('flowering time')).toBeInTheDocument();
    expect(screen.getByText('8-9 weeks')).toBeInTheDocument();
    expect(screen.getByText('yield')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
  });

  it('displays usage information', () => {
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: mockCultivar,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Usage')).toBeInTheDocument();
    expect(screen.getByText('Not used by any plants yet')).toBeInTheDocument();
  });

  it('opens edit dialog when edit button is clicked', async () => {
    const user = userEvent.setup();
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: mockCultivar,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const editButton = screen.getByRole('button', { name: /edit/i });
    await user.click(editButton);

    await waitFor(() => {
      expect(screen.getByText('Edit Cultivar')).toBeInTheDocument();
    });
  });

  it('opens delete dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: mockCultivar,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    // Open dropdown menu
    const dropdownTrigger = screen.getByRole('button', { name: '' }); // The MoreVertical button
    await user.click(dropdownTrigger);

    await waitFor(() => {
      const deleteMenuItem = screen.getByRole('menuitem', { name: /delete/i });
      expect(deleteMenuItem).toBeInTheDocument();
    });
  });

  it('displays back button', () => {
    navigate('/cultivars/1');

    vi.mocked(cultivarsApi.useCultivar).mockReturnValue({
      data: mockCultivar,
      isLoading: false,
      error: null,
    } as any);

    vi.mocked(cultivarsApi.useUpdateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    vi.mocked(cultivarsApi.useDeleteCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
  });
});