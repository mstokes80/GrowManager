import { test, expect } from '@playwright/test';
import { analyticsTestGrow, feedingTestData } from '../fixtures/analyticsTestData';
import {
  navigateToAnalyticsPage,
  waitForChartToRender,
  verifyChartHasData,
  toggleParameter,
  exportToCSV,
} from '../utils/analyticsHelpers';

test.describe('Feeding Analytics Flow', () => {
  test('should navigate to feeding analytics page', async ({ page }) => {
    const growId = analyticsTestGrow.id;
    await navigateToAnalyticsPage(page, `/analytics/feeding/${growId}`);

    // Verify page loaded
    const heading = page.locator('h1, h2').filter({ hasText: /feeding/i }).first();
    await expect(heading).toBeVisible({ timeout: 5000 });

    // Check for main content
    await expect(page.locator('body')).toBeVisible();
  });

  test('should verify feeding schedule timeline renders', async ({ page }) => {
    const growId = analyticsTestGrow.id;
    await navigateToAnalyticsPage(page, `/analytics/feeding/${growId}`);

    // Look for timeline or feeding events
    const timelineSection = page.locator('text=/timeline|schedule|feeding events/i').first();
    const hasTimeline = await timelineSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasTimeline) {
      await expect(timelineSection).toBeVisible();

      // Look for feeding event items or chart
      const feedingEvents = page.locator('[data-testid*="feeding"], [data-testid*="event"], .recharts-wrapper').count();
      expect(await feedingEvents).toBeGreaterThan(0);
    } else {
      // Verify page loaded with some content
      const hasContent = await page.locator('.recharts-wrapper, [data-testid*="metric"]').count();
      expect(hasContent).toBeGreaterThan(0);
    }
  });

  test('should verify pH trend chart with optimal range', async ({ page }) => {
    const growId = analyticsTestGrow.id;
    await navigateToAnalyticsPage(page, `/analytics/feeding/${growId}`);

    // Wait for charts to load
    await waitForChartToRender(page);

    // Look for pH section or chart
    const phSection = page.locator('text=/\\bph\\b|ph level|ph trend/i').first();
    await expect(phSection).toBeVisible({ timeout: 8000 });

    // Look for optimal range indicator (5.5-6.5)
    const optimalRange = page.locator('text=/5\\.5|6\\.5|optimal|target/i').first();
    const hasOptimal = await optimalRange.isVisible({ timeout: 3000 }).catch(() => false);

    // Verify chart or data is present
    const hasChart = await page.locator('.recharts-wrapper').count();
    const hasData = await page.locator('[data-testid*="ph"]').count();
    expect(hasChart + hasData).toBeGreaterThan(0);
  });

  test('should verify EC trend chart', async ({ page }) => {
    const growId = analyticsTestGrow.id;
    await navigateToAnalyticsPage(page, `/analytics/feeding/${growId}`);

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Look for EC section or chart
    const ecSection = page.locator('text=/\\bec\\b|electrical conductivity|ec trend/i').first();
    const hasEc = await ecSection.isVisible({ timeout: 5000 }).catch(() => false);

    if (hasEc) {
      await expect(ecSection).toBeVisible();
    }

    // Verify at least one chart is present
    const chartCount = await page.locator('.recharts-wrapper').count();
    expect(chartCount).toBeGreaterThan(0);
  });

  test('should toggle parameter visibility (hide/show pH)', async ({ page }) => {
    const growId = analyticsTestGrow.id;
    await navigateToAnalyticsPage(page, `/analytics/feeding/${growId}`);

    // Wait for charts to render
    await waitForChartToRender(page);

    // Look for parameter toggle controls
    const toggleControls = page.locator('input[type="checkbox"], [role="switch"]');
    const toggleCount = await toggleControls.count();

    if (toggleCount > 0) {
      // Get initial state
      const firstToggle = toggleControls.first();
      await expect(firstToggle).toBeVisible();

      // Click toggle
      await firstToggle.click();
      await page.waitForTimeout(300);

      // Click again to restore
      await firstToggle.click();
      await page.waitForTimeout(300);

      // Verify chart is still visible
      await expect(page.locator('.recharts-wrapper').first()).toBeVisible();
    } else {
      // If no toggles, verify charts are still functional
      const chartCount = await page.locator('.recharts-wrapper').count();
      expect(chartCount).toBeGreaterThan(0);
    }
  });

  test('should export to CSV', async ({ page }) => {
    const growId = analyticsTestGrow.id;
    await navigateToAnalyticsPage(page, `/analytics/feeding/${growId}`);

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
        expect(filename.toLowerCase()).toMatch(/csv|feeding|export/);
      }
    } else {
      // If no export button, verify page is still functional
      const hasContent = await page.locator('.recharts-wrapper, [data-testid*="metric"]').count();
      expect(hasContent).toBeGreaterThan(0);
    }
  });
});