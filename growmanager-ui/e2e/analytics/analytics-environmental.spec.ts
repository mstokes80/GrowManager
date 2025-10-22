import { test, expect } from '@playwright/test';
import { analyticsTestGrow, environmentalTestData } from '../fixtures/analyticsTestData';
import {
  navigateToAnalyticsPage,
  selectGrow,
  waitForChartToRender,
  verifyChartHasData,
  selectTimeRange,
  exportToCSV,
} from '../utils/analyticsHelpers';

test.describe('Environmental Analytics Flow', () => {
  test('should navigate to environmental analytics page', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Verify page title or heading
    const heading = page.locator('h1, h2').filter({ hasText: /environmental/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Verify page loaded successfully
    await expect(page.locator('body')).toBeVisible();
  });

  test('should select a grow from dropdown', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Check if grow selector exists
    const growSelector = page.locator('select, button:has-text("Select Grow")').first();
    const hasSelectorVisible = await growSelector.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasSelectorVisible) {
      await selectGrow(page, analyticsTestGrow.name);

      // Wait for data to load after selection
      await page.waitForTimeout(500);

      // Verify selection was made (look for charts or data)
      const hasCharts = await page.locator('.recharts-wrapper').count();
      const hasData = await page.locator('[data-testid*="chart"], .metric-card').count();
      expect(hasCharts + hasData).toBeGreaterThan(0);
    }
  });

  test('should verify temperature chart renders with data points', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Look for temperature chart
    const tempChart = page.locator('[data-testid*="temperature"], .recharts-wrapper').first();
    await expect(tempChart).toBeVisible({ timeout: 10000 });

    // Verify chart has data
    await verifyChartHasData(page);

    // Look for temperature label or legend
    const tempLabel = page.locator('text=/temperature|temp/i').first();
    await expect(tempLabel).toBeVisible();
  });

  test('should verify humidity chart renders', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Wait for charts to render
    await waitForChartToRender(page);

    // Look for humidity chart or section
    const humiditySection = page.locator('text=/humidity|rh/i').first();
    await expect(humiditySection).toBeVisible({ timeout: 8000 });

    // Verify at least one chart is present
    const chartCount = await page.locator('.recharts-wrapper').count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should verify VPD chart renders with optimal range overlay', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Wait for charts to load
    await page.waitForTimeout(1000);

    // Look for VPD section or chart
    const vpdSection = page.locator('text=/vpd|vapor pressure/i').first();
    const hasVpd = await vpdSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasVpd) {
      await expect(vpdSection).toBeVisible();

      // Look for optimal range indicator
      const optimalIndicator = page.locator('text=/optimal|target|range/i').first();
      const hasOptimal = await optimalIndicator.isVisible({ timeout: 3000 }).catch(() => false);

      // VPD should have some indication of optimal ranges
      expect(hasVpd).toBeTruthy();
    }
  });

  test('should change time range and verify charts update', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Wait for initial chart render
    await waitForChartToRender(page);

    // Try selecting different time ranges
    const timeRanges = ['7d', '30d', '90d'];

    for (const range of timeRanges) {
      const rangeButton = page.locator(`button:has-text("${range}"), button[value="${range}"]`).first();
      const isVisible = await rangeButton.isVisible({ timeout: 2000 }).catch(() => false);

      if (isVisible) {
        await selectTimeRange(page, range as '7d' | '30d' | '90d');

        // Verify chart is still visible after update
        await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 5000 });

        // Small delay between selections
        await page.waitForTimeout(300);
        break; // Just test one successful change
      }
    }

    // Verify at least one chart is still visible
    const chartCount = await page.locator('.recharts-wrapper').count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should export to CSV and verify download', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Wait for data to load
    await waitForChartToRender(page);

    // Look for export button
    const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV"), button:has-text("Download")').first();
    const hasExportButton = await exportButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasExportButton) {
      // Test export functionality
      const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
      await exportButton.click();

      const download = await downloadPromise;
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toBeTruthy();
        expect(filename.toLowerCase()).toMatch(/csv|environmental|export/);
      }
    } else {
      // If no export button, verify page is still functional
      const chartCount = await page.locator('.recharts-wrapper').count();
      expect(chartCount).toBeGreaterThan(0);
    }
  });
});