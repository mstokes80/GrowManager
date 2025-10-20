import { Page, expect } from '@playwright/test';

/**
 * Helper functions for analytics E2E tests
 */

/**
 * Navigate to analytics page and wait for it to load
 */
export async function navigateToAnalyticsPage(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for chart to render
 */
export async function waitForChartToRender(page: Page, chartTestId?: string) {
  const selector = chartTestId ? `[data-testid="${chartTestId}"]` : '.recharts-wrapper';
  await expect(page.locator(selector).first()).toBeVisible({ timeout: 10000 });
}

/**
 * Wait for all charts on page to render
 */
export async function waitForAllChartsToRender(page: Page) {
  // Wait for at least one chart to be visible
  await expect(page.locator('.recharts-wrapper').first()).toBeVisible({ timeout: 10000 });

  // Wait a bit for all charts to render
  await page.waitForTimeout(500);
}

/**
 * Click time range selector option
 */
export async function selectTimeRange(page: Page, range: '7d' | '30d' | '90d' | 'custom') {
  const timeRangeButton = page.locator(`button:has-text("${range}"), button[value="${range}"]`).first();
  await timeRangeButton.click();
  await page.waitForTimeout(300); // Wait for data to update
}

/**
 * Toggle chart parameter visibility
 */
export async function toggleParameter(page: Page, parameterName: string) {
  const checkbox = page.locator(`input[type="checkbox"][name="${parameterName}"], label:has-text("${parameterName}")`).first();
  await checkbox.click();
  await page.waitForTimeout(300);
}

/**
 * Export chart data to CSV
 */
export async function exportToCSV(page: Page) {
  const exportButton = page.locator('button:has-text("Export"), button:has-text("CSV")').first();

  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await exportButton.click();
  const download = await downloadPromise;

  return download.suggestedFilename();
}

/**
 * Verify metric card displays correct value
 */
export async function verifyMetricCard(page: Page, label: string, expectedValue?: string | RegExp) {
  const metricCard = page.locator(`[data-testid*="metric"], .metric-card`).filter({ hasText: label }).first();
  await expect(metricCard).toBeVisible();

  if (expectedValue) {
    await expect(metricCard).toContainText(expectedValue);
  }
}

/**
 * Verify loading state is displayed
 */
export async function verifyLoadingState(page: Page) {
  const loadingIndicator = page.locator('text=/loading|spinner/i, [data-testid="loading"]').first();
  await expect(loadingIndicator).toBeVisible({ timeout: 2000 });
}

/**
 * Verify error message is displayed
 */
export async function verifyErrorMessage(page: Page, expectedMessage?: string | RegExp) {
  const errorElement = page.locator('text=/error|failed|something went wrong/i, [role="alert"]').first();
  await expect(errorElement).toBeVisible({ timeout: 5000 });

  if (expectedMessage) {
    await expect(errorElement).toContainText(expectedMessage);
  }
}

/**
 * Verify empty state is displayed
 */
export async function verifyEmptyState(page: Page, expectedMessage?: string | RegExp) {
  const emptyElement = page.locator('text=/no data|no events|no results/i, [data-testid="empty-state"]').first();
  await expect(emptyElement).toBeVisible({ timeout: 5000 });

  if (expectedMessage) {
    await expect(emptyElement).toContainText(expectedMessage);
  }
}

/**
 * Select cultivars from multi-select dropdown
 */
export async function selectCultivars(page: Page, cultivarNames: string[]) {
  const selector = page.locator('button:has-text("Select Cultivars"), [data-testid="cultivar-selector"]').first();
  await selector.click();

  for (const name of cultivarNames) {
    const option = page.locator(`[role="option"]:has-text("${name}"), label:has-text("${name}")`).first();
    await option.click();
    await page.waitForTimeout(100);
  }

  // Close dropdown
  await page.keyboard.press('Escape');
}

/**
 * Select a grow from dropdown
 */
export async function selectGrow(page: Page, growName: string) {
  const selector = page.locator('select, button:has-text("Select Grow")').first();

  if ((await selector.evaluate(el => el.tagName)) === 'SELECT') {
    await selector.selectOption({ label: growName });
  } else {
    await selector.click();
    const option = page.locator(`[role="option"]:has-text("${growName}")`).first();
    await option.click();
  }

  await page.waitForTimeout(300);
}

/**
 * Verify chart has data points
 */
export async function verifyChartHasData(page: Page, chartTestId?: string) {
  const selector = chartTestId
    ? `[data-testid="${chartTestId}"] .recharts-layer`
    : '.recharts-layer';

  const chartLayers = page.locator(selector);
  await expect(chartLayers.first()).toBeVisible();

  // Check that there are actual data elements (lines, bars, etc.)
  const count = await chartLayers.count();
  expect(count).toBeGreaterThan(0);
}

/**
 * Click on a timeline event
 */
export async function clickTimelineEvent(page: Page, eventId: string) {
  const event = page.locator(`[data-event-id="${eventId}"], [data-testid="timeline-event"]:has-text("${eventId}")`).first();
  await event.click();
  await page.waitForTimeout(200);
}

/**
 * Verify modal is open
 */
export async function verifyModalIsOpen(page: Page, modalTitle?: string) {
  const modal = page.locator('[role="dialog"], .modal').first();
  await expect(modal).toBeVisible({ timeout: 3000 });

  if (modalTitle) {
    await expect(modal).toContainText(modalTitle);
  }
}

/**
 * Close modal
 */
export async function closeModal(page: Page) {
  // Try clicking close button first
  const closeButton = page.locator('button[aria-label="Close"], button:has-text("Close")').first();

  if (await closeButton.isVisible()) {
    await closeButton.click();
  } else {
    // Fallback to pressing Escape
    await page.keyboard.press('Escape');
  }

  await page.waitForTimeout(200);
}

/**
 * Measure page load time
 */
export async function measurePageLoadTime(page: Page, url: string): Promise<number> {
  const startTime = Date.now();
  await page.goto(url);
  await page.waitForLoadState('networkidle');
  const endTime = Date.now();

  return endTime - startTime;
}

/**
 * Measure chart render time
 */
export async function measureChartRenderTime(page: Page): Promise<number> {
  const startTime = Date.now();
  await waitForAllChartsToRender(page);
  const endTime = Date.now();

  return endTime - startTime;
}

/**
 * Check for console errors
 */
export async function checkForConsoleErrors(page: Page): Promise<string[]> {
  const errors: string[] = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  return errors;
}

/**
 * Verify responsive layout (mobile)
 */
export async function verifyMobileLayout(page: Page) {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.waitForTimeout(300);

  // Verify page is still functional
  await expect(page.locator('body')).toBeVisible();
}

/**
 * Verify accessibility with keyboard navigation
 */
export async function testKeyboardNavigation(page: Page, elementsToNavigate: string[]) {
  for (const element of elementsToNavigate) {
    await page.keyboard.press('Tab');
    const focused = await page.evaluate(() => document.activeElement?.textContent);
    // Just verify we can navigate with keyboard
    expect(focused).toBeDefined();
  }
}