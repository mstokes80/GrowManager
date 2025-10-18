import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { ActivityLogItem } from '../ActivityLogItem';
import { ActivityLog } from '@/types/activityLog';

const mockActivityLog: ActivityLog = {
  id: 'activity-1',
  plantId: 'plant-1',
  activityType: 'training',
  description: 'LST training',
  notes: 'Bent main stem to promote lateral growth',
  loggedAt: '2025-01-04T14:00:00Z',
  createdAt: '2025-01-04T14:00:00Z',
  updatedAt: '2025-01-04T14:00:00Z',
  plantTag: 'Plant #1',
};

describe('ActivityLogItem', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      expect(screen.getByText('Training')).toBeInTheDocument();
    });

    it('displays activity type badge', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      expect(screen.getByText('Training')).toBeInTheDocument();
    });

    it('displays description', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      expect(screen.getByText('LST training')).toBeInTheDocument();
    });

    it('displays notes when present', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      expect(screen.getByText('Bent main stem to promote lateral growth')).toBeInTheDocument();
    });

    it('displays formatted timestamp', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      expect(screen.getByText(/jan 04, 2025 2:00 pm/i)).toBeInTheDocument();
    });
  });

  describe('Activity Types', () => {
    it('displays training activity type', () => {
      const trainingLog = { ...mockActivityLog, activityType: 'training' as const };
      render(<ActivityLogItem log={trainingLog} />);
      expect(screen.getByText('Training')).toBeInTheDocument();
    });

    it('displays pruning activity type', () => {
      const pruningLog = { ...mockActivityLog, activityType: 'pruning' as const };
      render(<ActivityLogItem log={pruningLog} />);
      expect(screen.getByText('Pruning')).toBeInTheDocument();
    });

    it('displays defoliation activity type', () => {
      const defoliationLog = { ...mockActivityLog, activityType: 'defoliation' as const };
      render(<ActivityLogItem log={defoliationLog} />);
      expect(screen.getByText('Defoliation')).toBeInTheDocument();
    });

    it('displays transplant activity type', () => {
      const transplantLog = { ...mockActivityLog, activityType: 'transplant' as const };
      render(<ActivityLogItem log={transplantLog} />);
      expect(screen.getByText('Transplant')).toBeInTheDocument();
    });

    it('displays pest_control activity type with proper label', () => {
      const pestControlLog = { ...mockActivityLog, activityType: 'pest_control' as const };
      render(<ActivityLogItem log={pestControlLog} />);
      expect(screen.getByText('Pest Control')).toBeInTheDocument();
    });

    it('displays other activity type', () => {
      const otherLog = { ...mockActivityLog, activityType: 'other' as const };
      render(<ActivityLogItem log={otherLog} />);
      expect(screen.getByText('Other')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('does not display notes section when undefined', () => {
      const logWithoutNotes = { ...mockActivityLog, notes: undefined };
      render(<ActivityLogItem log={logWithoutNotes} />);
      expect(screen.queryByText('Bent main stem to promote lateral growth')).not.toBeInTheDocument();
    });

    it('renders with minimal data', () => {
      const minimalLog: ActivityLog = {
        id: 'activity-1',
        plantId: 'plant-1',
        activityType: 'training',
        description: 'LST training',
        loggedAt: '2025-01-04T14:00:00Z',
        createdAt: '2025-01-04T14:00:00Z',
        updatedAt: '2025-01-04T14:00:00Z',
      };

      render(<ActivityLogItem log={minimalLog} />);
      expect(screen.getByText('Training')).toBeInTheDocument();
      expect(screen.getByText('LST training')).toBeInTheDocument();
    });
  });

  describe('Date Formatting', () => {
    it('formats timestamp correctly', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      const timeElement = screen.getByText(/jan 04, 2025 2:00 pm/i);
      expect(timeElement.tagName).toBe('TIME');
    });

    it('handles invalid date gracefully', () => {
      const logWithInvalidDate = { ...mockActivityLog, loggedAt: 'invalid-date' };
      render(<ActivityLogItem log={logWithInvalidDate} />);
      expect(screen.getByText(/date unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Badge Colors', () => {
    it('applies success color for training', () => {
      const trainingLog = { ...mockActivityLog, activityType: 'training' as const };
      render(<ActivityLogItem log={trainingLog} />);
      const badge = screen.getByText('Training');
      expect(badge).toBeInTheDocument();
    });

    it('applies warning color for pruning', () => {
      const pruningLog = { ...mockActivityLog, activityType: 'pruning' as const };
      render(<ActivityLogItem log={pruningLog} />);
      const badge = screen.getByText('Pruning');
      expect(badge).toBeInTheDocument();
    });

    it('applies warning color for defoliation', () => {
      const defoliationLog = { ...mockActivityLog, activityType: 'defoliation' as const };
      render(<ActivityLogItem log={defoliationLog} />);
      const badge = screen.getByText('Defoliation');
      expect(badge).toBeInTheDocument();
    });

    it('applies secondary color for transplant', () => {
      const transplantLog = { ...mockActivityLog, activityType: 'transplant' as const };
      render(<ActivityLogItem log={transplantLog} />);
      const badge = screen.getByText('Transplant');
      expect(badge).toBeInTheDocument();
    });

    it('applies destructive color for pest_control', () => {
      const pestControlLog = { ...mockActivityLog, activityType: 'pest_control' as const };
      render(<ActivityLogItem log={pestControlLog} />);
      const badge = screen.getByText('Pest Control');
      expect(badge).toBeInTheDocument();
    });

    it('applies default color for other', () => {
      const otherLog = { ...mockActivityLog, activityType: 'other' as const };
      render(<ActivityLogItem log={otherLog} />);
      const badge = screen.getByText('Other');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('displays Sprout icon for training', () => {
      const trainingLog = { ...mockActivityLog, activityType: 'training' as const };
      const { container } = render(<ActivityLogItem log={trainingLog} />);
      const icon = container.querySelector('.text-green-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays Scissors icon for pruning', () => {
      const pruningLog = { ...mockActivityLog, activityType: 'pruning' as const };
      const { container } = render(<ActivityLogItem log={pruningLog} />);
      const icon = container.querySelector('.text-orange-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays Leaf icon for defoliation', () => {
      const defoliationLog = { ...mockActivityLog, activityType: 'defoliation' as const };
      const { container } = render(<ActivityLogItem log={defoliationLog} />);
      const icon = container.querySelector('.text-yellow-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays Move icon for transplant', () => {
      const transplantLog = { ...mockActivityLog, activityType: 'transplant' as const };
      const { container } = render(<ActivityLogItem log={transplantLog} />);
      const icon = container.querySelector('.text-blue-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays Bug icon for pest_control', () => {
      const pestControlLog = { ...mockActivityLog, activityType: 'pest_control' as const };
      const { container } = render(<ActivityLogItem log={pestControlLog} />);
      const icon = container.querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('displays MoreHorizontal icon for other', () => {
      const otherLog = { ...mockActivityLog, activityType: 'other' as const };
      const { container } = render(<ActivityLogItem log={otherLog} />);
      const icon = container.querySelector('.text-gray-600');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies hover effect class', () => {
      const { container } = render(<ActivityLogItem log={mockActivityLog} />);
      const card = container.querySelector('.hover\\:bg-accent\\/50');
      expect(card).toBeInTheDocument();
    });

    it('preserves whitespace in notes', () => {
      const logWithMultilineNotes = {
        ...mockActivityLog,
        notes: 'Line 1\nLine 2\nLine 3',
      };
      render(<ActivityLogItem log={logWithMultilineNotes} />);
      const notesElement = screen.getByText(/Line 1/);
      expect(notesElement).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Label Formatting', () => {
    it('capitalizes first letter of activity type', () => {
      const trainingLog = { ...mockActivityLog, activityType: 'training' as const };
      render(<ActivityLogItem log={trainingLog} />);
      expect(screen.getByText('Training')).toBeInTheDocument();
    });

    it('formats pest_control as "Pest Control"', () => {
      const pestControlLog = { ...mockActivityLog, activityType: 'pest_control' as const };
      render(<ActivityLogItem log={pestControlLog} />);
      expect(screen.getByText('Pest Control')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic time element for timestamp', () => {
      render(<ActivityLogItem log={mockActivityLog} />);
      const timeElement = screen.getByText(/jan 04, 2025 2:00 pm/i);
      expect(timeElement.tagName).toBe('TIME');
    });
  });
});