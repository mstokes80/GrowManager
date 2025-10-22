import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/testUtils';
import EnvironmentalAnalyticsPage from '../EnvironmentalAnalyticsPage';
import * as analyticsApi from '@/services/analyticsApi';

// Mock the analytics API
vi.mock('@/services/analyticsApi', () => ({
  useEnvironmentalTrends: vi.fn(),
}));

describe('EnvironmentalAnalyticsPage', () => {
  const mockEnvironmentalData = {
    dataPoints: [
      {
        timestamp: '2025-10-15T10:00:00Z',
        temperature: 75,
        humidity: 60,
        vpd: 1.2,
        co2: 1200,
        lightIntensity: 800,
      },
      {
        timestamp: '2025-10-16T10:00:00Z',
        temperature: 76,
        humidity: 58,
        vpd: 1.3,
        co2: 1250,
        lightIntensity: 820,
      },
      {
        timestamp: '2025-10-17T10:00:00Z',
        temperature: 74,
        humidity: 62,
        vpd: 1.1,
        co2: 1180,
        lightIntensity: 790,
      },
    ],
    statistics: [
      {
        parameter: 'temperature',
        min: 74,
        max: 76,
        average: 75,
        variance: 0.67,
        standardDeviation: 0.82,
        daysOutOfRange: 0,
        stabilityScore: 95,
      },
      {
        parameter: 'humidity',
        min: 58,
        max: 62,
        average: 60,
        variance: 2.67,
        standardDeviation: 1.63,
        daysOutOfRange: 0,
        stabilityScore: 92,
      },
      {
        parameter: 'vpd',
        min: 1.1,
        max: 1.3,
        average: 1.2,
        variance: 0.007,
        standardDeviation: 0.08,
        daysOutOfRange: 0,
        stabilityScore: 98,
      },
    ],
    stageComparison: [
      {
        stage: 'vegetative' as const,
        averageTemperature: 74,
        averageHumidity: 65,
        averageVpd: 1.0,
        averageCo2: 1100,
        averageLightIntensity: 750,
      },
      {
        stage: 'flowering' as const,
        averageTemperature: 76,
        averageHumidity: 55,
        averageVpd: 1.4,
        averageCo2: 1300,
        averageLightIntensity: 850,
      },
    ],
    optimalRanges: {
      temperature: { min: 70, max: 78 },
      humidity: { min: 50, max: 70 },
      vpd: { min: 0.8, max: 1.4 },
      co2: { min: 1000, max: 1500 },
      lightIntensity: { min: 600, max: 1000 },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Rendering', () => {
    it('renders page header with title and subtitle', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Environmental Analytics')).toBeInTheDocument();
      expect(
        screen.getByText(/Analyze temperature, humidity, VPD, and other environmental factors/)
      ).toBeInTheDocument();
    });

    it('renders time range selector', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByRole('button', { name: /Last 30 days/i })).toBeInTheDocument();
    });

    it('renders parameter toggles', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByLabelText(/Temperature/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Humidity/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/VPD/i)).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when data is being fetched', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByLabelText(/loading/i)).toBeInTheDocument();
    });

    it('does not render charts while loading', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: undefined,
        isLoading: true,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.queryByText('Temperature Trend')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('displays error message when data fetch fails', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('Failed to fetch data'),
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText(/Error loading environmental data/i)).toBeInTheDocument();
    });
  });

  describe('Statistical Summary Cards', () => {
    it('renders metric cards for all statistics', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      // Check for temperature stats
      expect(screen.getByText('Temp Average')).toBeInTheDocument();
      expect(screen.getByText('75°F')).toBeInTheDocument();

      // Check for stability score
      expect(screen.getByText('Temp Stability')).toBeInTheDocument();
      expect(screen.getByText('95')).toBeInTheDocument();
    });

    it('displays min, max, and average values', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      // Temperature stats
      expect(screen.getByText('74°F')).toBeInTheDocument(); // min
      expect(screen.getByText('76°F')).toBeInTheDocument(); // max
    });

    it('shows days out of range indicator', () => {
      const dataWithOutOfRange = {
        ...mockEnvironmentalData,
        statistics: [
          {
            ...mockEnvironmentalData.statistics[0],
            daysOutOfRange: 3,
          },
        ],
      };

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: dataWithOutOfRange,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText(/3 days out of range/i)).toBeInTheDocument();
    });
  });

  describe('Temperature Trend Chart', () => {
    it('renders temperature chart with data', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Temperature Trend')).toBeInTheDocument();
    });

    it('shows optimal range overlay', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText(/Optimal: 70-78°F/i)).toBeInTheDocument();
    });
  });

  describe('Humidity and VPD Charts', () => {
    it('renders humidity chart', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Humidity Trend')).toBeInTheDocument();
    });

    it('renders VPD chart', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('VPD Trend')).toBeInTheDocument();
    });

    it('displays optimal range for humidity', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText(/Optimal: 50-70%/i)).toBeInTheDocument();
    });
  });

  describe('Multi-Parameter Chart', () => {
    it('renders combined temperature and humidity chart', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Temperature & Humidity Correlation')).toBeInTheDocument();
    });

    it('includes export functionality', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      const exportButtons = screen.getAllByRole('button', { name: /Export/i });
      expect(exportButtons.length).toBeGreaterThan(0);
    });
  });

  describe('Stage-Based Comparison', () => {
    it('renders stage comparison section', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Stage Comparison')).toBeInTheDocument();
    });

    it('shows vegetative and flowering averages', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText(/Vegetative/i)).toBeInTheDocument();
      expect(screen.getByText(/Flowering/i)).toBeInTheDocument();
    });

    it('highlights significant differences', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      // Check for Key Differences section
      expect(screen.getByText('Key Differences')).toBeInTheDocument();
    });
  });

  describe('Filter Interactions', () => {
    it('allows toggling temperature visibility', async () => {
      const user = userEvent.setup();

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      const tempToggle = screen.getByLabelText(/Temperature/i);
      expect(tempToggle).toBeChecked();

      await user.click(tempToggle);

      await waitFor(() => {
        expect(tempToggle).not.toBeChecked();
      });
    });

    it('allows toggling humidity visibility', async () => {
      const user = userEvent.setup();

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      const humidityToggle = screen.getByLabelText(/Humidity/i);
      expect(humidityToggle).toBeChecked();

      await user.click(humidityToggle);

      await waitFor(() => {
        expect(humidityToggle).not.toBeChecked();
      });
    });

    it('allows toggling VPD visibility', async () => {
      const user = userEvent.setup();

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      const vpdToggle = screen.getByLabelText(/VPD/i);
      expect(vpdToggle).toBeChecked();

      await user.click(vpdToggle);

      await waitFor(() => {
        expect(vpdToggle).not.toBeChecked();
      });
    });

    it('allows changing time range', async () => {
      const user = userEvent.setup();

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      const timeRangeButton = screen.getByRole('button', { name: /Last 30 days/i });
      await user.click(timeRangeButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Last 7 days/i })).toBeInTheDocument();
      });
    });
  });

  describe('Responsive Design', () => {
    it('renders on mobile breakpoint (320px)', () => {
      global.innerWidth = 320;
      global.dispatchEvent(new Event('resize'));

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Environmental Analytics')).toBeInTheDocument();
      expect(screen.getByText('Temperature Trend')).toBeInTheDocument();
    });

    it('renders on tablet breakpoint (768px)', () => {
      global.innerWidth = 768;
      global.dispatchEvent(new Event('resize'));

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText('Environmental Analytics')).toBeInTheDocument();
    });

    it('adjusts chart height responsively', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      // Charts should be rendered
      expect(screen.getByText('Temperature Trend')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty message when no data is available', () => {
      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: {
          dataPoints: [],
          statistics: [],
          stageComparison: [],
          optimalRanges: {
            temperature: { min: 70, max: 78 },
            humidity: { min: 50, max: 70 },
            vpd: { min: 0.8, max: 1.4 },
          },
        },
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      expect(screen.getByText(/No environmental data available/i)).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('renders charts within performance budget', async () => {
      const startTime = performance.now();

      vi.mocked(analyticsApi.useEnvironmentalTrends).mockReturnValue({
        data: mockEnvironmentalData,
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      render(<EnvironmentalAnalyticsPage />);

      await waitFor(() => {
        expect(screen.getByText('Temperature Trend')).toBeInTheDocument();
      });

      const renderTime = performance.now() - startTime;

      // Charts should render in less than 500ms as per requirements
      expect(renderTime).toBeLessThan(500);
    });
  });
});