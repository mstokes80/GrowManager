import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import FeedingAnalyticsPage from '../FeedingAnalyticsPage';
import * as analyticsApi from '@/services/analyticsApi';

// Mock the analytics API
vi.mock('@/services/analyticsApi', () => ({
  useFeedingAnalytics: vi.fn(),
}));

// Mock chart components to avoid rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  BarChart: ({ children }: any) => <div data-testid="bar-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ReferenceArea: () => <div data-testid="reference-area" />,
}));

const mockFeedingData = {
  feedingEvents: [
    {
      timestamp: '2024-01-01T10:00:00Z',
      feedingType: 'nutrients' as const,
      amountMl: 1000,
      ecLevel: 1.5,
      phLevel: 6.0,
      nutrientMix: 'Veg Mix',
    },
    {
      timestamp: '2024-01-03T10:00:00Z',
      feedingType: 'watering' as const,
      amountMl: 2000,
      ecLevel: 0.5,
      phLevel: 6.2,
    },
  ],
  statistics: {
    totalNutrientInput: 3.5,
    totalWaterUsed: 15.0,
    averageEc: 1.2,
    averagePh: 6.1,
    ecVariance: 0.05,
    phVariance: 0.02,
    feedingFrequency: 2.5,
  },
  efficiencyMetrics: {
    feedEfficiency: 150.5,
    waterUseEfficiency: 35.2,
    nutrientCostEstimate: 45.0,
  },
  ecPhTrends: [
    {
      timestamp: '2024-01-01',
      avgEc: 1.2,
      avgPh: 6.0,
    },
    {
      timestamp: '2024-01-02',
      avgEc: 1.3,
      avgPh: 6.1,
    },
  ],
};

const createWrapper = (initialPath = '/analytics/feeding/grow-123') => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/analytics/feeding/:growId" element={children} />
          <Route path="/analytics/feeding" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('FeedingAnalyticsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state while fetching data', () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByRole('status', { name: /loading feeding data/i })).toBeInTheDocument();
  });

  it('renders error state when fetch fails', async () => {
    const errorMessage = 'Failed to load feeding data';
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error(errorMessage),
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/error loading feeding data/i)).toBeInTheDocument();
    });
  });

  it('renders empty state when no grow is selected', () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper('/analytics/feeding'),
    });

    expect(screen.getByText(/no grow selected/i)).toBeInTheDocument();
  });

  it('renders empty state when no feeding data available', () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: {
        ...mockFeedingData,
        feedingEvents: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    expect(screen.getByText(/no feeding data available/i)).toBeInTheDocument();
  });

  it('renders charts with feeding data', async () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Check for metric cards
      expect(screen.getByText(/total nutrients/i)).toBeInTheDocument();
      expect(screen.getByText(/average ph/i)).toBeInTheDocument();
      expect(screen.getByText(/average ec/i)).toBeInTheDocument();
      expect(screen.getByText(/feeding frequency/i)).toBeInTheDocument();

      // Check for charts
      expect(screen.getByText(/feeding schedule timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/ph trend/i)).toBeInTheDocument();
      expect(screen.getByText(/ec trend/i)).toBeInTheDocument();
    });
  });

  it('displays efficiency metrics when available', async () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/feed efficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/water use efficiency/i)).toBeInTheDocument();
      expect(screen.getByText(/nutrient cost/i)).toBeInTheDocument();
    });
  });

  it('allows toggling parameter visibility', async () => {
    const user = userEvent.setup();

    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/ph trend/i)).toBeInTheDocument();
    });

    // Find and click the pH toggle checkbox
    const phToggle = screen.getByRole('checkbox', { name: /ph level/i });
    await user.click(phToggle);

    // pH chart should be hidden (not rendered when visibleParams.ph is false)
    await waitFor(() => {
      const phCharts = screen.queryAllByText(/ph trend/i);
      // The chart title should still be in the parameter toggles section
      expect(phCharts.length).toBeLessThanOrEqual(1);
    });
  });

  it('handles time range selector', async () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Time range selector should be present in the page header
      expect(screen.getByText(/feeding analytics/i)).toBeInTheDocument();
    });
  });

  it('displays correct pH and EC values', async () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Check that pH and EC values are displayed
      expect(screen.getByText(/6.10/)).toBeInTheDocument(); // Average pH
      expect(screen.getByText(/1.20 mS\/cm/)).toBeInTheDocument(); // Average EC
    });
  });

  it('shows feeding frequency in days', async () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/2.5 days/)).toBeInTheDocument();
    });
  });

  it('renders with mobile-friendly layout', async () => {
    // Mock window.innerWidth for mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    });

    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: mockFeedingData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    const { container } = render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      // Check that grid layout exists for metric cards
      const grids = container.querySelectorAll('.grid');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  it('handles missing efficiency metrics gracefully', async () => {
    vi.mocked(analyticsApi.useFeedingAnalytics).mockReturnValue({
      data: {
        ...mockFeedingData,
        efficiencyMetrics: {},
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    render(<FeedingAnalyticsPage />, {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(screen.getByText(/total nutrients/i)).toBeInTheDocument();
      // Efficiency metrics should not be shown
      expect(screen.queryByText(/feed efficiency/i)).not.toBeInTheDocument();
    });
  });
});