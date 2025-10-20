import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils/testUtils';
import { MetricCard } from '../metrics/MetricCard';
import { Activity } from 'lucide-react';

describe('MetricCard', () => {
  describe('Basic Rendering', () => {
    it('renders title and value', () => {
      render(
        <MetricCard
          title="Total Plants"
          value="42"
        />
      );

      expect(screen.getByText('Total Plants')).toBeInTheDocument();
      expect(screen.getByText('42')).toBeInTheDocument();
    });

    it('renders description when provided', () => {
      render(
        <MetricCard
          title="Total Plants"
          value="42"
          description="Across all grows"
        />
      );

      expect(screen.getByText('Across all grows')).toBeInTheDocument();
    });

    it('renders icon when provided', () => {
      render(
        <MetricCard
          title="Total Plants"
          value="42"
          icon={<Activity data-testid="activity-icon" />}
        />
      );

      expect(screen.getByTestId('activity-icon')).toBeInTheDocument();
    });

    it('renders with number value', () => {
      render(
        <MetricCard
          title="Temperature"
          value={72.5}
        />
      );

      expect(screen.getByText('72.5')).toBeInTheDocument();
    });
  });

  describe('Trend Display', () => {
    it('shows upward trend icon and value', () => {
      render(
        <MetricCard
          title="Growth Rate"
          value="15%"
          trend="up"
          trendValue="+3%"
        />
      );

      // Check for trend value
      expect(screen.getByText('+3%')).toBeInTheDocument();
      expect(screen.getByText('from last period')).toBeInTheDocument();
    });

    it('shows downward trend icon and value', () => {
      render(
        <MetricCard
          title="Issues"
          value="5"
          trend="down"
          trendValue="-2"
        />
      );

      expect(screen.getByText('-2')).toBeInTheDocument();
      expect(screen.getByText('from last period')).toBeInTheDocument();
    });

    it('shows stable trend icon', () => {
      render(
        <MetricCard
          title="pH Level"
          value="6.5"
          trend="stable"
          trendValue="0%"
        />
      );

      expect(screen.getByText('0%')).toBeInTheDocument();
      expect(screen.getByText('from last period')).toBeInTheDocument();
    });

    it('uses custom trend label', () => {
      render(
        <MetricCard
          title="Yield"
          value="120g"
          trend="up"
          trendValue="+20g"
          trendLabel="vs last harvest"
        />
      );

      expect(screen.getByText('vs last harvest')).toBeInTheDocument();
    });

    it('shows trend without value', () => {
      render(
        <MetricCard
          title="Status"
          value="Active"
          trend="up"
        />
      );

      expect(screen.getByText('from last period')).toBeInTheDocument();
    });

    it('does not show trend section when trend is not provided', () => {
      render(
        <MetricCard
          title="Count"
          value="10"
        />
      );

      expect(screen.queryByText('from last period')).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when isLoading is true', () => {
      render(
        <MetricCard
          title="Loading Metric"
          value="--"
          isLoading={true}
        />
      );

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('shows loading animation', () => {
      render(
        <MetricCard
          title="Loading Metric"
          value="--"
          isLoading={true}
        />
      );

      const pulseElement = document.querySelector('.animate-pulse');
      expect(pulseElement).toBeInTheDocument();
    });

    it('does not show value when loading', () => {
      render(
        <MetricCard
          title="Loading Metric"
          value="42"
          isLoading={true}
        />
      );

      expect(screen.queryByText('42')).not.toBeInTheDocument();
    });

    it('does not show description when loading', () => {
      render(
        <MetricCard
          title="Loading Metric"
          value="42"
          description="Test description"
          isLoading={true}
        />
      );

      expect(screen.queryByText('Test description')).not.toBeInTheDocument();
    });

    it('does not show trend when loading', () => {
      render(
        <MetricCard
          title="Loading Metric"
          value="42"
          trend="up"
          trendValue="+5"
          isLoading={true}
        />
      );

      expect(screen.queryByText('+5')).not.toBeInTheDocument();
      expect(screen.queryByText('from last period')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('applies default variant styles', () => {
      const { container } = render(
        <MetricCard
          title="Default"
          value="42"
          variant="default"
        />
      );

      const card = container.querySelector('[class*="card"]');
      expect(card?.className).not.toContain('border-green');
      expect(card?.className).not.toContain('bg-green');
    });

    it('applies success variant styles', () => {
      const { container } = render(
        <MetricCard
          title="Success"
          value="42"
          variant="success"
        />
      );

      const card = container.querySelector('[class*="card"]');
      expect(card?.className).toContain('border-green-200');
      expect(card?.className).toContain('bg-green-50');
    });

    it('applies warning variant styles', () => {
      const { container } = render(
        <MetricCard
          title="Warning"
          value="42"
          variant="warning"
        />
      );

      const card = container.querySelector('[class*="card"]');
      expect(card?.className).toContain('border-yellow-200');
      expect(card?.className).toContain('bg-yellow-50');
    });

    it('applies danger variant styles', () => {
      const { container } = render(
        <MetricCard
          title="Danger"
          value="42"
          variant="danger"
        />
      );

      const card = container.querySelector('[class*="card"]');
      expect(card?.className).toContain('border-red-200');
      expect(card?.className).toContain('bg-red-50');
    });

    it('applies info variant styles', () => {
      const { container } = render(
        <MetricCard
          title="Info"
          value="42"
          variant="info"
        />
      );

      const card = container.querySelector('[class*="card"]');
      expect(card?.className).toContain('border-blue-200');
      expect(card?.className).toContain('bg-blue-50');
    });

    it('applies variant-specific icon colors', () => {
      const { container } = render(
        <MetricCard
          title="Success"
          value="42"
          variant="success"
          icon={<Activity />}
        />
      );

      const iconWrapper = container.querySelector('[class*="text-green"]');
      expect(iconWrapper).toBeInTheDocument();
    });
  });

  describe('Custom Styling', () => {
    it('applies custom className', () => {
      const { container } = render(
        <MetricCard
          title="Custom"
          value="42"
          className="custom-metric-card"
        />
      );

      const card = container.querySelector('.custom-metric-card');
      expect(card).toBeInTheDocument();
    });

    it('combines variant styles with custom className', () => {
      const { container } = render(
        <MetricCard
          title="Combined"
          value="42"
          variant="success"
          className="custom-class"
        />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeInTheDocument();
      expect(card?.className).toContain('border-green-200');
    });
  });

  describe('Trend Colors', () => {
    it('applies green color for upward trend', () => {
      render(
        <MetricCard
          title="Up"
          value="42"
          trend="up"
          trendValue="+5"
        />
      );

      const trendContainer = screen.getByText('+5').parentElement;
      expect(trendContainer?.className).toContain('text-green-600');
    });

    it('applies red color for downward trend', () => {
      render(
        <MetricCard
          title="Down"
          value="42"
          trend="down"
          trendValue="-5"
        />
      );

      const trendContainer = screen.getByText('-5').parentElement;
      expect(trendContainer?.className).toContain('text-red-600');
    });

    it('applies gray color for stable trend', () => {
      render(
        <MetricCard
          title="Stable"
          value="42"
          trend="stable"
          trendValue="0"
        />
      );

      const trendContainer = screen.getByText('0').parentElement;
      expect(trendContainer?.className).toContain('text-gray-600');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string value', () => {
      render(
        <MetricCard
          title="Empty"
          value=""
        />
      );

      expect(screen.getByText('Empty')).toBeInTheDocument();
    });

    it('handles zero value', () => {
      render(
        <MetricCard
          title="Zero"
          value={0}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('handles negative value', () => {
      render(
        <MetricCard
          title="Negative"
          value={-42}
        />
      );

      expect(screen.getByText('-42')).toBeInTheDocument();
    });

    it('handles very long title', () => {
      const longTitle = 'This is a very long title that might overflow the card header';

      render(
        <MetricCard
          title={longTitle}
          value="42"
        />
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('handles very large value', () => {
      render(
        <MetricCard
          title="Large"
          value="999,999,999"
        />
      );

      expect(screen.getByText('999,999,999')).toBeInTheDocument();
    });

    it('handles special characters in value', () => {
      render(
        <MetricCard
          title="Special"
          value="$42.50 USD"
        />
      );

      expect(screen.getByText('$42.50 USD')).toBeInTheDocument();
    });
  });
});