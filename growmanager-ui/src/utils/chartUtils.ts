/**
 * Chart utility functions for data visualization
 * Provides formatting, colors, tooltips, and CSV export functionality
 */

import { format } from 'date-fns';

/**
 * Chart color palette - matches Tailwind colors for consistency
 */
export const CHART_COLORS = {
  primary: '#3b82f6', // blue-500
  secondary: '#10b981', // emerald-500
  tertiary: '#f59e0b', // amber-500
  quaternary: '#8b5cf6', // violet-500
  success: '#22c55e', // green-500
  warning: '#f97316', // orange-500
  danger: '#ef4444', // red-500
  info: '#06b6d4', // cyan-500
  neutral: '#6b7280', // gray-500
  muted: '#9ca3af', // gray-400
} as const;

/**
 * Color palette for multi-series charts
 */
export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.tertiary,
  CHART_COLORS.quaternary,
  CHART_COLORS.info,
  CHART_COLORS.warning,
];

/**
 * Format a number for display in charts
 */
export function formatNumber(
  value: number | undefined | null,
  decimals: number = 1
): string {
  if (value === undefined || value === null) return 'N/A';

  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absValue >= 1000000) {
    return `${sign}${(absValue / 1000000).toFixed(decimals)}M`;
  }
  if (absValue >= 1000) {
    return `${sign}${(absValue / 1000).toFixed(decimals)}K`;
  }
  if (absValue < 1 && absValue > 0) {
    return value.toFixed(decimals + 1);
  }
  return value.toFixed(decimals);
}

/**
 * Format a percentage value
 */
export function formatPercent(
  value: number | undefined | null,
  decimals: number = 0
): string {
  if (value === undefined || value === null) return 'N/A';
  return `${Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)}%`;
}

/**
 * Format a date for chart display
 */
export function formatChartDate(
  date: Date | string,
  formatStr: string = 'MMM d'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr);
}

/**
 * Format temperature with unit
 */
export function formatTemperature(
  value: number | undefined | null,
  unit: 'F' | 'C' = 'F'
): string {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(1)}°${unit}`;
}

/**
 * Format humidity percentage
 */
export function formatHumidity(value: number | undefined | null): string {
  return formatPercent(value, 0);
}

/**
 * Format EC (Electrical Conductivity) value
 */
export function formatEC(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(2)} mS/cm`;
}

/**
 * Format pH value
 */
export function formatPH(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(2);
}

/**
 * Format light intensity (PPFD)
 */
export function formatLight(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return `${Math.round(value)} μmol/m²/s`;
}

/**
 * Format CO2 levels
 */
export function formatCO2(value: number | undefined | null): string {
  if (value === undefined || value === null) return 'N/A';
  return `${Math.round(value)} ppm`;
}

/**
 * Format yield weight
 */
export function formatWeight(
  value: number | undefined | null,
  unit: 'g' | 'oz' = 'g'
): string {
  if (value === undefined || value === null) return 'N/A';
  if (unit === 'oz') {
    return `${value.toFixed(2)} oz`;
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(2)} kg`;
  }
  return `${value.toFixed(1)} g`;
}

/**
 * Get chart domain with padding
 */
export function getChartDomain(
  data: number[],
  padding: number = 0.1
): [number, number] {
  if (data.length === 0) return [0, 100];

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min;

  // Ensure we have at least some range to work with
  const effectiveRange = range === 0 ? Math.abs(max) * 0.2 || 1 : range;
  const paddingAmount = effectiveRange * padding;

  return [
    Math.floor(min - paddingAmount),
    Math.ceil(max + paddingAmount)
  ];
}

/**
 * Get color for value based on thresholds
 */
export function getThresholdColor(
  value: number,
  optimal: { min: number; max: number },
  warning?: { min: number; max: number }
): string {
  if (value >= optimal.min && value <= optimal.max) {
    return CHART_COLORS.success;
  }
  if (warning && (value >= warning.min && value <= warning.max)) {
    return CHART_COLORS.warning;
  }
  return CHART_COLORS.danger;
}

/**
 * Calculate trend from data points
 */
export function calculateTrend(data: number[]): 'up' | 'down' | 'stable' {
  if (data.length < 2) return 'stable';

  const recent = data.slice(-Math.min(5, data.length));
  const average = recent.reduce((a, b) => a + b, 0) / recent.length;
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const secondHalf = recent.slice(Math.floor(recent.length / 2));

  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;
  const threshold = average * 0.05; // 5% threshold for change

  if (Math.abs(difference) < threshold) return 'stable';
  return difference > 0 ? 'up' : 'down';
}

/**
 * Generate custom tooltip content
 */
export interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey: string;
    payload: any;
  }>;
  label?: string;
  labelFormatter?: (value: any) => string;
  formatter?: (value: any, name: string) => string;
}

export function createTooltipContent(
  props: TooltipProps
): React.ReactElement | null {
  const { active, payload } = props;

  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // This function returns configuration for the tooltip
  // Actual rendering will be handled by the component using this
  return null; // Components will handle rendering based on formatters
}

/**
 * Export data to CSV format
 */
export function exportToCSV(
  data: Record<string, any>[],
  filename: string = 'chart-data.csv',
  columns?: string[]
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Get column headers
  const headers = columns || (data[0] ? Object.keys(data[0]) : []);

  // Create CSV content
  const csvContent = [
    headers.join(','),
    ...data.map(row =>
      headers.map(header => {
        const value = row[header];
        // Handle values that contain commas
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value ?? '';
      }).join(',')
    )
  ].join('\n');

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Aggregate data by time period
 */
export function aggregateByPeriod(
  data: Array<{ date: string | Date; value: number }>,
  period: 'day' | 'week' | 'month'
): Array<{ date: string; value: number; count: number }> {
  const grouped = new Map<string, { sum: number; count: number }>();

  data.forEach(item => {
    const date = typeof item.date === 'string' ? new Date(item.date) : item.date;
    let key: string;

    switch (period) {
      case 'day':
        key = format(date, 'yyyy-MM-dd');
        break;
      case 'week':
        key = format(date, 'yyyy-ww');
        break;
      case 'month':
        key = format(date, 'yyyy-MM');
        break;
      default:
        key = format(date, 'yyyy-MM-dd');
    }

    const existing = grouped.get(key) || { sum: 0, count: 0 };
    grouped.set(key, {
      sum: existing.sum + item.value,
      count: existing.count + 1
    });
  });

  return Array.from(grouped.entries()).map(([date, stats]) => ({
    date,
    value: stats.sum / stats.count, // Average
    count: stats.count
  })).sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(
  data: number[],
  windowSize: number = 3
): number[] {
  if (data.length < windowSize) return data;

  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const window = data.slice(start, end);
    const average = window.reduce((a, b) => a + b, 0) / window.length;
    result.push(average);
  }

  return result;
}

/**
 * Get responsive chart height based on container width
 */
export function getResponsiveChartHeight(
  containerWidth: number,
  aspectRatio: number = 2
): number {
  const minHeight = 200;
  const maxHeight = 500;
  const calculatedHeight = containerWidth / aspectRatio;

  return Math.max(minHeight, Math.min(maxHeight, calculatedHeight));
}

/**
 * Format axis tick based on data type
 */
export function formatAxisTick(
  value: any,
  dataType: 'number' | 'date' | 'percent' | 'currency' = 'number',
  options: any = {}
): string {
  switch (dataType) {
    case 'date':
      return formatChartDate(value, options.dateFormat || 'MMM d');
    case 'percent':
      return formatPercent(value, options.decimals !== undefined ? options.decimals : 0);
    case 'currency':
      return `$${formatNumber(value, options.decimals !== undefined ? options.decimals : 0)}`;
    default:
      return formatNumber(value, options.decimals !== undefined ? options.decimals : 0);
  }
}