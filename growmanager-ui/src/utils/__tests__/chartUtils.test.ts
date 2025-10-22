import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CHART_COLORS,
  SERIES_COLORS,
  formatNumber,
  formatPercent,
  formatChartDate,
  formatTemperature,
  formatHumidity,
  formatEC,
  formatPH,
  formatLight,
  formatCO2,
  formatWeight,
  getChartDomain,
  getThresholdColor,
  calculateTrend,
  exportToCSV,
  aggregateByPeriod,
  calculateMovingAverage,
  getResponsiveChartHeight,
  formatAxisTick,
} from '../chartUtils';

describe('chartUtils', () => {
  describe('Color Constants', () => {
    it('exports CHART_COLORS with expected properties', () => {
      expect(CHART_COLORS).toHaveProperty('primary');
      expect(CHART_COLORS).toHaveProperty('secondary');
      expect(CHART_COLORS).toHaveProperty('success');
      expect(CHART_COLORS).toHaveProperty('warning');
      expect(CHART_COLORS).toHaveProperty('danger');
    });

    it('exports SERIES_COLORS as an array', () => {
      expect(Array.isArray(SERIES_COLORS)).toBe(true);
      expect(SERIES_COLORS.length).toBeGreaterThan(0);
    });
  });

  describe('formatNumber', () => {
    it('formats numbers with default decimals', () => {
      expect(formatNumber(1234.56)).toBe('1.2K');
      expect(formatNumber(1234567)).toBe('1.2M');
    });

    it('formats small numbers without abbreviation', () => {
      expect(formatNumber(42.5)).toBe('42.5');
      expect(formatNumber(123)).toBe('123.0');
    });

    it('formats very small numbers with extra decimals', () => {
      expect(formatNumber(0.123)).toBe('0.12');
      expect(formatNumber(0.0001)).toBe('0.00');
    });

    it('handles null and undefined', () => {
      expect(formatNumber(null)).toBe('N/A');
      expect(formatNumber(undefined)).toBe('N/A');
    });

    it('respects custom decimal places', () => {
      expect(formatNumber(1234.56, 2)).toBe('1.23K');
      expect(formatNumber(42.5, 0)).toBe('42');
    });

    it('handles zero', () => {
      expect(formatNumber(0)).toBe('0.0');
    });

    it('handles negative numbers', () => {
      expect(formatNumber(-1234)).toBe('-1.2K');
    });
  });

  describe('formatPercent', () => {
    it('formats percentages with default decimals', () => {
      expect(formatPercent(42.5)).toBe('42%');
      expect(formatPercent(98.765)).toBe('99%');
    });

    it('respects custom decimal places', () => {
      expect(formatPercent(42.567, 2)).toBe('42.57%');
      expect(formatPercent(98.765, 1)).toBe('98.8%');
    });

    it('handles null and undefined', () => {
      expect(formatPercent(null)).toBe('N/A');
      expect(formatPercent(undefined)).toBe('N/A');
    });

    it('handles zero', () => {
      expect(formatPercent(0)).toBe('0%');
    });
  });

  describe('formatChartDate', () => {
    it('formats date object with default format', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatChartDate(date);
      expect(result).toBe('Jan 15');
    });

    it('formats date string', () => {
      const result = formatChartDate('2024-01-15T10:30:00Z');
      expect(result).toBe('Jan 15');
    });

    it('respects custom format string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatChartDate(date, 'yyyy-MM-dd');
      expect(result).toBe('2024-01-15');
    });
  });

  describe('formatTemperature', () => {
    it('formats temperature in Fahrenheit by default', () => {
      expect(formatTemperature(72.5)).toBe('72.5°F');
    });

    it('formats temperature in Celsius', () => {
      expect(formatTemperature(22.5, 'C')).toBe('22.5°C');
    });

    it('handles null and undefined', () => {
      expect(formatTemperature(null)).toBe('N/A');
      expect(formatTemperature(undefined)).toBe('N/A');
    });

    it('rounds to one decimal place', () => {
      expect(formatTemperature(72.567)).toBe('72.6°F');
    });
  });

  describe('formatHumidity', () => {
    it('formats humidity as percentage', () => {
      expect(formatHumidity(65.5)).toBe('66%');
    });

    it('handles null and undefined', () => {
      expect(formatHumidity(null)).toBe('N/A');
      expect(formatHumidity(undefined)).toBe('N/A');
    });
  });

  describe('formatEC', () => {
    it('formats EC values with unit', () => {
      expect(formatEC(1.5)).toBe('1.50 mS/cm');
      expect(formatEC(2.35)).toBe('2.35 mS/cm');
    });

    it('handles null and undefined', () => {
      expect(formatEC(null)).toBe('N/A');
      expect(formatEC(undefined)).toBe('N/A');
    });

    it('rounds to two decimal places', () => {
      expect(formatEC(1.567)).toBe('1.57 mS/cm');
    });
  });

  describe('formatPH', () => {
    it('formats pH values', () => {
      expect(formatPH(6.5)).toBe('6.50');
      expect(formatPH(7.2)).toBe('7.20');
    });

    it('handles null and undefined', () => {
      expect(formatPH(null)).toBe('N/A');
      expect(formatPH(undefined)).toBe('N/A');
    });

    it('rounds to two decimal places', () => {
      expect(formatPH(6.567)).toBe('6.57');
    });
  });

  describe('formatLight', () => {
    it('formats light intensity with unit', () => {
      expect(formatLight(800)).toBe('800 μmol/m²/s');
      expect(formatLight(1200.7)).toBe('1201 μmol/m²/s');
    });

    it('handles null and undefined', () => {
      expect(formatLight(null)).toBe('N/A');
      expect(formatLight(undefined)).toBe('N/A');
    });

    it('rounds to nearest integer', () => {
      expect(formatLight(800.4)).toBe('800 μmol/m²/s');
      expect(formatLight(800.6)).toBe('801 μmol/m²/s');
    });
  });

  describe('formatCO2', () => {
    it('formats CO2 levels with unit', () => {
      expect(formatCO2(1200)).toBe('1200 ppm');
      expect(formatCO2(850.7)).toBe('851 ppm');
    });

    it('handles null and undefined', () => {
      expect(formatCO2(null)).toBe('N/A');
      expect(formatCO2(undefined)).toBe('N/A');
    });

    it('rounds to nearest integer', () => {
      expect(formatCO2(1200.4)).toBe('1200 ppm');
      expect(formatCO2(1200.6)).toBe('1201 ppm');
    });
  });

  describe('formatWeight', () => {
    it('formats weight in grams by default', () => {
      expect(formatWeight(120.5)).toBe('120.5 g');
    });

    it('formats large weights in kilograms', () => {
      expect(formatWeight(1500)).toBe('1.50 kg');
      expect(formatWeight(2345.67)).toBe('2.35 kg');
    });

    it('formats weight in ounces', () => {
      expect(formatWeight(3.5, 'oz')).toBe('3.50 oz');
    });

    it('handles null and undefined', () => {
      expect(formatWeight(null)).toBe('N/A');
      expect(formatWeight(undefined)).toBe('N/A');
    });
  });

  describe('getChartDomain', () => {
    it('returns domain with padding', () => {
      const data = [10, 20, 30, 40, 50];
      const [min, max] = getChartDomain(data);
      expect(min).toBeLessThan(10);
      expect(max).toBeGreaterThan(50);
    });

    it('returns default domain for empty data', () => {
      const [min, max] = getChartDomain([]);
      expect(min).toBe(0);
      expect(max).toBe(100);
    });

    it('respects custom padding', () => {
      const data = [10, 50];
      const [min1, max1] = getChartDomain(data, 0.1);
      const [min2, max2] = getChartDomain(data, 0.2);

      expect(min2).toBeLessThan(min1);
      expect(max2).toBeGreaterThan(max1);
    });

    it('handles single value', () => {
      const data = [25];
      const [min, max] = getChartDomain(data);
      expect(min).toBeLessThan(25);
      expect(max).toBeGreaterThan(25);
    });

    it('handles negative values', () => {
      const data = [-10, -5, 0, 5, 10];
      const [min, max] = getChartDomain(data);
      expect(min).toBeLessThan(-10);
      expect(max).toBeGreaterThan(10);
    });
  });

  describe('getThresholdColor', () => {
    const optimal = { min: 65, max: 75 };
    const warning = { min: 60, max: 80 };

    it('returns success color for optimal values', () => {
      expect(getThresholdColor(70, optimal, warning)).toBe(CHART_COLORS.success);
      expect(getThresholdColor(65, optimal, warning)).toBe(CHART_COLORS.success);
      expect(getThresholdColor(75, optimal, warning)).toBe(CHART_COLORS.success);
    });

    it('returns warning color for warning range values', () => {
      expect(getThresholdColor(62, optimal, warning)).toBe(CHART_COLORS.warning);
      expect(getThresholdColor(78, optimal, warning)).toBe(CHART_COLORS.warning);
    });

    it('returns danger color for out-of-range values', () => {
      expect(getThresholdColor(55, optimal, warning)).toBe(CHART_COLORS.danger);
      expect(getThresholdColor(85, optimal, warning)).toBe(CHART_COLORS.danger);
    });

    it('returns danger when warning range is not provided', () => {
      expect(getThresholdColor(55, optimal)).toBe(CHART_COLORS.danger);
      expect(getThresholdColor(85, optimal)).toBe(CHART_COLORS.danger);
    });
  });

  describe('calculateTrend', () => {
    it('returns "up" for increasing data', () => {
      const data = [10, 12, 15, 18, 20];
      expect(calculateTrend(data)).toBe('up');
    });

    it('returns "down" for decreasing data', () => {
      const data = [20, 18, 15, 12, 10];
      expect(calculateTrend(data)).toBe('down');
    });

    it('returns "stable" for relatively flat data', () => {
      const data = [20, 20.5, 19.8, 20.2, 20.1];
      expect(calculateTrend(data)).toBe('stable');
    });

    it('returns "stable" for data with less than 2 points', () => {
      expect(calculateTrend([10])).toBe('stable');
      expect(calculateTrend([])).toBe('stable');
    });

    it('uses recent data points only', () => {
      const data = [100, 95, 90, 85, 80, 10, 12, 15, 18, 20];
      expect(calculateTrend(data)).toBe('up');
    });
  });

  describe('exportToCSV', () => {
    let clickSpy: any;
    let appendChildSpy: any;
    let removeChildSpy: any;

    beforeEach(() => {
      clickSpy = vi.fn();
      appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => null as any);
      removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => null as any);

      vi.spyOn(document, 'createElement').mockImplementation((tag) => {
        if (tag === 'a') {
          return {
            setAttribute: vi.fn(),
            click: clickSpy,
            style: {},
          } as any;
        }
        return document.createElement(tag);
      });

      global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      global.URL.revokeObjectURL = vi.fn();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('exports data to CSV with default filename', () => {
      const data = [
        { name: 'Test 1', value: 100 },
        { name: 'Test 2', value: 200 },
      ];

      exportToCSV(data);

      expect(clickSpy).toHaveBeenCalled();
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
    });

    it('exports data with custom filename', () => {
      const data = [{ name: 'Test', value: 100 }];
      exportToCSV(data, 'custom-file.csv');

      expect(clickSpy).toHaveBeenCalled();
    });

    it('exports data with specific columns', () => {
      const data = [
        { name: 'Test', value: 100, extra: 'ignore' },
      ];

      exportToCSV(data, 'test.csv', ['name', 'value']);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('handles data with commas in values', () => {
      const data = [
        { name: 'Test, with comma', value: 100 },
      ];

      exportToCSV(data);

      expect(clickSpy).toHaveBeenCalled();
    });

    it('handles empty data gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      exportToCSV([]);

      expect(consoleSpy).toHaveBeenCalledWith('No data to export');
      expect(clickSpy).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('handles null values in data', () => {
      const data = [
        { name: 'Test', value: null },
      ];

      exportToCSV(data);

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('aggregateByPeriod', () => {
    const mockData = [
      { date: '2024-01-01T10:00:00Z', value: 10 },
      { date: '2024-01-01T14:00:00Z', value: 20 },
      { date: '2024-01-02T10:00:00Z', value: 15 },
      { date: '2024-01-08T10:00:00Z', value: 25 },
    ];

    it('aggregates data by day', () => {
      const result = aggregateByPeriod(mockData, 'day');

      expect(result.length).toBe(3);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
      expect(result[0]).toHaveProperty('count');

      // First day should have average of 10 and 20
      expect(result[0]!.value).toBe(15);
      expect(result[0]!.count).toBe(2);
    });

    it('aggregates data by week', () => {
      const result = aggregateByPeriod(mockData, 'week');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('date');
      expect(result[0]).toHaveProperty('value');
    });

    it('aggregates data by month', () => {
      const result = aggregateByPeriod(mockData, 'month');

      expect(result.length).toBe(1); // All data in same month
      expect(result[0]!.count).toBe(4);
    });

    it('sorts results by date', () => {
      const unsorted = [
        { date: '2024-01-03T10:00:00Z', value: 30 },
        { date: '2024-01-01T10:00:00Z', value: 10 },
        { date: '2024-01-02T10:00:00Z', value: 20 },
      ];

      const result = aggregateByPeriod(unsorted, 'day');

      expect(result[0]!.date < result[1]!.date).toBe(true);
      expect(result[1]!.date < result[2]!.date).toBe(true);
    });

    it('handles Date objects', () => {
      const dataWithDates = [
        { date: new Date('2024-01-01'), value: 10 },
        { date: new Date('2024-01-02'), value: 20 },
      ];

      const result = aggregateByPeriod(dataWithDates, 'day');

      expect(result.length).toBe(2);
    });
  });

  describe('calculateMovingAverage', () => {
    it('calculates moving average with default window', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateMovingAverage(data);

      expect(result.length).toBe(5);
      expect(result[2]).toBeCloseTo(30); // Middle value
    });

    it('calculates moving average with custom window', () => {
      const data = [10, 20, 30, 40, 50];
      const result = calculateMovingAverage(data, 5);

      expect(result.length).toBe(5);
    });

    it('returns original data if smaller than window', () => {
      const data = [10, 20];
      const result = calculateMovingAverage(data, 3);

      expect(result).toEqual(data);
    });

    it('handles empty array', () => {
      const result = calculateMovingAverage([]);
      expect(result).toEqual([]);
    });

    it('smooths out spikes in data', () => {
      const data = [10, 10, 100, 10, 10];
      const result = calculateMovingAverage(data, 3);

      // Middle value should be averaged
      expect(result[2]).toBeLessThan(100);
      expect(result[2]).toBeGreaterThan(10);
    });
  });

  describe('getResponsiveChartHeight', () => {
    it('calculates height based on aspect ratio', () => {
      const height = getResponsiveChartHeight(800, 2);
      expect(height).toBe(400);
    });

    it('enforces minimum height', () => {
      const height = getResponsiveChartHeight(100, 2);
      expect(height).toBe(200); // Min height
    });

    it('enforces maximum height', () => {
      const height = getResponsiveChartHeight(2000, 2);
      expect(height).toBe(500); // Max height
    });

    it('uses default aspect ratio', () => {
      const height1 = getResponsiveChartHeight(800);
      const height2 = getResponsiveChartHeight(800, 2);
      expect(height1).toBe(height2);
    });
  });

  describe('formatAxisTick', () => {
    it('formats number data type', () => {
      expect(formatAxisTick(1234, 'number')).toBe('1.2K');
    });

    it('formats date data type', () => {
      const date = new Date('2024-01-15');
      const result = formatAxisTick(date, 'date');
      expect(result).toBe('Jan 15');
    });

    it('formats percent data type', () => {
      expect(formatAxisTick(42.5, 'percent')).toBe('42%');
    });

    it('formats currency data type', () => {
      expect(formatAxisTick(1234, 'currency')).toBe('$1K');
    });

    it('uses custom options for date format', () => {
      const date = new Date('2024-01-15');
      const result = formatAxisTick(date, 'date', { dateFormat: 'yyyy-MM-dd' });
      expect(result).toBe('2024-01-15');
    });

    it('uses custom decimals option', () => {
      expect(formatAxisTick(1234.56, 'number', { decimals: 2 })).toBe('1.23K');
    });

    it('defaults to number type', () => {
      expect(formatAxisTick(42.5)).toBe('42.5');
    });
  });
});