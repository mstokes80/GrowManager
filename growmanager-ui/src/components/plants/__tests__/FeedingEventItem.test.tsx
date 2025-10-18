import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { FeedingEventItem } from '../FeedingEventItem';
import { FeedingEvent } from '@/types/feedingEvent';

const mockFeedingEvent: FeedingEvent = {
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
};

describe('FeedingEventItem', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText(/nutrients/i)).toBeInTheDocument();
    });

    it('displays feeding type badge', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText('nutrients')).toBeInTheDocument();
    });

    it('displays amount in ml', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText('500 ml')).toBeInTheDocument();
    });

    it('displays EC level when present', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText(/EC:/i)).toBeInTheDocument();
      expect(screen.getByText('1.5')).toBeInTheDocument();
    });

    it('displays pH level when present', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText(/pH:/i)).toBeInTheDocument();
      expect(screen.getByText('6.2')).toBeInTheDocument();
    });

    it('displays nutrient mix when present', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText(/Mix:/i)).toBeInTheDocument();
      expect(screen.getByText(/Grow nutrients/i)).toBeInTheDocument();
    });

    it('displays notes when present', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText('Fed with grow nutrients')).toBeInTheDocument();
    });

    it('displays formatted timestamp', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      expect(screen.getByText(/jan 05, 2025 10:00 am/i)).toBeInTheDocument();
    });
  });

  describe('Feeding Types', () => {
    it('displays watering feeding type', () => {
      const wateringEvent = { ...mockFeedingEvent, feedingType: 'watering' as const };
      render(<FeedingEventItem event={wateringEvent} />);
      expect(screen.getByText('watering')).toBeInTheDocument();
    });

    it('displays foliar feeding type', () => {
      const foliarEvent = { ...mockFeedingEvent, feedingType: 'foliar' as const };
      render(<FeedingEventItem event={foliarEvent} />);
      expect(screen.getByText('foliar')).toBeInTheDocument();
    });

    it('displays nutrients feeding type', () => {
      const nutrientsEvent = { ...mockFeedingEvent, feedingType: 'nutrients' as const };
      render(<FeedingEventItem event={nutrientsEvent} />);
      expect(screen.getByText('nutrients')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('does not display EC level section when undefined', () => {
      const eventWithoutEC = { ...mockFeedingEvent, ecLevel: undefined };
      render(<FeedingEventItem event={eventWithoutEC} />);
      expect(screen.queryByText(/EC:/i)).not.toBeInTheDocument();
    });

    it('does not display pH level section when undefined', () => {
      const eventWithoutPH = { ...mockFeedingEvent, phLevel: undefined };
      render(<FeedingEventItem event={eventWithoutPH} />);
      expect(screen.queryByText(/pH:/i)).not.toBeInTheDocument();
    });

    it('does not display EC/pH section when both are undefined', () => {
      const eventWithoutLevels = { ...mockFeedingEvent, ecLevel: undefined, phLevel: undefined };
      render(<FeedingEventItem event={eventWithoutLevels} />);
      expect(screen.queryByText(/EC:/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/pH:/i)).not.toBeInTheDocument();
    });

    it('displays EC level even when zero', () => {
      const eventWithZeroEC = { ...mockFeedingEvent, ecLevel: 0 };
      render(<FeedingEventItem event={eventWithZeroEC} />);
      expect(screen.getByText(/EC:/i)).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('displays pH level even when zero', () => {
      const eventWithZeroPH = { ...mockFeedingEvent, phLevel: 0 };
      render(<FeedingEventItem event={eventWithZeroPH} />);
      expect(screen.getByText(/pH:/i)).toBeInTheDocument();
    });

    it('does not display nutrient mix section when undefined', () => {
      const eventWithoutMix = { ...mockFeedingEvent, nutrientMix: undefined };
      render(<FeedingEventItem event={eventWithoutMix} />);
      expect(screen.queryByText(/Mix:/i)).not.toBeInTheDocument();
    });

    it('does not display notes section when undefined', () => {
      const eventWithoutNotes = { ...mockFeedingEvent, notes: undefined };
      render(<FeedingEventItem event={eventWithoutNotes} />);
      expect(screen.queryByText('Fed with grow nutrients')).not.toBeInTheDocument();
    });

    it('renders with minimal data', () => {
      const minimalEvent: FeedingEvent = {
        id: 'feeding-1',
        plantId: 'plant-1',
        feedingType: 'watering',
        amountMl: 300,
        fedAt: '2025-01-05T10:00:00Z',
        createdAt: '2025-01-05T10:00:00Z',
        updatedAt: '2025-01-05T10:00:00Z',
      };

      render(<FeedingEventItem event={minimalEvent} />);
      expect(screen.getByText('watering')).toBeInTheDocument();
      expect(screen.getByText('300 ml')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats timestamp correctly', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      const timeElement = screen.getByText(/jan 05, 2025 10:00 am/i);
      expect(timeElement.tagName).toBe('TIME');
    });

    it('handles invalid date gracefully', () => {
      const eventWithInvalidDate = { ...mockFeedingEvent, fedAt: 'invalid-date' };
      render(<FeedingEventItem event={eventWithInvalidDate} />);
      expect(screen.getByText(/date unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Badge Colors', () => {
    it('applies info color for watering', () => {
      const wateringEvent = { ...mockFeedingEvent, feedingType: 'watering' as const };
      render(<FeedingEventItem event={wateringEvent} />);
      const badge = screen.getByText('watering');
      expect(badge).toBeInTheDocument();
    });

    it('applies success color for foliar', () => {
      const foliarEvent = { ...mockFeedingEvent, feedingType: 'foliar' as const };
      render(<FeedingEventItem event={foliarEvent} />);
      const badge = screen.getByText('foliar');
      expect(badge).toBeInTheDocument();
    });

    it('applies secondary color for nutrients', () => {
      const nutrientsEvent = { ...mockFeedingEvent, feedingType: 'nutrients' as const };
      render(<FeedingEventItem event={nutrientsEvent} />);
      const badge = screen.getByText('nutrients');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies hover effect class', () => {
      const { container } = render(<FeedingEventItem event={mockFeedingEvent} />);
      const card = container.querySelector('.hover\\:bg-accent\\/50');
      expect(card).toBeInTheDocument();
    });

    it('capitalizes feeding type badge', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      const badge = screen.getByText('nutrients');
      expect(badge).toHaveClass('capitalize');
    });

    it('preserves whitespace in notes', () => {
      const eventWithMultilineNotes = {
        ...mockFeedingEvent,
        notes: 'Line 1\nLine 2\nLine 3',
      };
      render(<FeedingEventItem event={eventWithMultilineNotes} />);
      const notesElement = screen.getByText(/Line 1/);
      expect(notesElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Icons', () => {
    it('displays Droplets icon for watering', () => {
      const wateringEvent = { ...mockFeedingEvent, feedingType: 'watering' as const };
      const { container } = render(<FeedingEventItem event={wateringEvent} />);
      const icon = container.querySelector('.text-blue-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays Leaf icon for foliar', () => {
      const foliarEvent = { ...mockFeedingEvent, feedingType: 'foliar' as const };
      const { container } = render(<FeedingEventItem event={foliarEvent} />);
      const icon = container.querySelector('.text-green-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays Beaker icon for nutrients', () => {
      const nutrientsEvent = { ...mockFeedingEvent, feedingType: 'nutrients' as const };
      const { container } = render(<FeedingEventItem event={nutrientsEvent} />);
      const icon = container.querySelector('.text-purple-600');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic time element for timestamp', () => {
      render(<FeedingEventItem event={mockFeedingEvent} />);
      const timeElement = screen.getByText(/jan 05, 2025 10:00 am/i);
      expect(timeElement.tagName).toBe('TIME');
    });
  });
});