import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { LogActivityForm } from '../LogActivityForm';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('LogActivityForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders all form fields', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/activity type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date & time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/additional notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /log activity/i })).toBeInTheDocument();
    });

    it('defaults activity type to other', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/^description/i);
      await user.type(descriptionInput, 'Test activity');

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.activityType).toBe('other');
      });
    });

    it('defaults loggedAt to current date/time', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const loggedAtInput = screen.getByLabelText(/date & time/i) as HTMLInputElement;
      expect(loggedAtInput.value).toBeTruthy();
    });
  });

  describe('Activity Type Selection', () => {
    it('displays all activity type options', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const activityTypeSelect = screen.getByLabelText(/activity type/i);
      await user.click(activityTypeSelect);

      await waitFor(() => {
        expect(screen.getByText(/training \(lst, hst, etc\.\)/i)).toBeInTheDocument();
      });

      expect(screen.getByText('Pruning')).toBeInTheDocument();
      expect(screen.getByText('Defoliation')).toBeInTheDocument();
      expect(screen.getByText('Transplant')).toBeInTheDocument();
      expect(screen.getByText('Pest Control')).toBeInTheDocument();
      expect(screen.getByText('Other')).toBeInTheDocument();
    });

    it('allows selecting training activity', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const activityTypeSelect = screen.getByLabelText(/activity type/i);
      await user.click(activityTypeSelect);

      const trainingOption = screen.getByText(/training \(lst, hst, etc\.\)/i);
      await user.click(trainingOption);

      const descriptionInput = screen.getByLabelText(/^description/i);
      await user.type(descriptionInput, 'LST training');

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.activityType).toBe('training');
      });
    });
  });

  describe('Validation', () => {
    it('validates description is required', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/description is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates description max length', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/^description/i);
      await user.type(descriptionInput, 'a'.repeat(501));

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/description must be 500 characters or less/i)
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('validates notes max length', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/^description/i);
      await user.type(descriptionInput, 'Test activity');

      const notesInput = screen.getByLabelText(/additional notes/i);
      await user.type(notesInput, 'a'.repeat(1001));

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/notes must be 1000 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('submits form with valid data', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const activityTypeSelect = screen.getByLabelText(/activity type/i);
      await user.click(activityTypeSelect);
      const trainingOption = screen.getByText(/training \(lst, hst, etc\.\)/i);
      await user.click(trainingOption);

      const descriptionInput = screen.getByLabelText(/^description/i);
      await user.type(descriptionInput, 'LST training');

      const notesInput = screen.getByLabelText(/additional notes/i);
      await user.type(notesInput, 'Bent main stem to promote lateral growth');

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.activityType).toBe('training');
        expect(submittedData.description).toBe('LST training');
        expect(submittedData.notes).toBe('Bent main stem to promote lateral growth');
        expect(submittedData.loggedAt).toBeTruthy();
      });
    });

    it('submits form with minimal data', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/^description/i);
      await user.type(descriptionInput, 'Test activity');

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('Form Actions', () => {
    it('disables submit button when isSubmitting is true', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /logging/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(
        <LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const descriptionInput = screen.getByLabelText(/^description/i);
      expect(descriptionInput).toHaveAttribute('id', 'description');

      const loggedAtInput = screen.getByLabelText(/date & time/i);
      expect(loggedAtInput).toHaveAttribute('id', 'loggedAt');

      const notesInput = screen.getByLabelText(/additional notes/i);
      expect(notesInput).toHaveAttribute('id', 'notes');
    });

    it('shows aria-invalid on fields with errors', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText(/^description/i);
        expect(descriptionInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('associates error messages with inputs via aria-describedby', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /log activity/i });
      await user.click(submitButton);

      await waitFor(() => {
        const descriptionInput = screen.getByLabelText(/^description/i);
        const errorId = descriptionInput.getAttribute('aria-describedby');
        expect(errorId).toBe('description-error');
        expect(screen.getByText(/description is required/i)).toHaveAttribute(
          'id',
          'description-error'
        );
      });
    });

    it('marks required fields with asterisk', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/activity type/i).parentElement).toContainHTML('*');
      expect(screen.getByText(/^description/i).parentElement).toContainHTML('*');
      expect(screen.getByText(/date & time/i).parentElement).toContainHTML('*');
    });
  });

  describe('Helper Text', () => {
    it('displays description helper text', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/briefly describe the activity performed/i)).toBeInTheDocument();
    });

    it('displays notes max length helper text', () => {
      const mockOnSubmit = vi.fn();

      render(<LogActivityForm plantId="plant-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/maximum 1000 characters/i)).toBeInTheDocument();
    });
  });
});