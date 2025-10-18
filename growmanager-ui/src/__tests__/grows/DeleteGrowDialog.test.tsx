import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DeleteGrowDialog } from '@/components/grows/DeleteGrowDialog';

describe('DeleteGrowDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when isOpen is false', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const { container } = render(
      <DeleteGrowDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders dialog when isOpen is true', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    expect(screen.getByText(/permanently delete test grow/i)).toBeInTheDocument();
    expect(
      screen.getByText(/this action cannot be undone/i)
    ).toBeInTheDocument();
  });

  it('displays warning about data deletion', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    expect(
      screen.getByText(/all plants, photos, and data associated with this grow will be permanently deleted/i)
    ).toBeInTheDocument();
  });

  it('shows input field for grow name confirmation', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    expect(screen.getByLabelText(/type the grow name to confirm/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Test Grow')).toBeInTheDocument();
  });

  it('delete button is disabled when no name is entered', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete forever/i });
    expect(deleteButton).toBeDisabled();
  });

  it('delete button is disabled when incorrect name is entered', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'Wrong Name');

    const deleteButton = screen.getByRole('button', { name: /delete forever/i });
    expect(deleteButton).toBeDisabled();
  });

  it('shows message when name does not match', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'Wrong Name');

    await waitFor(() => {
      expect(
        screen.getByText(/the grow name does not match/i)
      ).toBeInTheDocument();
    });
  });

  it('delete button is enabled when exact name is entered', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'Test Grow');

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete forever/i });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  it('delete button is enabled when name matches case-insensitively', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'test grow');

    await waitFor(() => {
      const deleteButton = screen.getByRole('button', { name: /delete forever/i });
      expect(deleteButton).not.toBeDisabled();
    });
  });

  it('calls onConfirm when delete button is clicked with correct name', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'Test Grow');

    const deleteButton = screen.getByRole('button', { name: /delete forever/i });
    await user.click(deleteButton);

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not call onConfirm when delete button is clicked with incorrect name', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'Wrong Name');

    const deleteButton = screen.getByRole('button', { name: /delete forever/i });
    // Button should be disabled, so click won't work
    expect(deleteButton).toBeDisabled();

    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnConfirm).not.toHaveBeenCalled();
  });

  it('disables all inputs when isDeleting is true', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
        isDeleting={true}
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    expect(nameInput).toBeDisabled();

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeDisabled();

    const deleteButton = screen.getByRole('button', { name: /deleting/i });
    expect(deleteButton).toBeDisabled();
  });

  it('shows "Deleting..." text when isDeleting is true', () => {
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
        isDeleting={true}
      />
    );

    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
  });

  it('resets confirmation name when dialog is closed and reopened', async () => {
    const user = userEvent.setup();
    const mockOnClose = vi.fn();
    const mockOnConfirm = vi.fn();

    const { rerender } = render(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const nameInput = screen.getByLabelText(/type the grow name to confirm/i);
    await user.type(nameInput, 'Test Grow');

    // Close dialog
    rerender(
      <DeleteGrowDialog
        isOpen={false}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    // Reopen dialog
    rerender(
      <DeleteGrowDialog
        isOpen={true}
        onClose={mockOnClose}
        onConfirm={mockOnConfirm}
        growName="Test Grow"
      />
    );

    const newNameInput = screen.getByLabelText(/type the grow name to confirm/i) as HTMLInputElement;
    expect(newNameInput.value).toBe('');
  });
});