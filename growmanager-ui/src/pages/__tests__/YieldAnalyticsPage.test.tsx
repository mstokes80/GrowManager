import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import YieldAnalyticsPage from '../YieldAnalyticsPage';
import * as analyticsApi from '@/services/analyticsApi';

// Mock the analytics API
vi.mock('@/services/analyticsApi', () => ({
  useYieldAnalytics: vi.fn(),
}));

// Mock chart components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

const mockYieldData = {
  metrics: {
    totalYield: 1500.5,
    averageYieldPerPlant: 150.5,
    averageYieldPerCultivar: {
      'Northern Lights': 175.0,
      'Blue Dream': 125.0,
    },
    wetToDryRatio: 0.22,
    gramsPerWatt: 1.2,
    successRate: 85.5,
  },
  trends: [
    {
      date: '2024-01-01',
      totalYield: 500.0,
      plantCount: 5,
      averageYield: 100.0,
    },
    {
      date: '2024-02-01',
      totalYield: 1000.5,
      plantCount: 5,
      averageYield: 200.1,
    },
  ],
  qualityDistribution: [
    {
      potencyLevel: 'high' as const,
      count: 5,
      percentage: 50.0,
    },
    {
      potencyLevel: 'medium' as const,
      count: 3,
      percentage: 30.0,
    },
    {
      potencyLevel: 'low' as const,
      count: 2,
      percentage: 20.0,
    },
  ],
  topPerformers: [
    {
      cultivarName: 'Northern Lights',
      totalYield: 875.0,
      averageYield: 175.0,
    },
    {
      cultivarName: 'Blue Dream',
      totalYield: 625.5,
      averageYield: 125.1,
    },
  ],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        {children}
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('YieldAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while fetching data', () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole('status', { name: /loading yield data/i })).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to load yield data';
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(errorMessage),
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/error loading yield data/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no yield data available', () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: {
        metrics: {
          totalYield: 0,
          averageYieldPerPlant: 0,
          averageYieldPerCultivar: {},
          wetToDryRatio: 0,
          successRate: 0,
        },
        trends: [],
        qualityDistribution: [],
        topPerformers: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/no yield data available/i)).toBeInTheDocument();
  });

  it('renders all metric cards with yield data', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/total yield/i)).toBeInTheDocument();
      expect(screen.getByText(/wet to dry ratio/i)).toBeInTheDocument();
      expect(screen.getByText(/success rate/i)).toBeInTheDocument();
      expect(screen.getByText(/grams per watt/i)).toBeInTheDocument();
    });
  });

  it('displays yield comparison chart', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getAllByText(/yield comparison by cultivar/i)[0]).toBeInTheDocument();
      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });
  });

  it('displays quality distribution pie chart', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getAllByText(/quality distribution/i)[0]).toBeInTheDocument();
      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });
  });

  it('displays top performers list', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/top performers/i)).toBeInTheDocument();
      expect(screen.getAllByText(/northern lights/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/blue dream/i)[0]).toBeInTheDocument();
    });
  });

  it('shows correct ranking numbers for top performers', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
    });
  });

  it('displays cultivar performance details', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/cultivar performance details/i)).toBeInTheDocument();
    });
  });

  it('displays correct total yield value', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Total yield should be formatted (1500.5g = 1.5 kg)
      expect(screen.getByText(/1.50 kg/)).toBeInTheDocument();
    });
  });

  it('displays wet to dry ratio as percentage', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // 0.22 * 100 = 22%
      expect(screen.getByText(/22%/)).toBeInTheDocument();
    });
  });

  it('displays success rate correctly', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/85.5%/)).toBeInTheDocument();
    });
  });

  it('shows success variant based on success rate', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Success rate >= 80 should show success variant (green)
      const successCards = container.querySelectorAll('.border-green-200');
      expect(successCards.length).toBeGreaterThan(0);
    });
  });

  it('handles missing gramsPerWatt gracefully', async () => {
    const dataWithoutGPW = {
      ...mockYieldData,
      metrics: {
        ...mockYieldData.metrics,
        gramsPerWatt: undefined,
      },
    };

    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: dataWithoutGPW,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Should still show other metrics
      expect(screen.getByText(/total yield/i)).toBeInTheDocument();
      // But not grams per watt
      expect(screen.queryByText(/grams per watt/i)).not.toBeInTheDocument();
    });
  });

  it('renders with mobile-friendly layout', async () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: mockYieldData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Check that grid layout exists for metric cards
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  it('handles empty top performers list', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: {
        ...mockYieldData,
        topPerformers: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Should still render but without top performers
      expect(screen.getByText(/total yield/i)).toBeInTheDocument();
    });
  });

  it('handles empty quality distribution', async () => {
    vi.mocked(analyticsApi.useYieldAnalytics).mockReturnValue({
      data: {
        ...mockYieldData,
        qualityDistribution: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<YieldAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Should still render but without quality chart
      expect(screen.getByText(/total yield/i)).toBeInTheDocument();
    });
  });
});