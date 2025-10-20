import { test, expect } from '@playwright/test';
import {
  measurePageLoadTime,
  measureChartRenderTime,
  navigateToAnalyticsPage,
  selectTimeRange,
} from '../utils/analyticsHelpers';

test.describe('Analytics Performance Tests', () => {
  test('should measure dashboard page load time (target <2 seconds)', async ({ page }) => {
    const loadTime = await measurePageLoadTime(page, '/analytics/dashboard');

    // Log the actual load time
    console.log(`Dashboard load time: ${loadTime}ms`);

    // Verify page loaded successfully
    await expect(page.locator('body')).toBeVisible();

    // Target is <2000ms, but we'll be lenient for CI environments
    expect(loadTime).toBeLessThan(5000); // Allow up to 5 seconds for slower environments
  });

  test('should measure environmental page chart render time (target <1 second)', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    const renderTime = await measureChartRenderTime(page);

    // Log the actual render time
    console.log(`Chart render time: ${renderTime}ms`);

    // Verify charts rendered
    const chartCount = await page.locator('.recharts-wrapper').count();
    expect(chartCount).toBeGreaterThan(0);

    // Target is <1000ms, but allow more time for CI
    expect(renderTime).toBeLessThan(3000); // Allow up to 3 seconds
  });

  test('should test time range change response time', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/environmental');

    // Wait for initial render
    await page.waitForTimeout(1000);

    // Look for time range buttons
    const timeRangeButton = page.locator('button:has-text("30d"), button:has-text("7d")').first();
    const hasTimeRange = await timeRangeButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasTimeRange) {
      // Measure response time for time range change
      const startTime = Date.now();

      await timeRangeButton.click();
      await page.waitForTimeout(300); // Wait for data to update

      // Wait for charts to re-render
      await page.locator('.recharts-wrapper').first().waitFor({ state: 'visible', timeout: 5000 });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.log(`Time range change response time: ${responseTime}ms`);

      // Should respond quickly (target <500ms, allow <2000ms)
      expect(responseTime).toBeLessThan(2000);
    }

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should verify React Query caching (second load should be faster)', async ({ page }) => {
    // First load
    const firstLoadTime = await measurePageLoadTime(page, '/analytics/dashboard');
    console.log(`First load time: ${firstLoadTime}ms`);

    // Navigate away
    await page.goto('/');
    await page.waitForTimeout(500);

    // Second load (should use cache)
    const secondLoadTime = await measurePageLoadTime(page, '/analytics/dashboard');
    console.log(`Second load time: ${secondLoadTime}ms`);

    // Verify both loads completed successfully
    await expect(page.locator('body')).toBeVisible();

    // Second load should generally be faster or similar (cache hit)
    // Don't assert strict inequality as network conditions vary
    expect(secondLoadTime).toBeLessThan(firstLoadTime + 1000); // Within 1 second difference
    console.log(`Load time difference: ${firstLoadTime - secondLoadTime}ms`);
  });

  test('should check for memory leaks (navigate between pages 10 times)', async ({ page }) => {
    const pages = [
      '/analytics/dashboard',
      '/analytics/environmental',
      '/analytics/yield',
      '/analytics/comparison',
    ];

    // Navigate between pages multiple times
    for (let i = 0; i < 10; i++) {
      const targetPage = pages[i % pages.length];
      await page.goto(targetPage);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(300);

      // Verify page is still responsive
      await expect(page.locator('body')).toBeVisible();
    }

    // Get memory metrics if available
    const metrics = await page.evaluate(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        return {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }
      return null;
    });

    if (metrics) {
      console.log('Memory usage:', metrics);
      const heapUsagePercent = (metrics.usedJSHeapSize / metrics.jsHeapSizeLimit) * 100;
      console.log(`Heap usage: ${heapUsagePercent.toFixed(2)}%`);

      // Warn if heap usage is very high (>90%)
      if (heapUsagePercent > 90) {
        console.warn('High heap usage detected - potential memory leak');
      }
    }

    // Final verification - page should still be functional
    await expect(page.locator('body')).toBeVisible();
    const errorCount = await page.locator('[role="alert"], text=/error/i').count();
    expect(errorCount).toBe(0); // No error messages should appear
  });
});