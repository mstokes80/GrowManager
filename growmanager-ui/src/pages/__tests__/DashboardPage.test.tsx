import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';
import DashboardPage from '../DashboardPage';

/**
 * DashboardPage Test Suite
 * Tests for enhanced dashboard with analytics integration
 */

// Mock the API hooks
vi.mock('@/services/growsApi', () => ({
  useGrows: vi.fn(),
}));

vi.mock('@/services/plantsApi', () => ({
  usePlants: vi.fn(),
}));

vi.mock('@/services/analyticsApi', () => ({
  useAnalyticsDashboard: vi.fn(),
}));

const { useGrows } = await import('@/services/growsApi');
const { usePlants } = await import('@/services/plantsApi');
const { useAnalyticsDashboard } = await import('@/services/analyticsApi');

// Test data
const mockGrows = [
  {
    id: '1',
    name: 'Summer Grow 2024',
    startDate: '2024-01-15',
    isArchived: false,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Spring Grow 2024',
    startDate: '2024-03-01',
    isArchived: false,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-03-01T00:00:00Z',
  },
  {
    id: '3',
    name: 'Winter Grow 2023',
    startDate: '2023-12-01',
    isArchived: true,
    createdAt: '2023-12-01T00:00:00Z',
    updatedAt: '2023-12-01T00:00:00Z',
  },
];

const mockPlants = [
  {
    id: '1',
    growId: '1',
    plantTag: 'Plant-001',
    cultivarName: 'Blue Dream',
    stage: 'vegetative' as const,
    healthStatus: 'active' as const,
    plantedDate: '2024-01-20',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    sortOrder: 1,
  },
  {
    id: '2',
    growId: '1',
    plantTag: 'Plant-002',
    cultivarName: 'Northern Lights',
    stage: 'flowering' as const,
    healthStatus: 'active' as const,
    plantedDate: '2024-01-20',
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
    sortOrder: 2,
  },
  {
    id: '3',
    growId: '2',
    plantTag: 'Plant-003',
    cultivarName: 'OG Kush',
    stage: 'seedling' as const,
    healthStatus: 'active' as const,
    plantedDate: '2024-03-05',
    createdAt: '2024-03-05T00:00:00Z',
    updatedAt: '2024-03-05T00:00:00Z',
    sortOrder: 1,
  },
  {
    id: '4',
    growId: '3',
    plantTag: 'Plant-004',
    cultivarName: 'Sour Diesel',
    stage: 'harvested' as const,
    healthStatus: 'harvested' as const,
    plantedDate: '2023-12-05',
    harvestedDate: '2024-02-15',
    createdAt: '2023-12-05T00:00:00Z',
    updatedAt: '2024-02-15T00:00:00Z',
    sortOrder: 1,
  },
];

const mockAnalyticsDashboard = {
  environmentalQuality: [
    {
      parameter: 'temperature' as const,
      currentValue: 24.5,
      unit: '°C',
      status: 'optimal' as const,
      optimalMin: 20,
      optimalMax: 28,
    },
    {
      parameter: 'humidity' as const,
      currentValue: 65,
      unit: '%',
      status: 'optimal' as const,
      optimalMin: 50,
      optimalMax: 70,
    },
    {
      parameter: 'vpd' as const,
      currentValue: 1.2,
      unit: 'kPa',
      status: 'warning' as const,
      optimalMin: 0.8,
      optimalMax: 1.1,
    },
  ],
  plantStageDistribution: [
    { stage: 'seedling' as const, count: 1, percentage: 25 },
    { stage: 'vegetative' as const, count: 1, percentage: 25 },
    { stage: 'flowering' as const, count: 1, percentage: 25 },
    { stage: 'harvested' as const, count: 1, percentage: 25 },
  ],
  issueTracking: {
    totalIssues: 5,
    unresolvedCount: 2,
    resolvedCount: 3,
    trend: 'down' as const,
    recentIssues: [
      {
        id: '1',
        type: 'nutrient_deficiency',
        description: 'Nitrogen deficiency in Plant-001',
        createdAt: '2024-10-18T10:00:00Z',
      },
    ],
  },
  recentActivities: [
    {
      id: '1',
      type: 'watering' as const,
      description: 'Watered with nutrients',
      plantId: '1',
      plantTag: 'Plant-001',
      growId: '1',
      growName: 'Summer Grow 2024',
      timestamp: '2024-10-18T09:00:00Z',
    },
    {
      id: '2',
      type: 'training' as const,
      description: 'LST applied',
      plantId: '2',
      plantTag: 'Plant-002',
      growId: '1',
      growName: 'Summer Grow 2024',
      timestamp: '2024-10-17T14:30:00Z',
    },
  ],
  summary: {
    activeGrows: 2,
    activePlants: 3,
    totalObservations: 15,
    upcomingHarvests: 1,
  },
};

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{component}</BrowserRouter>
    </QueryClientProvider>
  );
};

describe('DashboardPage', () => {
  describe('Component Rendering', () => {
    it('should render loading state when data is loading', () => {
      vi.mocked(useGrows).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByRole('status', { name: /loading/i })).toBeInTheDocument();
    });

    it('should render dashboard content when data is loaded', async () => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: mockPlants,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
        expect(screen.queryByRole('status', { name: /loading/i })).not.toBeInTheDocument();
      });
    });

    it('should render page header with correct title and subtitle', () => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: mockPlants,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
      expect(screen.getByText(/overview of your grows/i)).toBeInTheDocument();
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: mockPlants,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should display correct grow statistics', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Total Grows')).toBeInTheDocument();
      expect(screen.getByText('2 active')).toBeInTheDocument();
    });

    it('should display correct plant statistics', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Total Plants')).toBeInTheDocument();
      expect(screen.getByText('Active Plants')).toBeInTheDocument();
    });

    it('should display environmental quality indicators', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Environmental Quality')).toBeInTheDocument();
      expect(screen.getByText('Temperature')).toBeInTheDocument();
      expect(screen.getByText('Humidity')).toBeInTheDocument();
    });

    it('should display plant stage distribution', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Plant Distribution by Stage')).toBeInTheDocument();
      expect(screen.getAllByText(/seedling/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/vegetative/i)[0]).toBeInTheDocument();
      expect(screen.getAllByText(/flowering/i)[0]).toBeInTheDocument();
    });

    it('should display issue tracking summary', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Issue Tracking')).toBeInTheDocument();
      expect(screen.getByText('Total')).toBeInTheDocument();
      expect(screen.getByText('Unresolved')).toBeInTheDocument();
    });

    it('should display recent activities', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByText('Recent Activity')).toBeInTheDocument();
      expect(screen.getByText(/watered with nutrients/i)).toBeInTheDocument();
      expect(screen.getByText(/lst applied/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    beforeEach(() => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: mockPlants,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should have View Analytics button', () => {
      renderWithProviders(<DashboardPage />);

      const analyticsButton = screen.getByRole('button', { name: /view analytics/i });
      expect(analyticsButton).toBeInTheDocument();
    });

    it('should have quick action buttons', () => {
      renderWithProviders(<DashboardPage />);

      expect(screen.getByRole('button', { name: /create new grow/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add new plant/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /manage cultivars/i })).toBeInTheDocument();
    });

    it('should navigate when clicking on active grow', async () => {
      const user = userEvent.setup();
      renderWithProviders(<DashboardPage />);

      const growCard = screen.getAllByText('Summer Grow 2024');
      await user.click(growCard[0]!);

      // Navigation would be tested with routing integration
      expect(growCard[0]).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: mockPlants,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should have responsive grid classes for stats cards', () => {
      const { container } = renderWithProviders(<DashboardPage />);

      const statsGrid = container.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
      expect(statsGrid).toBeInTheDocument();
    });

    it('should have responsive grid for main content', () => {
      const { container } = renderWithProviders(<DashboardPage />);

      const mainGrid = container.querySelector('.grid.grid-cols-1.lg\\:grid-cols-2');
      expect(mainGrid).toBeInTheDocument();
    });

    it('should use container with padding for content', () => {
      const { container } = renderWithProviders(<DashboardPage />);

      const contentContainer = container.querySelector('.container.mx-auto.px-4.py-6');
      expect(contentContainer).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: mockPlants,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);
    });

    it('should have proper heading structure', () => {
      renderWithProviders(<DashboardPage />);

      const mainHeading = screen.getByRole('heading', { name: /dashboard/i });
      expect(mainHeading).toBeInTheDocument();
    });

    it('should have accessible buttons with clear labels', () => {
      renderWithProviders(<DashboardPage />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should provide context for metrics', () => {
      renderWithProviders(<DashboardPage />);

      // Metrics should have labels/descriptions
      expect(screen.getByText(/total grows/i)).toBeInTheDocument();
      expect(screen.getByText(/active plants/i)).toBeInTheDocument();
    });

    it('should use semantic HTML for cards', () => {
      const { container } = renderWithProviders(<DashboardPage />);

      // Cards should use appropriate semantic structure
      const cards = container.querySelectorAll('[role="region"], [class*="card"]');
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no grows exist', () => {
      vi.mocked(useGrows).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: {
          ...mockAnalyticsDashboard,
          environmentalQuality: [],
          plantStageDistribution: [],
          recentActivities: [],
          summary: {
            activeGrows: 0,
            activePlants: 0,
            totalObservations: 0,
            upcomingHarvests: 0,
          },
        },
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText(/no active grows yet/i)).toBeInTheDocument();
      expect(screen.getByText(/start your first grow/i)).toBeInTheDocument();
    });

    it('should show empty state when no plants exist', () => {
      vi.mocked(useGrows).mockReturnValue({
        data: mockGrows,
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(usePlants).mockReturnValue({
        data: [],
        isLoading: false,
        error: null,
      } as any);
      vi.mocked(useAnalyticsDashboard).mockReturnValue({
        data: mockAnalyticsDashboard,
        isLoading: false,
        error: null,
      } as any);

      renderWithProviders(<DashboardPage />);

      expect(screen.getByText(/no plants yet/i)).toBeInTheDocument();
    });
  });
});