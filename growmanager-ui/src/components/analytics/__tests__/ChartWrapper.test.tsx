import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { ChartWrapper } from '../charts/ChartWrapper';
import { LineChart, Line } from 'recharts';

// Mock recharts ResponsiveContainer to avoid resize observer issues in tests
vi.mock('recharts', async () => {
  const actual = await vi.importActual('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 800, height: 400 }}>{children}</div>
    ),
  };
});

// Mock the exportToCSV function
vi.mock('@/utils/chartUtils', async () => {
  const actual = await vi.importActual('@/utils/chartUtils');
  return {
    ...actual,
    exportToCSV: vi.fn(),
  };
});

const mockData = [
  { name: 'Jan', value: 100 },
  { name: 'Feb', value: 120 },
  { name: 'Mar', value: 110 },
];

const MockChart = () => (
  <LineChart width={800} height={400} data={mockData}>
    <Line type="monotone" dataKey="value" stroke="#8884d8" />
  </LineChart>
);

describe('ChartWrapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders title and description', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          description="Test description"
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Test Chart')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('renders chart when data is provided', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      // ResponsiveContainer is mocked, so we check for the wrapper div
      expect(screen.getByText('Test Chart')).toBeInTheDocument();
    });

    it('renders export button when data is available', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });

    it('does not render export button when data is empty', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={[]}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    it('renders custom actions', () => {
      const customAction = <button>Custom Action</button>;

      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
          actions={customAction}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Custom Action')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading state when isLoading is true', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    it('applies custom height to loading state', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
          height={500}
        >
          <MockChart />
        </ChartWrapper>
      );

      const loadingContainer = screen.getByText('Loading chart data...').closest('div')?.parentElement;
      expect(loadingContainer).toHaveStyle({ height: '500px' });
    });
  });

  describe('Error State', () => {
    it('shows error state when error is provided', () => {
      const errorMessage = 'Failed to load data';

      render(
        <ChartWrapper
          title="Test Chart"
          error={errorMessage}
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Error loading chart')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
    });

    it('does not show error when loading', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
          error="Error message"
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.queryByText('Error loading chart')).not.toBeInTheDocument();
      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when data is empty', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={[]}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('No data available')).toBeInTheDocument();
    });

    it('shows custom empty message', () => {
      const customMessage = 'No results found';

      render(
        <ChartWrapper
          title="Test Chart"
          data={[]}
          emptyMessage={customMessage}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText(customMessage)).toBeInTheDocument();
    });

    it('shows custom empty icon', () => {
      const CustomIcon = () => <div>Custom Icon</div>;

      render(
        <ChartWrapper
          title="Test Chart"
          data={[]}
          emptyIcon={<CustomIcon />}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Custom Icon')).toBeInTheDocument();
    });
  });

  describe('Export Functionality', () => {
    it('calls exportToCSV when export button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const { exportToCSV } = await import('@/utils/chartUtils');

      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
          exportFilename="test-export.csv"
        >
          <MockChart />
        </ChartWrapper>
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(exportToCSV).toHaveBeenCalledWith(mockData, 'test-export.csv');
    });

    it('uses default filename when not provided', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const { exportToCSV } = await import('@/utils/chartUtils');

      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      expect(exportToCSV).toHaveBeenCalledWith(mockData, 'chart-data.csv');
    });

    it('does not call exportToCSV when data is empty', async () => {
      const { exportToCSV } = await import('@/utils/chartUtils');

      render(
        <ChartWrapper
          title="Test Chart"
          data={[]}
        >
          <MockChart />
        </ChartWrapper>
      );

      // Export button should not be present
      expect(screen.queryByRole('button', { name: /export/i })).not.toBeInTheDocument();
      expect(exportToCSV).not.toHaveBeenCalled();
    });
  });

  describe('Styling', () => {
    it('applies custom className', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
          className="custom-class"
        >
          <MockChart />
        </ChartWrapper>
      );

      const card = screen.getByText('Test Chart').closest('.custom-class');
      expect(card).toBeInTheDocument();
    });

    it('uses string height value', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
          height="50vh"
        >
          <MockChart />
        </ChartWrapper>
      );

      const container = screen.getByText('Test Chart')
        .closest('[class*="card"]')
        ?.querySelector('[class*="card-content"]')
        ?.firstElementChild;

      expect(container).toHaveAttribute('height', '50vh');
    });

    it('uses number height value', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          data={mockData}
          height={400}
        >
          <MockChart />
        </ChartWrapper>
      );

      const container = screen.getByText('Test Chart')
        .closest('[class*="card"]')
        ?.querySelector('[class*="card-content"]')
        ?.firstElementChild;

      expect(container).toHaveAttribute('height', '400');
    });
  });

  describe('State Priority', () => {
    it('shows loading state over error state', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={true}
          error="Error message"
          data={[]}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Loading chart data...')).toBeInTheDocument();
      expect(screen.queryByText('Error loading chart')).not.toBeInTheDocument();
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });

    it('shows error state over empty state', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          error="Error message"
          data={[]}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.getByText('Error loading chart')).toBeInTheDocument();
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
    });

    it('shows chart when all states are false', () => {
      render(
        <ChartWrapper
          title="Test Chart"
          isLoading={false}
          error={null}
          data={mockData}
        >
          <MockChart />
        </ChartWrapper>
      );

      expect(screen.queryByText('Loading chart data...')).not.toBeInTheDocument();
      expect(screen.queryByText('Error loading chart')).not.toBeInTheDocument();
      expect(screen.queryByText('No data available')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    });
  });
});