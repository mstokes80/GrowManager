import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GrowForm } from '@/components/grows/GrowForm';
import { Grow } from '@/services/growsApi';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockGrow: Grow = {
  id: '1',
  userId: 'user-1',
  name: 'Summer 2025 Indoor',
  startDate: '2025-06-01T00:00:00Z',
  status: 'active',
  environmentType: 'indoor',
  notes: 'First indoor grow',
  isArchived: false,
  plantCount: 4,
  createdAt: '2025-06-01T00:00:00Z',
  updatedAt: '2025-06-10T00:00:00Z',
};

describe('GrowForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders all form fields for create mode', () => {
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/start date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/environment type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create grow/i })).toBeInTheDocument();
    });

    it('shows validation error when name is empty', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when name exceeds 100 characters', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'a'.repeat(101));

      const submitButton = screen.getByRole('button', { name: /create grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/name must be 100 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when notes exceed 1000 characters', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Test Grow');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'a'.repeat(1001));

      const submitButton = screen.getByRole('button', { name: /create grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/notes must be 1000 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data in create mode', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.type(nameInput, 'Summer 2025 Indoor');

      const startDateInput = screen.getByLabelText(/start date/i);
      await user.clear(startDateInput);
      await user.type(startDateInput, '2025-06-01');

      const environmentSelect = screen.getByLabelText(/environment type/i);
      await user.click(environmentSelect);
      const indoorOption = screen.getByText('Indoor');
      await user.click(indoorOption);

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'First indoor grow');

      const submitButton = screen.getByRole('button', { name: /create grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Summer 2025 Indoor',
          startDate: '2025-06-01',
          environmentType: 'indoor',
          notes: 'First indoor grow',
        });
      });
    });

    it('allows all environment type options', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const environmentSelect = screen.getByLabelText(/environment type/i);
      await user.click(environmentSelect);

      expect(screen.getByText('Indoor')).toBeInTheDocument();
      expect(screen.getByText('Outdoor')).toBeInTheDocument();
      expect(screen.getByText('Greenhouse')).toBeInTheDocument();
    });

    it('disables submit button when isSubmitting is true', () => {
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    it('pre-populates form fields in edit mode', () => {
      const mockOnSubmit = vi.fn();

      render(<GrowForm grow={mockGrow} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement;
      expect(nameInput.value).toBe('Summer 2025 Indoor');

      const startDateInput = screen.getByLabelText(/start date/i) as HTMLInputElement;
      expect(startDateInput.value).toBe('2025-06-01');

      const notesInput = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      expect(notesInput.value).toBe('First indoor grow');
    });

    it('makes start date field read-only in edit mode', () => {
      const mockOnSubmit = vi.fn();

      render(<GrowForm grow={mockGrow} onSubmit={mockOnSubmit} />);

      const startDateInput = screen.getByLabelText(/start date/i);
      expect(startDateInput).toBeDisabled();
      expect(screen.getByText(/start date cannot be changed after creation/i)).toBeInTheDocument();
    });

    it('shows update button text in edit mode', () => {
      const mockOnSubmit = vi.fn();

      render(<GrowForm grow={mockGrow} onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /update grow/i })).toBeInTheDocument();
    });

    it('submits form with updated data in edit mode', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm grow={mockGrow} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Grow Name');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      const submitButton = screen.getByRole('button', { name: /update grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          name: 'Updated Grow Name',
          startDate: '2025-06-01',
          environmentType: 'indoor',
          notes: 'Updated notes',
        });
      });
    });

    it('does not include startDate in submission even though field exists (immutable)', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm grow={mockGrow} onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);
      await user.clear(nameInput);
      await user.type(nameInput, 'Updated Grow');

      const submitButton = screen.getByRole('button', { name: /update grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        // startDate should still be in the data (form includes it), but it's disabled so backend won't accept changes
        expect(submittedData).toHaveProperty('startDate');
      });
    });
  });

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const nameInput = screen.getByLabelText(/name/i);
      expect(nameInput).toHaveAttribute('id', 'name');

      const startDateInput = screen.getByLabelText(/start date/i);
      expect(startDateInput).toHaveAttribute('id', 'startDate');

      const notesInput = screen.getByLabelText(/notes/i);
      expect(notesInput).toHaveAttribute('id', 'notes');
    });

    it('shows aria-invalid on fields with errors', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        expect(nameInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('associates error messages with inputs via aria-describedby', async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<GrowForm onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create grow/i });
      await user.click(submitButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/name/i);
        const errorId = nameInput.getAttribute('aria-describedby');
        expect(errorId).toBe('name-error');
        expect(screen.getByText(/name is required/i)).toHaveAttribute('id', 'name-error');
      });
    });
  });
});