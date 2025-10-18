import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CultivarsListPage from '@/pages/CultivarsListPage';
import * as cultivarsApi from '@/services/cultivarsApi';

// Mock the cultivars API
vi.mock('@/services/cultivarsApi', () => ({
  useCultivars: vi.fn(),
  useCreateCultivar: vi.fn(),
  getCultivars: vi.fn(),
  createCultivar: vi.fn(),
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
    subtitle,
    actions,
  }: {
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
  }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
      {actions}
    </div>
  ),
}));

const mockCultivars = [
  {
    id: '1',
    userId: 'user-1',
    name: 'Blue Dream',
    breeder: 'Humboldt Seed Org',
    genetics: 'Blueberry x Haze',
    type: 'hybrid' as const,
    characteristics: { flowering_time: '8-9 weeks' },
    notes: 'Great for beginners',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    name: 'OG Kush',
    breeder: 'DNA Genetics',
    genetics: 'Chemdawg x Lemon Thai',
    type: 'indica' as const,
    notes: 'Classic strain',
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
];

describe('CultivarsListPage', () => {
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
          <CultivarsListPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders page header with title and add button', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Cultivars')).toBeInTheDocument();
    expect(screen.getByText('Your personal strain library')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add cultivar/i })).toBeInTheDocument();
  });

  it('displays loading state', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Loading spinner
  });

  it('displays error state', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Failed to load cultivars')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays empty state when no cultivars exist', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('No cultivars yet')).toBeInTheDocument();
    expect(
      screen.getByText(/add your first strain to start tracking cultivars/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add your first cultivar/i })).toBeInTheDocument();
  });

  it('displays cultivars in a grid', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    expect(screen.getByText('OG Kush')).toBeInTheDocument();
    expect(screen.getByText(/humboldt seed org/i)).toBeInTheDocument();
    expect(screen.getByText(/dna genetics/i)).toBeInTheDocument();
  });

  it('filters cultivars by name when searching', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/search by name or breeder/i);
    await user.type(searchInput, 'blue');

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
      expect(screen.queryByText('OG Kush')).not.toBeInTheDocument();
    });
  });

  it('filters cultivars by breeder when searching', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/search by name or breeder/i);
    await user.type(searchInput, 'dna');

    await waitFor(() => {
      expect(screen.getByText('OG Kush')).toBeInTheDocument();
      expect(screen.queryByText('Blue Dream')).not.toBeInTheDocument();
    });
  });

  it('shows no results message when search has no matches', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const searchInput = screen.getByPlaceholderText(/search by name or breeder/i);
    await user.type(searchInput, 'nonexistent');

    await waitFor(() => {
      expect(screen.getByText('No results found')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /clear search/i })).toBeInTheDocument();
    });
  });

  it('opens create dialog when add button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(cultivarsApi.useCreateCultivar).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const addButton = screen.getByRole('button', { name: /add cultivar/i });
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.getByText('Add New Cultivar')).toBeInTheDocument();
    });
  });
});