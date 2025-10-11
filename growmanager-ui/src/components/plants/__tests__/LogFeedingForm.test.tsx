import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { LogFeedingForm } from '../LogFeedingForm';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('LogFeedingForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/feeding type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/amount \(ml\)/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ec level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/ph level/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nutrient mix/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log feeding/i })).toBeInTheDocument();
    });

    it('defaults feeding type to watering', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '500');

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.feedingType).toBe('watering');
      });
    });

    it('defaults fedAt to current date/time', () => {
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const fedAtInput = screen.getByLabelText(/date & time/i) as HTMLInputElement;
      expect(fedAtInput.value).toBeTruthy();
    });
  });

  describe('Feeding Type Selection', () => {
    it('allows selecting watering', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const feedingTypeSelect = screen.getByLabelText(/feeding type/i);
      await user.click(feedingTypeSelect);

      await waitFor(() => {
        expect(screen.getByText('Watering')).toBeInTheDocument();
      });
    });

    it('allows selecting nutrients', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const feedingTypeSelect = screen.getByLabelText(/feeding type/i);
      await user.click(feedingTypeSelect);

      await waitFor(() => {
        expect(screen.getByText('Nutrients')).toBeInTheDocument();
      });
    });

    it('allows selecting foliar', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const feedingTypeSelect = screen.getByLabelText(/feeding type/i);
      await user.click(feedingTypeSelect);

      await waitFor(() => {
        expect(screen.getByText('Foliar Feeding')).toBeInTheDocument();
      });
    });
  });

  describe('Validation', () => {
    it('validates amount is required', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be a number/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates amount must be positive', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '-100');

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/amount must be positive/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates EC level is between 0 and 10', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '500');

      const ecInput = screen.getByLabelText(/ec level/i);
      await user.type(ecInput, '15');

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ec must be less than 10/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates pH level is between 0 and 14', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '500');

      const phInput = screen.getByLabelText(/ph level/i);
      await user.type(phInput, '20');

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/ph must be between 0 and 14/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates nutrient mix max length', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '500');

      const nutrientMixInput = screen.getByLabelText(/nutrient mix/i);
      await user.type(nutrientMixInput, 'a'.repeat(201));

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/nutrient mix must be 200 characters or less/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates notes max length', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '500');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'a'.repeat(501));

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/notes must be 500 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const feedingTypeSelect = screen.getByLabelText(/feeding type/i);
      await user.click(feedingTypeSelect);
      const nutrientsOption = screen.getByText('Nutrients');
      await user.click(nutrientsOption);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '500');

      const ecInput = screen.getByLabelText(/ec level/i);
      await user.type(ecInput, '1.5');

      const phInput = screen.getByLabelText(/ph level/i);
      await user.type(phInput, '6.2');

      const nutrientMixInput = screen.getByLabelText(/nutrient mix/i);
      await user.type(nutrientMixInput, 'Grow nutrients');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Test notes');

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.feedingType).toBe('nutrients');
        expect(submittedData.amountMl).toBe(500);
        expect(submittedData.ecLevel).toBe(1.5);
        expect(submittedData.phLevel).toBe(6.2);
        expect(submittedData.nutrientMix).toBe('Grow nutrients');
        expect(submittedData.notes).toBe('Test notes');
        expect(submittedData.fedAt).toBeTruthy();
      });
    });

    it('submits form with minimal data', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      await user.type(amountInput, '300');

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form Actions', () => {
    it('disables submit button when isSubmitting is true', () => {
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /logging/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const amountInput = screen.getByLabelText(/amount \(ml\)/i);
      expect(amountInput).toHaveAttribute('id', 'amountMl');

      const ecInput = screen.getByLabelText(/ec level/i);
      expect(ecInput).toHaveAttribute('id', 'ecLevel');

      const phInput = screen.getByLabelText(/ph level/i);
      expect(phInput).toHaveAttribute('id', 'phLevel');
    });

    it('shows aria-invalid on fields with errors', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount \(ml\)/i);
        expect(amountInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('associates error messages with inputs via aria-describedby', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogFeedingForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /log feeding/i });
      await user.click(submitButton);

      await waitFor(() => {
        const amountInput = screen.getByLabelText(/amount \(ml\)/i);
        const errorId = amountInput.getAttribute('aria-describedby');
        expect(errorId).toBe('amountMl-error');
      });
    });
  });
});