import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { ActivityTimeline } from '../ActivityTimeline';
import { FeedingEvent } from '@/types/feedingEvent';
import { ActivityLog } from '@/types/activityLog';

const mockFeedingEvents: FeedingEvent[] = [
  {
    id: 'feeding-1',
    plantId: 'plant-1',
    feedingType: 'nutrients',
    amountMl: 500,
    ecLevel: 1.5,
    phLevel: 6.2,
    nutrientMix: 'Grow nutrients',
    notes: 'Fed with grow nutrients',
    fedAt: '2025-01-05T10:00:00Z',
    createdAt: '2025-01-05T10:00:00Z',
    updatedAt: '2025-01-05T10:00:00Z',
    plantTag: 'Plant #1',
  },
  {
    id: 'feeding-2',
    plantId: 'plant-1',
    feedingType: 'watering',
    amountMl: 300,
    phLevel: 6.5,
    notes: 'Plain water',
    fedAt: '2025-01-03T10:00:00Z',
    createdAt: '2025-01-03T10:00:00Z',
    updatedAt: '2025-01-03T10:00:00Z',
    plantTag: 'Plant #1',
  },
];

const mockActivityLogs: ActivityLog[] = [
  {
    id: 'activity-1',
    plantId: 'plant-1',
    activityType: 'training',
    description: 'LST training',
    notes: 'Bent main stem to promote lateral growth',
    loggedAt: '2025-01-04T14:00:00Z',
    createdAt: '2025-01-04T14:00:00Z',
    updatedAt: '2025-01-04T14:00:00Z',
    plantTag: 'Plant #1',
  },
  {
    id: 'activity-2',
    plantId: 'plant-1',
    activityType: 'pruning',
    description: 'Removed lower fan leaves',
    notes: 'Improved air circulation',
    loggedAt: '2025-01-02T14:00:00Z',
    createdAt: '2025-01-02T14:00:00Z',
    updatedAt: '2025-01-02T14:00:00Z',
    plantTag: 'Plant #1',
  },
];

describe('ActivityTimeline', () => {
  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(<ActivityTimeline feedingEvents={[]} activityLogs={[]} isLoading={true} />);

      expect(screen.getByRole('generic', { hidden: true })).toHaveClass('animate-spin');
    });

    it('does not show content while loading', () => {
      render(
        <ActivityTimeline
          feedingEvents={mockFeedingEvents}
          activityLogs={mockActivityLogs}
          isLoading={true}
        />
      );

      expect(screen.queryByText(/nutrients/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/training/i)).not.toBeInTheDocument();
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no events or logs', () => {
      render(<ActivityTimeline feedingEvents={[]} activityLogs={[]} />);

      expect(screen.getByText(/no activity yet/i)).toBeInTheDocument();
      expect(
        screen.getByText(/track feeding events and maintenance activities/i)
      ).toBeInTheDocument();
    });

    it('does not show empty state when there are events', () => {
      render(<ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={[]} />);

      expect(screen.queryByText(/no activity yet/i)).not.toBeInTheDocument();
    });

    it('does not show empty state when there are logs', () => {
      render(<ActivityTimeline feedingEvents={[]} activityLogs={mockActivityLogs} />);

      expect(screen.queryByText(/no activity yet/i)).not.toBeInTheDocument();
    });
  });

  describe('Timeline Rendering', () => {
    it('renders feeding events', () => {
      render(<ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={[]} />);

      expect(screen.getByText(/nutrients/i)).toBeInTheDocument();
      expect(screen.getByText(/watering/i)).toBeInTheDocument();
    });

    it('renders activity logs', () => {
      render(<ActivityTimeline feedingEvents={[]} activityLogs={mockActivityLogs} />);

      expect(screen.getByText(/LST training/i)).toBeInTheDocument();
      expect(screen.getByText(/Removed lower fan leaves/i)).toBeInTheDocument();
    });

    it('renders both feeding events and activity logs together', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      expect(screen.getByText(/nutrients/i)).toBeInTheDocument();
      expect(screen.getByText(/watering/i)).toBeInTheDocument();
      expect(screen.getByText(/LST training/i)).toBeInTheDocument();
      expect(screen.getByText(/Removed lower fan leaves/i)).toBeInTheDocument();
    });
  });

  describe('Chronological Sorting', () => {
    it('sorts events newest first', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      // Get all the text content in order
      const text = screen.getByRole('generic').textContent || '';

      // Verify order: Jan 5 (feeding) > Jan 4 (activity) > Jan 3 (feeding) > Jan 2 (activity)
      const feedingIndex = text.indexOf('nutrients');
      const trainingIndex = text.indexOf('LST training');
      const wateringIndex = text.indexOf('watering');
      const pruningIndex = text.indexOf('Removed lower fan leaves');

      expect(feedingIndex).toBeLessThan(trainingIndex);
      expect(trainingIndex).toBeLessThan(wateringIndex);
      expect(wateringIndex).toBeLessThan(pruningIndex);
    });
  });

  describe('Date Grouping', () => {
    it('groups items by date', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      // Check that date headers are present
      expect(screen.getByText(/january 05, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/january 04, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/january 03, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/january 02, 2025/i)).toBeInTheDocument();
    });

    it('groups multiple items on the same day', () => {
      const sameDayEvents: FeedingEvent[] = [
        {
          ...mockFeedingEvents[0]!,
          id: 'feeding-1',
          fedAt: '2025-01-05T10:00:00Z',
        },
        {
          ...mockFeedingEvents[0]!,
          id: 'feeding-2',
          feedingType: 'watering',
          fedAt: '2025-01-05T14:00:00Z',
        },
      ];

      render(<ActivityTimeline feedingEvents={sameDayEvents} activityLogs={[]} />);

      // Should have only one date header for January 05
      const dateHeaders = screen.getAllByText(/january 05, 2025/i);
      expect(dateHeaders).toHaveLength(1);
    });
  });

  describe('Load More Functionality', () => {
    it('shows load more button when there are more than 20 items', () => {
      // Create 25 feeding events
      const manyEvents: FeedingEvent[] = Array.from({ length: 25 }, (_, i) => ({
        ...mockFeedingEvents[0]!,
        id: `feeding-${i}`,
        fedAt: new Date(2025, 0, i + 1, 10, 0, 0).toISOString(),
      }));

      render(<ActivityTimeline feedingEvents={manyEvents} activityLogs={[]} />);

      expect(screen.getByRole('button', { name: /load more/i })).toBeInTheDocument();
      expect(screen.getByText(/5 remaining/i)).toBeInTheDocument();
    });

    it('does not show load more button when 20 or fewer items', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
    });

    it('loads more items when load more button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      // Create 25 feeding events
      const manyEvents: FeedingEvent[] = Array.from({ length: 25 }, (_, i) => ({
        ...mockFeedingEvents[0]!,
        id: `feeding-${i}`,
        feedingType: i % 2 === 0 ? ('nutrients' as const) : ('watering' as const),
        fedAt: new Date(2025, 0, i + 1, 10, 0, 0).toISOString(),
      }));

      render(<ActivityTimeline feedingEvents={manyEvents} activityLogs={[]} />);

      const loadMoreButton = screen.getByRole('button', { name: /load more/i });
      await user.click(loadMoreButton);

      // After clicking, the remaining count should be 0 and button should disappear
      expect(screen.queryByRole('button', { name: /load more/i })).not.toBeInTheDocument();
      expect(screen.getByText(/end of timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/25 total events/i)).toBeInTheDocument();
    });

    it('shows end of timeline message when all items are visible', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      expect(screen.getByText(/end of timeline/i)).toBeInTheDocument();
      expect(screen.getByText(/4 total events/i)).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats dates correctly', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      // Check for formatted date headers
      expect(screen.getByText(/sunday, january 05, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/saturday, january 04, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/friday, january 03, 2025/i)).toBeInTheDocument();
      expect(screen.getByText(/thursday, january 02, 2025/i)).toBeInTheDocument();
    });

    it('handles invalid dates gracefully', () => {
      const invalidEvent: FeedingEvent = {
        ...mockFeedingEvents[0]!,
        fedAt: 'invalid-date',
      };

      render(<ActivityTimeline feedingEvents={[invalidEvent]} activityLogs={[]} />);

      expect(screen.getByText(/date unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Item Count Display', () => {
    it('shows correct total count at end of timeline', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      expect(screen.getByText(/4 total events/i)).toBeInTheDocument();
    });

    it('shows correct remaining count in load more button', () => {
      const manyEvents: FeedingEvent[] = Array.from({ length: 30 }, (_, i) => ({
        ...mockFeedingEvents[0]!,
        id: `feeding-${i}`,
        fedAt: new Date(2025, 0, i + 1, 10, 0, 0).toISOString(),
      }));

      render(<ActivityTimeline feedingEvents={manyEvents} activityLogs={[]} />);

      expect(screen.getByText(/10 remaining/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('renders date headers with proper semantic markup', () => {
      render(
        <ActivityTimeline feedingEvents={mockFeedingEvents} activityLogs={mockActivityLogs} />
      );

      const dateHeaders = screen.getAllByRole('heading', { level: 3 });
      expect(dateHeaders.length).toBeGreaterThan(0);
    });

    it('uses proper heading hierarchy', () => {
      render(<ActivityTimeline feedingEvents={[]} activityLogs={[]} />);

      const emptyStateHeading = screen.getByRole('heading', { level: 3, name: /no activity yet/i });
      expect(emptyStateHeading).toBeInTheDocument();
    });
  });
});