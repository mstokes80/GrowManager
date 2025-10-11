import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CultivarForm } from '@/components/cultivars/CultivarForm';
import { Cultivar } from '@/services/cultivarsApi';

const mockCultivar: Cultivar = {
  id: '1',
  userId: 'user-1',
  name: 'Blue Dream',
  breeder: 'Humboldt Seed Organization',
  genetics: 'Blueberry x Haze',
  type: 'hybrid',
  characteristics: {
    flowering_time: '8-9 weeks',
    yield: 'high',
  },
  notes: 'Great strain',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
};

describe('CultivarForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields', () => {
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} />);

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/breeder/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/genetics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/characteristics/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
  });

  it('shows validation error when name is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} />);

    const submitButton = screen.getByRole('button', { name: /create cultivar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when name exceeds 255 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} />);

    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'a'.repeat(256));

    const submitButton = screen.getByRole('button', { name: /create cultivar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/name must be 255 characters or less/i)).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits form with valid data for create mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} />);

    // Fill in required fields
    const nameInput = screen.getByLabelText(/name/i);
    await user.type(nameInput, 'Blue Dream');

    // Select type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    await user.click(typeSelect);
    const hybridOption = await screen.findByRole('option', { name: /hybrid/i });
    await user.click(hybridOption);

    const submitButton = screen.getByRole('button', { name: /create cultivar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Blue Dream',
          type: 'hybrid',
        })
      );
    });
  });

  it('submits form with all optional fields filled', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} />);

    // Fill in all fields
    await user.type(screen.getByLabelText(/name/i), 'Blue Dream');
    await user.type(screen.getByLabelText(/breeder/i), 'Humboldt');
    await user.type(screen.getByLabelText(/genetics/i), 'Blueberry x Haze');
    await user.type(screen.getByLabelText(/notes/i), 'Great strain');
    await user.type(screen.getByLabelText(/characteristics/i), '{"flowering_time": "8 weeks"}');

    // Select type
    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    await user.click(typeSelect);
    const sativaOption = await screen.findByRole('option', { name: /^sativa$/i });
    await user.click(sativaOption);

    const submitButton = screen.getByRole('button', { name: /create cultivar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Blue Dream',
        breeder: 'Humboldt',
        genetics: 'Blueberry x Haze',
        type: 'sativa',
        characteristics: '{"flowering_time": "8 weeks"}',
        notes: 'Great strain',
      });
    });
  });

  it('populates form fields when cultivar is provided for edit mode', () => {
    const onSubmit = vi.fn();

    render(<CultivarForm cultivar={mockCultivar} onSubmit={onSubmit} />);

    expect(screen.getByDisplayValue('Blue Dream')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Humboldt Seed Organization')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Blueberry x Haze')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Great strain')).toBeInTheDocument();

    // Check if submit button text changes for edit mode
    expect(screen.getByRole('button', { name: /update cultivar/i })).toBeInTheDocument();
  });

  it('displays cancel button when onCancel is provided', () => {
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} onCancel={onCancel} />);

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onCancel = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} onCancel={onCancel} />);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables submit button when isSubmitting is true', () => {
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} isSubmitting={true} />);

    const submitButton = screen.getByRole('button', { name: /saving/i });
    expect(submitButton).toBeDisabled();
  });

  it('shows correct button text when submitting', () => {
    const onSubmit = vi.fn();

    const { rerender } = render(<CultivarForm onSubmit={onSubmit} isSubmitting={false} />);

    expect(screen.getByRole('button', { name: /create cultivar/i })).toBeInTheDocument();

    rerender(<CultivarForm onSubmit={onSubmit} isSubmitting={true} />);

    expect(screen.getByRole('button', { name: /saving/i })).toBeInTheDocument();
  });

  it('renders type dropdown with all options', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CultivarForm onSubmit={onSubmit} />);

    const typeSelect = screen.getByRole('combobox', { name: /type/i });
    await user.click(typeSelect);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: /indica/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /^sativa$/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /hybrid/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /auto-flowering/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /unknown/i })).toBeInTheDocument();
    });
  });

  it('allows changing cultivar type', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<CultivarForm cultivar={mockCultivar} onSubmit={onSubmit} />);

    // Current type should be 'hybrid'
    const typeSelect = screen.getByRole('combobox', { name: /type/i });

    await user.click(typeSelect);
    const indicaOption = await screen.findByRole('option', { name: /indica/i });
    await user.click(indicaOption);

    const submitButton = screen.getByRole('button', { name: /update cultivar/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'indica',
        })
      );
    });
  });
});