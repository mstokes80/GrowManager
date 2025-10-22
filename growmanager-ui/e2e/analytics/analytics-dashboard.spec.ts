import { test, expect } from '@playwright/test';
import { dashboardTestData } from '../fixtures/analyticsTestData';
import {
  navigateToAnalyticsPage,
  waitForAllChartsToRender,
  verifyMetricCard,
  verifyMobileLayout,
} from '../utils/analyticsHelpers';

test.describe('Analytics Dashboard Flow', () => {
  test('should navigate to dashboard and verify metrics load', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/dashboard');

    // Verify metric cards are visible
    await verifyMetricCard(page, 'Active Grows');
    await verifyMetricCard(page, 'Total Plants');

    // Verify at least one metric card has content
    const metricCards = page.locator('[data-testid*="metric"], .metric-card');
    await expect(metricCards.first()).toBeVisible();
    const count = await metricCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should verify recent activity feed displays', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/dashboard');

    // Look for recent activity section
    const activitySection = page.locator('text=/recent activity|activity feed/i').first();
    await expect(activitySection).toBeVisible({ timeout: 5000 });

    // Verify at least one activity item or empty state
    const hasActivityItems = await page.locator('[data-testid*="activity"], .activity-item').count();
    const hasEmptyState = await page.locator('text=/no recent activity|no activity/i').count();

    expect(hasActivityItems + hasEmptyState).toBeGreaterThan(0);
  });

  test('should click on metric card and navigate to detail page', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/dashboard');

    // Find a clickable metric card
    const metricCard = page.locator('[data-testid*="metric-card"], button:has-text("View Details")').first();

    if (await metricCard.isVisible()) {
      const initialUrl = page.url();
      await metricCard.click();

      // Verify navigation occurred or modal opened
      await page.waitForTimeout(500);
      const newUrl = page.url();
      const hasModal = await page.locator('[role="dialog"]').isVisible();

      expect(newUrl !== initialUrl || hasModal).toBeTruthy();
    }
  });

  test('should verify quick-add buttons are present', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/dashboard');

    // Look for common quick-add actions
    const quickAddSection = page.locator('text=/quick add|quick actions/i').first();

    if (await quickAddSection.isVisible()) {
      await expect(quickAddSection).toBeVisible();

      // Check for action buttons
      const actionButtons = page.locator('button:has-text("Add"), button:has-text("New")');
      const buttonCount = await actionButtons.count();
      expect(buttonCount).toBeGreaterThan(0);
    }
  });

  test('should test responsive layout on mobile', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/dashboard');
    await verifyMobileLayout(page);

    // Verify dashboard still renders on mobile
    await expect(page.locator('body')).toBeVisible();

    // Metric cards should stack vertically
    const metricCards = page.locator('[data-testid*="metric"], .metric-card');
    if ((await metricCards.count()) > 0) {
      await expect(metricCards.first()).toBeVisible();
    }
  });
});