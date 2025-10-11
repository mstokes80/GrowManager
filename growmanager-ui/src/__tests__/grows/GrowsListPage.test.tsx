import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { GrowsListPage } from '@/pages/GrowsListPage';
import * as growsApi from '@/services/growsApi';

// Mock the grows API
vi.mock('@/services/growsApi', () => ({
  useGrows: vi.fn(),
  useCreateGrow: vi.fn(),
  getGrows: vi.fn(),
  createGrow: vi.fn(),
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

const mockGrows = [
  {
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
  },
  {
    id: '2',
    userId: 'user-1',
    name: 'Outdoor 2024',
    startDate: '2024-05-15T00:00:00Z',
    endDate: '2024-10-15T00:00:00Z',
    status: 'archived' as const,
    environmentType: 'outdoor' as const,
    isArchived: true,
    plantCount: 8,
    createdAt: '2024-05-15T00:00:00Z',
    updatedAt: '2024-10-15T00:00:00Z',
  },
  {
    id: '3',
    userId: 'user-1',
    name: 'Winter 2025 Greenhouse',
    startDate: '2025-01-01T00:00:00Z',
    status: 'flowering' as const,
    environmentType: 'greenhouse' as const,
    isArchived: false,
    plantCount: 6,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-06-15T00:00:00Z',
  },
];

describe('GrowsListPage', () => {
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
          <GrowsListPage />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('renders page header with title and new grow button', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Grows')).toBeInTheDocument();
    expect(screen.getByText('Track your cultivation cycles')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new grow/i })).toBeInTheDocument();
  });

  it('displays loading state', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    // Check for loading spinner by class name
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('displays error state', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Failed to load grows')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays empty state when no grows exist', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('No grows yet')).toBeInTheDocument();
    expect(
      screen.getByText(/create your first grow to start tracking/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create your first grow/i })).toBeInTheDocument();
  });

  it('displays active grows in main section', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('Active Grows')).toBeInTheDocument();
    expect(screen.getByText('Summer 2025 Indoor')).toBeInTheDocument();
    expect(screen.getByText('Winter 2025 Greenhouse')).toBeInTheDocument();
    expect(screen.getByText('4 plants')).toBeInTheDocument();
    expect(screen.getByText('6 plants')).toBeInTheDocument();
  });

  it('displays archived grows in collapsible section', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText(/archived grows \(1\)/i)).toBeInTheDocument();
  });

  it('shows archived grows when accordion is expanded', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const accordionTrigger = screen.getByText(/archived grows \(1\)/i);
    await user.click(accordionTrigger);

    await waitFor(() => {
      expect(screen.getByText('Outdoor 2024')).toBeInTheDocument();
      expect(screen.getByText('8 plants')).toBeInTheDocument();
    });
  });

  it('sorts grows by most recently updated', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const growCards = screen.getAllByRole('button');
    const cardTitles = growCards
      .map((card) => card.textContent)
      .filter((text) => text?.includes('Indoor') || text?.includes('Greenhouse'));

    // Winter 2025 Greenhouse (updated 2025-06-15) should appear before Summer 2025 Indoor (updated 2025-06-10)
    expect(cardTitles[0]).toContain('Winter 2025 Greenhouse');
    expect(cardTitles[1]).toContain('Summer 2025 Indoor');
  });

  it('displays plant count correctly', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('4 plants')).toBeInTheDocument();
    expect(screen.getByText('6 plants')).toBeInTheDocument();
  });

  it('displays "No plants yet" for grows without plants', () => {
    const growsWithoutPlants = [
      {
        ...mockGrows[0],
        plantCount: 0,
      },
    ];

    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: growsWithoutPlants,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('No plants yet')).toBeInTheDocument();
  });

  it('opens create dialog when new grow button is clicked', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    const newGrowButton = screen.getByRole('button', { name: /new grow/i });
    await user.click(newGrowButton);

    await waitFor(() => {
      expect(screen.getByText('Create New Grow')).toBeInTheDocument();
    });
  });

  it('displays status badges with correct text', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByText('vegetative')).toBeInTheDocument();
    expect(screen.getByText('flowering')).toBeInTheDocument();
  });

  it('shows refresh button', () => {
    vi.mocked(growsApi.useGrows).mockReturnValue({
      data: mockGrows,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    } as any);

    vi.mocked(growsApi.useCreateGrow).mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);

    renderComponent();

    expect(screen.getByRole('button', { name: /refresh list/i })).toBeInTheDocument();
  });
});