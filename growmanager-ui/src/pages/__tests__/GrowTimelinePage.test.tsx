import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import GrowTimelinePage from '../GrowTimelinePage';
import * as analyticsApi from '@/services/analyticsApi';
import * as growsApi from '@/services/growsApi';

// Mock the API modules
vi.mock('@/services/analyticsApi');
vi.mock('@/services/growsApi');

const mockGrow = {
  id: 'grow-1',
  userId: 'user-1',
  name: 'Summer 2024 Grow',
  location: 'Tent A',
  startDate: '2024-06-01',
  status: 'active' as const,
  createdAt: '2024-06-01T00:00:00Z',
  updatedAt: '2024-06-01T00:00:00Z',
};

const mockTimelineData = {
  events: [
    {
      id: 'event-1',
      type: 'feeding' as const,
      title: 'Nutrient Feeding',
      description: 'Fed with 5ml/gal of base nutrients',
      timestamp: '2024-10-01T10:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2024 Grow',
      metadata: {
        ecLevel: 1.5,
        phLevel: 6.2,
        amountMl: 1000,
      },
    },
    {
      id: 'event-2',
      type: 'watering' as const,
      title: 'Watering',
      description: 'Plain water with pH adjustment',
      timestamp: '2024-10-02T09:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2024 Grow',
      metadata: {
        phLevel: 6.5,
        amountMl: 500,
      },
    },
    {
      id: 'event-3',
      type: 'observation' as const,
      title: 'Weekly Check',
      description: 'Plants looking healthy, no signs of stress',
      timestamp: '2024-10-03T12:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2024 Grow',
      photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    },
    {
      id: 'event-4',
      type: 'training' as const,
      title: 'LST Applied',
      description: 'Low stress training to encourage horizontal growth',
      timestamp: '2024-10-04T14:00:00Z',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
      growName: 'Summer 2024 Grow',
    },
  ],
  milestones: [
    {
      id: 'milestone-1',
      type: 'veg_start' as const,
      date: '2024-09-15',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
    },
    {
      id: 'milestone-2',
      type: 'flower_start' as const,
      date: '2024-10-01',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      growId: 'grow-1',
    },
  ],
  photoTimeline: [
    {
      timestamp: '2024-10-03T12:00:00Z',
      photoUrl: 'https://example.com/photo1.jpg',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      stage: 'flowering',
    },
    {
      timestamp: '2024-09-20T10:00:00Z',
      photoUrl: 'https://example.com/photo2.jpg',
      plantId: 'plant-1',
      plantTag: 'Plant #1',
      stage: 'vegetative',
    },
  ],
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
      <BrowserRouter>
        <Routes>
          <Route path="/grows/:growId/timeline" element={children} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('GrowTimelinePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as any);

    // Need to navigate to the route with growId
    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    expect(screen.getByRole('status', { name: /loading timeline data/i })).toBeInTheDocument();
  });

  it('displays timeline events', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nutrient Feeding')).toBeInTheDocument();
      expect(screen.getByText('Watering')).toBeInTheDocument();
      expect(screen.getByText('Weekly Check')).toBeInTheDocument();
      expect(screen.getByText('LST Applied')).toBeInTheDocument();
    });
  });

  it('displays event type filters', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/event filters/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/feeding/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/watering/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/training/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/observation/i)).toBeInTheDocument();
  });

  it('filters events by type', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nutrient Feeding')).toBeInTheDocument();
    });

    // Uncheck feeding events
    const feedingCheckbox = screen.getByLabelText(/feeding/i);
    await user.click(feedingCheckbox);

    await waitFor(() => {
      expect(screen.queryByText('Nutrient Feeding')).not.toBeInTheDocument();
      expect(screen.getByText('Watering')).toBeInTheDocument();
    });
  });

  it('opens event detail modal on click', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nutrient Feeding')).toBeInTheDocument();
    });

    const eventButton = screen.getByText('Nutrient Feeding').closest('button');
    await user.click(eventButton!);

    await waitFor(() => {
      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText(/fed with 5ml\/gal of base nutrients/i)).toBeInTheDocument();
    });
  });

  it('displays milestones section', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/growth milestones/i)).toBeInTheDocument();
      expect(screen.getByText(/veg start/i)).toBeInTheDocument();
      expect(screen.getByText(/flower start/i)).toBeInTheDocument();
    });
  });

  it('displays photo timeline', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/photo timeline/i)).toBeInTheDocument();
    });

    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  it('displays view mode toggle buttons', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Timeline View')).toBeInTheDocument();
      expect(screen.getByText('Calendar View')).toBeInTheDocument();
    });
  });

  it('switches to calendar view', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Timeline View')).toBeInTheDocument();
    });

    const calendarViewButton = screen.getByText('Calendar View');
    await user.click(calendarViewButton);

    await waitFor(() => {
      expect(screen.getByText(/calendar view coming soon/i)).toBeInTheDocument();
    });
  });

  it('handles error state', () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Failed to fetch timeline events'),
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    expect(screen.getByText(/error loading timeline data/i)).toBeInTheDocument();
  });

  it('displays empty state when no events', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: {
        events: [],
        milestones: [],
        photoTimeline: [],
      },
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no events found/i)).toBeInTheDocument();
    });
  });

  it('groups events by date', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nutrient Feeding')).toBeInTheDocument();
    });

    // Check for date headers (events are from Oct 1-4)
    const dateHeaders = screen.getAllByText(/October/i);
    expect(dateHeaders.length).toBeGreaterThan(0);
  });

  it('displays event metadata in detail modal', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nutrient Feeding')).toBeInTheDocument();
    });

    const eventButton = screen.getByText('Nutrient Feeding').closest('button');
    await user.click(eventButton!);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      expect(within(dialog).getByText(/additional details/i)).toBeInTheDocument();
      expect(within(dialog).getByText('1.5')).toBeInTheDocument(); // EC level
      expect(within(dialog).getByText('6.2')).toBeInTheDocument(); // pH level
    });
  });

  it('displays photos in event detail modal', async () => {
    const user = userEvent.setup();

    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Weekly Check')).toBeInTheDocument();
    });

    const eventButton = screen.getByText('Weekly Check').closest('button');
    await user.click(eventButton!);

    await waitFor(() => {
      const dialog = screen.getByRole('dialog');
      const images = within(dialog).getAllByRole('img');
      expect(images.length).toBe(2); // Event has 2 photos
    });
  });

  it('displays print button', async () => {
    vi.mocked(growsApi.useGrow).mockReturnValue({
      data: mockGrow,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    vi.mocked(analyticsApi.useTimelineEvents).mockReturnValue({
      data: mockTimelineData,
      isLoading: false,
      isError: false,
      error: null,
    } as any);

    window.history.pushState({}, '', '/grows/grow-1/timeline');

    render(<GrowTimelinePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/print/i)).toBeInTheDocument();
    });
  });
});