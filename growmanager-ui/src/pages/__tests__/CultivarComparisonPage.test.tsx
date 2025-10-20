import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import CultivarComparisonPage from '../CultivarComparisonPage';
import * as analyticsApi from '@/services/analyticsApi';
import * as cultivarsApi from '@/services/cultivarsApi';

// Mock the API modules
vi.mock('@/services/analyticsApi');
vi.mock('@/services/cultivarsApi');

const mockCultivars = [
  {
    id: 'cultivar-1',
    userId: 'user-1',
    name: 'Blue Dream',
    type: 'hybrid' as const,
    breeder: 'Test Breeder',
    plantCount: 5,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cultivar-2',
    userId: 'user-1',
    name: 'OG Kush',
    type: 'indica' as const,
    breeder: 'Test Breeder',
    plantCount: 3,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: 'cultivar-3',
    userId: 'user-1',
    name: 'Sour Diesel',
    type: 'sativa' as const,
    breeder: 'Test Breeder',
    plantCount: 2,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
];

const mockComparisonData = {
  cultivars: [
    {
      cultivarId: 'cultivar-1',
      cultivarName: 'Blue Dream',
      totalGrows: 3,
      averageYield: 450.5,
      yieldPerSquareFoot: 85.2,
      averageDuration: 75,
      successRate: 95.5,
      qualityScore: 8.5,
      easeOfGrowth: 7.8,
      environmentalPreferences: {
        optimalTemperature: 72.5,
        optimalHumidity: 55,
        optimalVpd: 1.2,
      },
    },
    {
      cultivarId: 'cultivar-2',
      cultivarName: 'OG Kush',
      totalGrows: 2,
      averageYield: 380.0,
      yieldPerSquareFoot: 72.3,
      averageDuration: 70,
      successRate: 88.0,
      qualityScore: 9.0,
      easeOfGrowth: 6.5,
      environmentalPreferences: {
        optimalTemperature: 70.0,
        optimalHumidity: 50,
        optimalVpd: 1.1,
      },
    },
  ],
  topPerformer: {
    byYield: 'cultivar-1',
    bySuccessRate: 'cultivar-1',
    byEaseOfGrowth: 'cultivar-1',
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('CultivarComparisonPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /cultivar comparison/i })).toBeInTheDocument();
  });

  it('displays cultivars for selection', async () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
      expect(screen.getByText('OG Kush')).toBeInTheDocument();
      expect(screen.getByText('Sour Diesel')).toBeInTheDocument();
    });
  });

  it('validates cultivar selection (2-4 cultivars)', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    // Select only 1 cultivar - should show validation error
    const blueDreamButton = screen.getByText('Blue Dream').closest('button');
    await user.click(blueDreamButton!);

    await waitFor(() => {
      expect(screen.getByText(/select at least 2 cultivars/i)).toBeInTheDocument();
    });
  });

  it('displays comparison table when 2+ cultivars selected', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    // Select 2 cultivars
    const blueDreamButton = screen.getByText('Blue Dream').closest('button');
    const ogKushButton = screen.getByText('OG Kush').closest('button');

    await user.click(blueDreamButton!);
    await user.click(ogKushButton!);

    await waitFor(() => {
      expect(screen.getByText(/detailed comparison/i)).toBeInTheDocument();
      expect(screen.getByText('450.5')).toBeInTheDocument(); // Blue Dream yield
      expect(screen.getByText('380.0')).toBeInTheDocument(); // OG Kush yield
    });
  });

  it('displays top performers summary', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    const blueDreamButton = screen.getByText('Blue Dream').closest('button');
    const ogKushButton = screen.getByText('OG Kush').closest('button');

    await user.click(blueDreamButton!);
    await user.click(ogKushButton!);

    await waitFor(() => {
      expect(screen.getByText(/top performers/i)).toBeInTheDocument();
      expect(screen.getByText(/highest yield/i)).toBeInTheDocument();
      expect(screen.getByText(/best success rate/i)).toBeInTheDocument();
      expect(screen.getByText(/easiest to grow/i)).toBeInTheDocument();
    });
  });

  it('renders radar chart for multi-dimensional comparison', async () => {
    const user = userEvent.setup();

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: mockComparisonData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    const blueDreamButton = screen.getByText('Blue Dream').closest('button');
    const ogKushButton = screen.getByText('OG Kush').closest('button');

    await user.click(blueDreamButton!);
    await user.click(ogKushButton!);

    await waitFor(() => {
      expect(screen.getByText(/multi-dimensional comparison/i)).toBeInTheDocument();
    });
  });

  it('handles error state', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: mockCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch comparison data'),
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/error loading comparison data/i)).toBeInTheDocument();
  });

  it('shows empty state when no cultivars exist', () => {
    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/no cultivars found/i)).toBeInTheDocument();
  });

  it('limits selection to 4 cultivars maximum', async () => {
    const user = userEvent.setup();
    const manyCultivars = [
      ...mockCultivars,
      {
        id: 'cultivar-4',
        userId: 'user-1',
        name: 'Girl Scout Cookies',
        type: 'hybrid' as const,
        breeder: 'Test Breeder',
        plantCount: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'cultivar-5',
        userId: 'user-1',
        name: 'Gorilla Glue',
        type: 'hybrid' as const,
        breeder: 'Test Breeder',
        plantCount: 1,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
    ];

    vi.mocked(cultivarsApi.useCultivars).mockReturnValue({
      data: manyCultivars,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useCultivarComparison).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<CultivarComparisonPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    // Select 4 cultivars
    await user.click(screen.getByText('Blue Dream').closest('button')!);
    await user.click(screen.getByText('OG Kush').closest('button')!);
    await user.click(screen.getByText('Sour Diesel').closest('button')!);
    await user.click(screen.getByText('Girl Scout Cookies').closest('button')!);

    // 5th cultivar button should be disabled
    const gorillaGlueButton = screen.getByText('Gorilla Glue').closest('button');
    expect(gorillaGlueButton).toBeDisabled();
  });
});
