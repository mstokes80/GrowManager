import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { TimeRangeSelector, TimeRange } from '../filters/TimeRangeSelector';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

describe('TimeRangeSelector', () => {
  let mockOnChange: ReturnType<typeof vi.fn>;
  let defaultValue: TimeRange;

  beforeEach(() => {
    mockOnChange = vi.fn();
    defaultValue = {
      from: startOfDay(subDays(new Date(), 6)),
      to: endOfDay(new Date()),
      label: 'Last 7 days',
    };
    vi.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders with current value label', () => {
      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('shows date range on mobile view', () => {
      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const fromDate = format(defaultValue.from, 'MMM d');
      const toDate = format(defaultValue.to, 'MMM d');
      const mobileDisplay = `${fromDate} - ${toDate}`;

      // The mobile display text should be in the document
      const mobileElement = document.querySelector('.sm\\:hidden');
      expect(mobileElement?.textContent).toBe(mobileDisplay);
    });

    it('renders calendar icon', () => {
      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('renders as disabled when disabled prop is true', () => {
      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          disabled={true}
        />
      );

      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('applies custom className', () => {
      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          className="custom-class"
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('custom-class');
    });
  });

  describe('Preset Selection', () => {
    it('shows default presets when clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Last 7 days')).toBeInTheDocument();
        expect(screen.getByText('Last 30 days')).toBeInTheDocument();
        expect(screen.getByText('Last 90 days')).toBeInTheDocument();
        expect(screen.getByText('All time')).toBeInTheDocument();
      });
    });

    it('calls onChange with 7 days range when Last 7 days is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const preset7Days = await screen.findByRole('button', { name: 'Last 7 days' });
      await user.click(preset7Days);

      expect(mockOnChange).toHaveBeenCalledWith({
        from: expect.any(Date),
        to: expect.any(Date),
        label: 'Last 7 days',
      });

      const call = mockOnChange.mock.calls[0]![0];
      const daysDiff = Math.ceil((call.to - call.from) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(7);
    });

    it('calls onChange with 30 days range when Last 30 days is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const preset30Days = await screen.findByRole('button', { name: 'Last 30 days' });
      await user.click(preset30Days);

      expect(mockOnChange).toHaveBeenCalledWith({
        from: expect.any(Date),
        to: expect.any(Date),
        label: 'Last 30 days',
      });

      const call = mockOnChange.mock.calls[0]![0];
      const daysDiff = Math.ceil((call.to - call.from) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(30);
    });

    it('calls onChange with 90 days range when Last 90 days is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const preset90Days = await screen.findByRole('button', { name: 'Last 90 days' });
      await user.click(preset90Days);

      expect(mockOnChange).toHaveBeenCalledWith({
        from: expect.any(Date),
        to: expect.any(Date),
        label: 'Last 90 days',
      });

      const call = mockOnChange.mock.calls[0]![0];
      const daysDiff = Math.ceil((call.to - call.from) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(90);
    });

    it('highlights active preset', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const preset7Days = await screen.findByRole('button', { name: 'Last 7 days' });
      expect(preset7Days.className).not.toContain('ghost');
    });

    it('uses custom presets when provided', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      const customPresets = [
        { label: 'Today', days: 1 },
        { label: 'This Week', days: 7 },
        { label: 'This Month', days: 30 },
      ];

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          presets={customPresets}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Today')).toBeInTheDocument();
        expect(screen.getByText('This Week')).toBeInTheDocument();
        expect(screen.getByText('This Month')).toBeInTheDocument();
        expect(screen.queryByText('Last 90 days')).not.toBeInTheDocument();
      });
    });

    it('handles custom date ranges in presets', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      const customFrom = new Date('2024-01-01');
      const customTo = new Date('2024-01-31');

      const customPresets = [
        {
          label: 'January 2024',
          from: customFrom,
          to: customTo
        },
      ];

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          presets={customPresets}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const presetButton = await screen.findByRole('button', { name: 'January 2024' });
      await user.click(presetButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        from: customFrom,
        to: customTo,
        label: 'January 2024',
      });
    });

    it('closes popover after selecting a preset', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const preset30Days = await screen.findByRole('button', { name: 'Last 30 days' });
      await user.click(preset30Days);

      // Check that button state changed to closed
      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'closed');
      });
    });
  });

  describe('Custom Range Selection', () => {
    it('shows custom range inputs when showCustom is true', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Custom Range')).toBeInTheDocument();
        expect(screen.getByLabelText('From')).toBeInTheDocument();
        expect(screen.getByLabelText('To')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /apply custom range/i })).toBeInTheDocument();
      });
    });

    it('does not show custom range inputs when showCustom is false', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={false}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.queryByText('Custom Range')).not.toBeInTheDocument();
      });
    });

    it('applies custom date range when Apply is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const fromInput = await screen.findByLabelText('From');
      const toInput = await screen.findByLabelText('To');

      await user.clear(fromInput);
      await user.type(fromInput, '2024-01-01');
      await user.clear(toInput);
      await user.type(toInput, '2024-01-31');

      const applyButton = screen.getByRole('button', { name: /apply custom range/i });
      await user.click(applyButton);

      expect(mockOnChange).toHaveBeenCalledWith({
        from: startOfDay(new Date('2024-01-01')),
        to: endOfDay(new Date('2024-01-31')),
        label: 'Jan 1, 2024 - Jan 31, 2024',
      });
    });

    it('disables apply button when dates are not selected', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const fromInput = await screen.findByLabelText('From');
      await user.clear(fromInput);

      const applyButton = screen.getByRole('button', { name: /apply custom range/i });
      expect(applyButton).toBeDisabled();
    });

    it('enforces max date constraint on To input', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const toInput = await screen.findByLabelText('To') as HTMLInputElement;
      const maxDate = format(new Date(), 'yyyy-MM-dd');
      expect(toInput.getAttribute('max')).toBe(maxDate);
    });

    it('enforces min date constraint on To input based on From date', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const fromInput = await screen.findByLabelText('From');
      await user.clear(fromInput);
      await user.type(fromInput, '2024-01-15');

      const toInput = await screen.findByLabelText('To') as HTMLInputElement;
      expect(toInput.getAttribute('min')).toBe('2024-01-15');
    });

    it('enforces max date constraint on From input based on To date', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const toInput = await screen.findByLabelText('To');
      await user.clear(toInput);
      await user.type(toInput, '2024-01-20');

      const fromInput = await screen.findByLabelText('From') as HTMLInputElement;
      expect(fromInput.getAttribute('max')).toBe('2024-01-20');
    });

    it('closes popover after applying custom range', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          showCustom={true}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const fromInput = await screen.findByLabelText('From');
      const toInput = await screen.findByLabelText('To');

      await user.clear(fromInput);
      await user.type(fromInput, '2024-01-01');
      await user.clear(toInput);
      await user.type(toInput, '2024-01-31');

      const applyButton = screen.getByRole('button', { name: /apply custom range/i });
      await user.click(applyButton);

      // Check that button state changed to closed
      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'closed');
      });
    });
  });

  describe('Popover Behavior', () => {
    it('opens popover when button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('Last 30 days')).toBeInTheDocument();
        expect(button).toHaveAttribute('data-state', 'open');
      });
    });

    it('closes popover when clicking outside', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <div>
          <TimeRangeSelector
            value={defaultValue}
            onChange={mockOnChange}
          />
          <div data-testid="outside">Outside Element</div>
        </div>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'open');
      });

      const outsideElement = screen.getByTestId('outside');
      await user.click(outsideElement);

      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'closed');
      });
    });

    it('toggles popover when button is clicked multiple times', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
        />
      );

      const button = screen.getByRole('button');

      // Open
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'open');
      });

      // Close
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'closed');
      });

      // Open again
      await user.click(button);
      await waitFor(() => {
        expect(button).toHaveAttribute('data-state', 'open');
      });
    });
  });

  describe('Edge Cases', () => {
    it('handles undefined presets array', () => {
      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          presets={undefined}
        />
      );

      expect(screen.getByText('Last 7 days')).toBeInTheDocument();
    });

    it('handles empty presets array', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          presets={[]}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      // Should not show any preset buttons (except the main button)
      await waitFor(() => {
        const buttons = screen.queryAllByRole('button');
        // Should only have the trigger button
        expect(buttons.length).toBe(1);
      });
    });

    it('handles preset without days or date range', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      const invalidPresets = [
        { label: 'Invalid Preset' },
      ];

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          presets={invalidPresets}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const presetButton = await screen.findByRole('button', { name: 'Invalid Preset' });
      await user.click(presetButton);

      // Should default to last 7 days
      expect(mockOnChange).toHaveBeenCalled();
      const call = mockOnChange.mock.calls[0]![0];
      const daysDiff = Math.ceil((call.to - call.from) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBeLessThanOrEqual(7);
    });

    it('does not crash with very large day values', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      const largePresets = [
        { label: '100 Years', days: 36500 },
      ];

      render(
        <TimeRangeSelector
          value={defaultValue}
          onChange={mockOnChange}
          presets={largePresets}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      const presetButton = await screen.findByRole('button', { name: '100 Years' });
      await user.click(presetButton);

      expect(mockOnChange).toHaveBeenCalled();
    });
  });
});