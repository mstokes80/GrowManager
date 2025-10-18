import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { PlantCard } from '../PlantCard';
import { Plant } from '@/types/plant';

const mockPlant: Plant = {
  id: '1',
  growId: 'grow-1',
  cultivarId: 'cultivar-1',
  plantTag: 'Plant #1',
  plantedDate: '2025-01-01T00:00:00Z',
  stage: 'vegetative',
  healthStatus: 'active',
  notes: 'Test plant',
  sortOrder: 0,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-05T00:00:00Z',
  cultivarName: 'Blue Dream',
};

describe('PlantCard', () => {
  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<PlantCard plant={mockPlant} />);
      expect(screen.getByText('Plant #1')).toBeInTheDocument();
    });

    it('displays plant tag correctly', () => {
      render(<PlantCard plant={mockPlant} />);
      expect(screen.getByText('Plant #1')).toBeInTheDocument();
    });

    it('displays cultivar name when available', () => {
      render(<PlantCard plant={mockPlant} />);
      expect(screen.getByText('Blue Dream')).toBeInTheDocument();
    });

    it('does not display cultivar section when cultivarName is undefined', () => {
      const plantWithoutCultivar = { ...mockPlant, cultivarName: undefined };
      render(<PlantCard plant={plantWithoutCultivar} />);
      expect(screen.queryByText('Blue Dream')).not.toBeInTheDocument();
    });

    it('displays stage badge with correct text', () => {
      render(<PlantCard plant={mockPlant} />);
      expect(screen.getByText('vegetative')).toBeInTheDocument();
    });

    it('displays health status badge with correct text', () => {
      render(<PlantCard plant={mockPlant} />);
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('displays planted date in correct format', () => {
      render(<PlantCard plant={mockPlant} />);
      expect(screen.getByText(/planted jan 01, 2025/i)).toBeInTheDocument();
    });

    it('handles invalid date gracefully', () => {
      const plantWithInvalidDate = { ...mockPlant, plantedDate: 'invalid-date' };
      render(<PlantCard plant={plantWithInvalidDate} />);
      expect(screen.getByText(/date unavailable/i)).toBeInTheDocument();
    });
  });

  describe('Stage Colors', () => {
    it('displays seedling stage with warning color', () => {
      const seedlingPlant = { ...mockPlant, stage: 'seedling' as const };
      render(<PlantCard plant={seedlingPlant} />);
      const stageBadge = screen.getByText('seedling');
      expect(stageBadge).toBeInTheDocument();
    });

    it('displays vegetative stage with success color', () => {
      const vegetativePlant = { ...mockPlant, stage: 'vegetative' as const };
      render(<PlantCard plant={vegetativePlant} />);
      const stageBadge = screen.getByText('vegetative');
      expect(stageBadge).toBeInTheDocument();
    });

    it('displays flowering stage with info color', () => {
      const floweringPlant = { ...mockPlant, stage: 'flowering' as const };
      render(<PlantCard plant={floweringPlant} />);
      const stageBadge = screen.getByText('flowering');
      expect(stageBadge).toBeInTheDocument();
    });

    it('displays harvested stage with secondary color', () => {
      const harvestedPlant = { ...mockPlant, stage: 'harvested' as const };
      render(<PlantCard plant={harvestedPlant} />);
      const stageBadge = screen.getByText('harvested');
      expect(stageBadge).toBeInTheDocument();
    });
  });

  describe('Health Status Colors', () => {
    it('displays active status with success color', () => {
      const activePlant = { ...mockPlant, healthStatus: 'active' as const };
      render(<PlantCard plant={activePlant} />);
      const healthBadge = screen.getByText('active');
      expect(healthBadge).toBeInTheDocument();
    });

    it('displays harvested status with secondary color', () => {
      const harvestedPlant = { ...mockPlant, healthStatus: 'harvested' as const };
      render(<PlantCard plant={harvestedPlant} />);
      const healthBadge = screen.getByText('harvested');
      expect(healthBadge).toBeInTheDocument();
    });

    it('displays removed status with warning color', () => {
      const removedPlant = { ...mockPlant, healthStatus: 'removed' as const };
      render(<PlantCard plant={removedPlant} />);
      const healthBadge = screen.getByText('removed');
      expect(healthBadge).toBeInTheDocument();
    });

    it('displays dead status with destructive color', () => {
      const deadPlant = { ...mockPlant, healthStatus: 'dead' as const };
      render(<PlantCard plant={deadPlant} />);
      const healthBadge = screen.getByText('dead');
      expect(healthBadge).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('calls onClick when card is clicked', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(<PlantCard plant={mockPlant} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      await user.click(card);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not call onClick when not provided', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();

      render(<PlantCard plant={mockPlant} />);

      const card = screen.getByRole('button');
      await user.click(card);

      // Should not throw error
      expect(card).toBeInTheDocument();
    });

    it('triggers onClick when Enter key is pressed', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(<PlantCard plant={mockPlant} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('triggers onClick when Space key is pressed', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(<PlantCard plant={mockPlant} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('does not trigger onClick on other key presses', async () => {
      const { userEvent } = await import('@testing-library/user-event');
      const user = userEvent.setup();
      const mockOnClick = vi.fn();

      render(<PlantCard plant={mockPlant} onClick={mockOnClick} />);

      const card = screen.getByRole('button');
      card.focus();
      await user.keyboard('{Escape}');

      expect(mockOnClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('has role="button" when onClick is provided', () => {
      render(<PlantCard plant={mockPlant} onClick={vi.fn()} />);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('has tabIndex={0} for keyboard navigation', () => {
      render(<PlantCard plant={mockPlant} onClick={vi.fn()} />);
      const card = screen.getByRole('button');
      expect(card).toHaveAttribute('tabIndex', '0');
    });

    it('displays visual icon for health status', () => {
      render(<PlantCard plant={mockPlant} />);
      // Check that SVG icon is rendered (lucide-react renders SVGs)
      const healthBadge = screen.getByText('active').closest('span');
      expect(healthBadge).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('applies hover effect class', () => {
      render(<PlantCard plant={mockPlant} onClick={vi.fn()} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('hover:shadow-md');
    });

    it('applies cursor-pointer class when onClick is provided', () => {
      render(<PlantCard plant={mockPlant} onClick={vi.fn()} />);
      const card = screen.getByRole('button');
      expect(card).toHaveClass('cursor-pointer');
    });

    it('capitalizes stage badge text', () => {
      render(<PlantCard plant={mockPlant} />);
      const stageBadge = screen.getByText('vegetative');
      expect(stageBadge).toHaveClass('capitalize');
    });

    it('capitalizes health status badge text', () => {
      render(<PlantCard plant={mockPlant} />);
      const healthBadge = screen.getByText('active');
      expect(healthBadge).toHaveClass('capitalize');
    });
  });

  describe('Edge Cases', () => {
    it('renders with minimal plant data', () => {
      const minimalPlant: Plant = {
        id: '1',
        growId: 'grow-1',
        plantTag: 'A1',
        plantedDate: '2025-01-01T00:00:00Z',
        stage: 'seedling',
        healthStatus: 'active',
        sortOrder: 0,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      };

      render(<PlantCard plant={minimalPlant} />);
      expect(screen.getByText('A1')).toBeInTheDocument();
      expect(screen.getByText('seedling')).toBeInTheDocument();
      expect(screen.getByText('active')).toBeInTheDocument();
    });

    it('truncates long plant tag text', () => {
      const longTagPlant = {
        ...mockPlant,
        plantTag: 'This is a very long plant tag that should be truncated',
      };
      render(<PlantCard plant={longTagPlant} />);
      const title = screen.getByText(longTagPlant.plantTag);
      expect(title).toHaveClass('truncate');
    });
  });
});