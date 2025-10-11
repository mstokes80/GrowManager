import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils/testUtils';
import { PlantForm } from '../PlantForm';
import { Plant } from '@/types/plant';

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockPlant: Plant = {
  id: '1',
  growId: 'grow-1',
  cultivarId: 'cultivar-1',
  plantTag: 'Plant #1',
  plantedDate: '2025-01-01T00:00:00Z',
  stage: 'vegetative',
  healthStatus: 'healthy',
  notes: 'Test plant notes',
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-05T00:00:00Z',
  cultivarName: 'Blue Dream',
};

describe('PlantForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders all form fields for create mode', async () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant tag/i)).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/cultivar/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/planted date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^stage/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/health status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create plant/i })).toBeInTheDocument();
    });

    it('shows validation error when plant tag is empty', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/plant tag is required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when plant tag exceeds 50 characters', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.type(plantTagInput, 'a'.repeat(51));

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/plant tag must be 50 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows validation error when notes exceed 1000 characters', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.type(plantTagInput, 'Test Plant');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'a'.repeat(1001));

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/notes must be 1000 characters or less/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('submits form with valid data in create mode', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant tag/i)).toBeInTheDocument();
      });

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.type(plantTagInput, 'Plant #1');

      const plantedDateInput = screen.getByLabelText(/planted date/i);
      await user.clear(plantedDateInput);
      await user.type(plantedDateInput, '2025-01-01');

      const stageSelect = screen.getByLabelText(/^stage/i);
      await user.click(stageSelect);
      const vegetativeOption = screen.getByText('Vegetative');
      await user.click(vegetativeOption);

      const healthStatusSelect = screen.getByLabelText(/health status/i);
      await user.click(healthStatusSelect);
      const healthyOption = screen.getByText('Healthy');
      await user.click(healthyOption);

      const notesInput = screen.getByLabelText(/notes/i);
      await user.type(notesInput, 'Test notes');

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          plantTag: 'Plant #1',
          cultivarId: '',
          plantedDate: '2025-01-01',
          stage: 'vegetative',
          healthStatus: 'healthy',
          notes: 'Test notes',
        });
      });
    });

    it('loads cultivars from API', async () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/cultivar/i)).toBeInTheDocument();
      });

      const cultivarSelect = screen.getByLabelText(/cultivar/i);
      expect(cultivarSelect).not.toBeDisabled();
    });

    it('allows selecting cultivar from dropdown', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/cultivar/i)).toBeInTheDocument();
      });

      const cultivarSelect = screen.getByLabelText(/cultivar/i);
      await user.click(cultivarSelect);

      await waitFor(() => {
        expect(screen.getByText('Blue Dream')).toBeInTheDocument();
      });

      expect(screen.getByText('OG Kush')).toBeInTheDocument();
      expect(screen.getByText('No cultivar')).toBeInTheDocument();
    });

    it('allows selecting "No cultivar" option', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/cultivar/i)).toBeInTheDocument();
      });

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.type(plantTagInput, 'Test');

      const cultivarSelect = screen.getByLabelText(/cultivar/i);
      await user.click(cultivarSelect);

      await waitFor(() => {
        expect(screen.getByText('No cultivar')).toBeInTheDocument();
      });

      const noCultivarOption = screen.getByText('No cultivar');
      await user.click(noCultivarOption);

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.cultivarId).toBe('');
      });
    });

    it('shows all stage options', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const stageSelect = screen.getByLabelText(/^stage/i);
      await user.click(stageSelect);

      await waitFor(() => {
        expect(screen.getByText('Seedling')).toBeInTheDocument();
      });

      expect(screen.getByText('Vegetative')).toBeInTheDocument();
      expect(screen.getByText('Flowering')).toBeInTheDocument();
      expect(screen.getByText('Harvested')).toBeInTheDocument();
    });

    it('shows all health status options', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const healthStatusSelect = screen.getByLabelText(/health status/i);
      await user.click(healthStatusSelect);

      await waitFor(() => {
        expect(screen.getByText('Healthy')).toBeInTheDocument();
      });

      expect(screen.getByText('Stressed')).toBeInTheDocument();
      expect(screen.getByText('Sick')).toBeInTheDocument();
      expect(screen.getByText('Dead')).toBeInTheDocument();
    });

    it('disables submit button when isSubmitting is true', () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} isSubmitting={true} />);

      const submitButton = screen.getByRole('button', { name: /saving/i });
      expect(submitButton).toBeDisabled();
    });

    it('calls onCancel when cancel button is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();
      const mockOnCancel = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('does not render cancel button when onCancel is not provided', () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument();
    });
  });

  describe('Edit Mode', () => {
    it('pre-populates form fields in edit mode', async () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm plant={mockPlant} growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        const plantTagInput = screen.getByLabelText(/plant tag/i) as HTMLInputElement;
        expect(plantTagInput.value).toBe('Plant #1');
      });

      const plantedDateInput = screen.getByLabelText(/planted date/i) as HTMLInputElement;
      expect(plantedDateInput.value).toBe('2025-01-01');

      const notesInput = screen.getByLabelText(/notes/i) as HTMLTextAreaElement;
      expect(notesInput.value).toBe('Test plant notes');
    });

    it('shows update button text in edit mode', () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm plant={mockPlant} growId="grow-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByRole('button', { name: /update plant/i })).toBeInTheDocument();
    });

    it('submits form with updated data in edit mode', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm plant={mockPlant} growId="grow-1" onSubmit={mockOnSubmit} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/plant tag/i)).toBeInTheDocument();
      });

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.clear(plantTagInput);
      await user.type(plantTagInput, 'Updated Plant');

      const notesInput = screen.getByLabelText(/notes/i);
      await user.clear(notesInput);
      await user.type(notesInput, 'Updated notes');

      const submitButton = screen.getByRole('button', { name: /update plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.plantTag).toBe('Updated Plant');
        expect(submittedData.notes).toBe('Updated notes');
      });
    });
  });

  describe('Accessibility', () => {
    it('associates labels with form inputs', () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      expect(plantTagInput).toHaveAttribute('id', 'plantTag');

      const plantedDateInput = screen.getByLabelText(/planted date/i);
      expect(plantedDateInput).toHaveAttribute('id', 'plantedDate');

      const notesInput = screen.getByLabelText(/notes/i);
      expect(notesInput).toHaveAttribute('id', 'notes');
    });

    it('shows aria-invalid on fields with errors', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        const plantTagInput = screen.getByLabelText(/plant tag/i);
        expect(plantTagInput).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('associates error messages with inputs via aria-describedby', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        const plantTagInput = screen.getByLabelText(/plant tag/i);
        const errorId = plantTagInput.getAttribute('aria-describedby');
        expect(errorId).toBe('plantTag-error');
        expect(screen.getByText(/plant tag is required/i)).toHaveAttribute('id', 'plantTag-error');
      });
    });

    it('marks required fields with asterisk', () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      expect(screen.getByText(/plant tag/i).parentElement).toContainHTML('*');
      expect(screen.getByText(/planted date/i).parentElement).toContainHTML('*');
      expect(screen.getByText(/^stage/i).parentElement).toContainHTML('*');
      expect(screen.getByText(/health status/i).parentElement).toContainHTML('*');
    });
  });

  describe('Form Behavior', () => {
    it('defaults planted date to today in create mode', () => {
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const plantedDateInput = screen.getByLabelText(/planted date/i) as HTMLInputElement;
      const today = new Date().toISOString().split('T')[0];
      expect(plantedDateInput.value).toBe(today);
    });

    it('defaults stage to seedling in create mode', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.type(plantTagInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.stage).toBe('seedling');
      });
    });

    it('defaults health status to healthy in create mode', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      render(<PlantForm growId="grow-1" onSubmit={mockOnSubmit} />);

      const plantTagInput = screen.getByLabelText(/plant tag/i);
      await user.type(plantTagInput, 'Test');

      const submitButton = screen.getByRole('button', { name: /create plant/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
        const submittedData = mockOnSubmit.mock.calls[0][0];
        expect(submittedData.healthStatus).toBe('healthy');
      });
    });
  });
});