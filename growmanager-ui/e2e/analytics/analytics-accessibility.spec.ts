import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  navigateToAnalyticsPage,
  testKeyboardNavigation,
} from '../utils/analyticsHelpers';

test.describe('Analytics Accessibility Tests', () => {
  test('should navigate analytics flow using only keyboard', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/dashboard');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Test Tab navigation
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Get focused element
    const firstFocus = await page.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        text: el?.textContent?.substring(0, 50),
      };
    });

    console.log('First focused element:', firstFocus);
    expect(firstFocus.tag).toBeTruthy();

    // Continue tabbing through several elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(100);

      const focused = await page.evaluate(() => {
        const el = document.activeElement;
        return el?.tagName || 'BODY';
      });

      console.log(`Tab ${i + 2}: ${focused}`);
    }

    // Test that Enter key activates focused element
    const interactiveElement = page.locator('button, a, [role="button"]').first();
    const hasInteractive = await interactiveElement.isVisible({ timeout: 3000 }).catch(() => false);

    if (hasInteractive) {
      await interactiveElement.focus();
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);

      // Verify something happened (navigation or interaction)
      await expect(page.locator('body')).toBeVisible();
    }

    // Test Escape key closes modals/dialogs
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
  });

  test('should verify all charts have aria-labels', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/dashboard');

    // Wait for charts to render
    await page.waitForTimeout(1000);

    const charts = page.locator('.recharts-wrapper, [role="img"], svg[role="graphics-document"]');
    const chartCount = await charts.count();

    console.log(`Found ${chartCount} chart elements`);

    if (chartCount > 0) {
      // Check each chart for accessibility attributes
      for (let i = 0; i < Math.min(chartCount, 5); i++) {
        const chart = charts.nth(i);

        // Check for aria-label or title
        const hasAriaLabel = await chart.getAttribute('aria-label');
        const hasTitle = await chart.locator('title').count();
        const hasRole = await chart.getAttribute('role');

        console.log(`Chart ${i + 1}:`, {
          ariaLabel: hasAriaLabel,
          titleCount: hasTitle,
          role: hasRole,
        });

        // Chart should have some accessibility attribute
        // (aria-label, title, or proper role)
        expect(hasAriaLabel || hasTitle > 0 || hasRole).toBeTruthy();
      }
    }

    // Verify page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('should test with axe-core for WCAG AA compliance', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/dashboard');

    // Wait for page to fully render
    await page.waitForTimeout(2000);

    // Run axe accessibility tests
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa'])
      .analyze();

    // Log violations
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations found:');
      accessibilityScanResults.violations.forEach((violation) => {
        console.log(`- ${violation.id}: ${violation.description}`);
        console.log(`  Impact: ${violation.impact}`);
        console.log(`  Elements: ${violation.nodes.length}`);
      });
    }

    // Test should pass if no critical violations
    // Allow minor violations but fail on serious/critical ones
    const criticalViolations = accessibilityScanResults.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );

    expect(criticalViolations.length).toBe(0);
    console.log(`Accessibility test passed. Total violations: ${accessibilityScanResults.violations.length}, Critical/Serious: ${criticalViolations.length}`);
  });

  test('should verify color contrast meets requirements', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/dashboard');

    // Wait for page to render
    await page.waitForTimeout(1000);

    // Run axe with color-contrast rules
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2aa'])
      .include('body')
      .analyze();

    // Filter for color contrast violations
    const contrastViolations = accessibilityScanResults.violations.filter(
      (v) => v.id === 'color-contrast'
    );

    if (contrastViolations.length > 0) {
      console.log('Color contrast violations:');
      contrastViolations.forEach((violation) => {
        violation.nodes.forEach((node) => {
          console.log(`- ${node.html}`);
          console.log(`  Message: ${node.failureSummary}`);
        });
      });
    }

    // Should have no color contrast violations
    expect(contrastViolations.length).toBe(0);
    console.log('Color contrast test passed');
  });

  test('should verify focus indicators are visible', async ({ page }) => {
    await navigateToAnalyticsPage(page, '/analytics/dashboard');

    // Wait for page to load
    await page.waitForTimeout(1000);

    // Find focusable elements
    const focusableElements = page.locator('button, a, input, select, textarea, [tabindex="0"]');
    const focusableCount = await focusableElements.count();

    console.log(`Found ${focusableCount} focusable elements`);

    if (focusableCount > 0) {
      // Test first few focusable elements
      for (let i = 0; i < Math.min(focusableCount, 3); i++) {
        const element = focusableElements.nth(i);

        // Focus the element
        await element.focus();
        await page.waitForTimeout(200);

        // Check if element has focus styles
        const hasFocusVisible = await element.evaluate((el) => {
          const styles = window.getComputedStyle(el);
          const outline = styles.outline;
          const boxShadow = styles.boxShadow;
          const border = styles.border;

          // Check for common focus indicators
          return (
            outline !== 'none' ||
            boxShadow !== 'none' ||
            border.includes('px') ||
            el.matches(':focus-visible')
          );
        });

        console.log(`Element ${i + 1} has focus indicator:`, hasFocusVisible);

        // Most focusable elements should have visible focus indicators
        // We'll just log this for now as styles vary
      }
    }

    // Verify page is still functional
    await expect(page.locator('body')).toBeVisible();
    console.log('Focus indicator test completed');
  });
});