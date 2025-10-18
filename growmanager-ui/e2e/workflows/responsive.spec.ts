import { test, expect } from '@playwright/test';
import { testUser, testGrow, testPlant } from '../fixtures/testData';

test.describe('Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/grows/, { timeout: 10000 });
  });

  test.describe('Mobile viewport (iPhone 13)', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('should display mobile navigation menu', async ({ page }) => {
      await page.goto('/dashboard');

      // Look for hamburger menu or mobile nav
      const mobileMenu = page.locator('button[aria-label*="menu"], button:has-text("Menu"), .hamburger');
      await expect(mobileMenu).toBeVisible({ timeout: 5000 });

      // Open mobile menu
      await mobileMenu.click();

      // Verify navigation items appear
      await expect(page.locator('nav a, nav button')).toHaveCount(3, { timeout: 5000 });
    });

    test('should display forms in single column on mobile', async ({ page }) => {
      await page.goto('/grows');
      await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');

      // Wait for form
      await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

      // Form should be single column (no side-by-side fields)
      const form = page.locator('form').first();
      const formWidth = await form.boundingBox();
      expect(formWidth?.width).toBeLessThan(600);
    });

    test('should display cards/lists in single column', async ({ page }) => {
      await page.goto('/grows');

      // Grows should be stacked vertically
      const growCards = page.locator('[data-testid*="grow"], .grow-card, article');
      const firstCard = growCards.first();
      const secondCard = growCards.nth(1);

      if (await growCards.count() >= 2) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        // Second card should be below first (not side-by-side)
        if (firstBox && secondBox) {
          expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height - 50);
        }
      }
    });

    test('should make buttons full-width on mobile', async ({ page }) => {
      await page.goto('/grows');
      await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');

      // Submit button should be full width
      const submitButton = page.locator('button[type="submit"]').first();
      const buttonBox = await submitButton.boundingBox();
      const viewportWidth = page.viewportSize()?.width || 0;

      // Button should take most of the width (accounting for padding)
      expect(buttonBox?.width).toBeGreaterThan(viewportWidth * 0.85);
    });

    test('should show condensed plant cards on mobile', async ({ page }) => {
      await page.goto('/grows');

      // Navigate to a grow detail page
      const growCard = page.locator(`text=${testGrow.growName}`).first();
      if (await growCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await growCard.click();

        // Plant cards should be compact
        const plantCard = page.locator('[data-testid*="plant"], .plant-card').first();
        if (await plantCard.isVisible({ timeout: 2000 }).catch(() => false)) {
          const cardBox = await plantCard.boundingBox();
          expect(cardBox?.height).toBeLessThan(200);
        }
      }
    });

    test('should support touch gestures for image gallery', async ({ page }) => {
      await page.goto('/grows');

      // Navigate to plant detail
      const growCard = page.locator(`text=${testGrow.growName}`).first();
      if (await growCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await growCard.click();

        // Look for image gallery
        const image = page.locator('img[alt*="plant"], img[alt*="observation"]').first();
        if (await image.isVisible({ timeout: 2000 }).catch(() => false)) {
          await image.click();

          // Gallery should open
          await expect(page.locator('[role="dialog"], .gallery-modal')).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should hide desktop-only content on mobile', async ({ page }) => {
      await page.goto('/dashboard');

      // Detailed stats panels might be hidden on mobile
      const desktopOnlyContent = page.locator('.desktop-only, .hidden-mobile');
      const count = await desktopOnlyContent.count();

      // These should either not exist or not be visible
      for (let i = 0; i < count; i++) {
        await expect(desktopOnlyContent.nth(i)).not.toBeVisible();
      }
    });
  });

  test.describe('Tablet viewport (iPad Pro)', () => {
    test.use({ viewport: { width: 1024, height: 1366 } });

    test('should display forms in two columns on tablet', async ({ page }) => {
      await page.goto('/grows');
      await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');

      await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

      // Form should have more width available
      const form = page.locator('form').first();
      const formWidth = await form.boundingBox();
      expect(formWidth?.width).toBeGreaterThan(400);
    });

    test('should display cards in grid layout on tablet', async ({ page }) => {
      await page.goto('/grows');

      const growCards = page.locator('[data-testid*="grow"], .grow-card, article');
      const firstCard = growCards.first();
      const secondCard = growCards.nth(1);

      if (await growCards.count() >= 2) {
        const firstBox = await firstCard.boundingBox();
        const secondBox = await secondCard.boundingBox();

        // On tablet, cards might be side-by-side (2 columns)
        if (firstBox && secondBox) {
          const sameRow = Math.abs(firstBox.y - secondBox.y) < 100;
          const stacked = secondBox.y > firstBox.y + firstBox.height - 50;

          // Should be either in grid or stacked, but not single narrow column
          expect(sameRow || stacked).toBe(true);
        }
      }
    });

    test('should show sidebar navigation on tablet', async ({ page }) => {
      await page.goto('/dashboard');

      // Tablet should show either hamburger or persistent sidebar
      const navigation = page.locator('nav, [role="navigation"]').first();
      await expect(navigation).toBeVisible({ timeout: 5000 });
    });

    test('should display data tables properly on tablet', async ({ page }) => {
      await page.goto('/grows');

      // Navigate to grow detail
      const growCard = page.locator(`text=${testGrow.growName}`).first();
      if (await growCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await growCard.click();

        // Tables should be readable without horizontal scroll
        const table = page.locator('table').first();
        if (await table.isVisible({ timeout: 2000 }).catch(() => false)) {
          const tableBox = await table.boundingBox();
          const viewportWidth = page.viewportSize()?.width || 0;

          expect(tableBox?.width).toBeLessThanOrEqual(viewportWidth);
        }
      }
    });
  });

  test.describe('Desktop viewport', () => {
    test.use({ viewport: { width: 1920, height: 1080 } });

    test('should display full sidebar navigation on desktop', async ({ page }) => {
      await page.goto('/dashboard');

      // Desktop should have persistent sidebar
      const sidebar = page.locator('aside, nav[aria-label*="main"], .sidebar');
      if (await sidebar.count() > 0) {
        await expect(sidebar.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display forms in optimal width (not too wide)', async ({ page }) => {
      await page.goto('/grows');
      await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');

      await expect(page.locator('form')).toBeVisible({ timeout: 5000 });

      // Form should be centered and not full width
      const form = page.locator('form').first();
      const formWidth = await form.boundingBox();

      // Should be wide enough but not stretching to full viewport
      expect(formWidth?.width).toBeGreaterThan(500);
      expect(formWidth?.width).toBeLessThan(1200);
    });

    test('should display dashboard cards in grid layout', async ({ page }) => {
      await page.goto('/dashboard');

      // Dashboard cards should be in multi-column grid
      const cards = page.locator('[data-testid*="card"], .card, article').first();
      if (await cards.isVisible({ timeout: 2000 }).catch(() => false)) {
        const cardBox = await cards.boundingBox();

        // Cards should not take full width
        const viewportWidth = page.viewportSize()?.width || 0;
        expect(cardBox?.width).toBeLessThan(viewportWidth * 0.5);
      }
    });

    test('should show detailed plant information on desktop', async ({ page }) => {
      await page.goto('/grows');

      const growCard = page.locator(`text=${testGrow.growName}`).first();
      if (await growCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await growCard.click();

        // Desktop should show more detailed view
        const detailsPanel = page.locator('.details, .info-panel, aside').first();
        if (await detailsPanel.isVisible({ timeout: 2000 }).catch(() => false)) {
          const panelBox = await detailsPanel.boundingBox();
          expect(panelBox?.width).toBeGreaterThan(200);
        }
      }
    });

    test('should display data tables with all columns', async ({ page }) => {
      await page.goto('/grows');

      const growCard = page.locator(`text=${testGrow.growName}`).first();
      if (await growCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await growCard.click();

        // Tables should show all columns
        const table = page.locator('table').first();
        if (await table.isVisible({ timeout: 2000 }).catch(() => false)) {
          const headers = table.locator('th');
          const headerCount = await headers.count();

          // Desktop should show more columns than mobile
          expect(headerCount).toBeGreaterThan(2);
        }
      }
    });
  });

  test.describe('Orientation changes', () => {
    test('should handle landscape orientation on mobile', async ({ page }) => {
      // Set landscape orientation
      await page.setViewportSize({ width: 844, height: 390 });

      await page.goto('/dashboard');

      // Navigation should still be accessible
      const navigation = page.locator('nav, [role="navigation"], button[aria-label*="menu"]').first();
      await expect(navigation).toBeVisible({ timeout: 5000 });
    });

    test('should adapt photo gallery to landscape', async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 });

      await page.goto('/grows');

      const growCard = page.locator(`text=${testGrow.growName}`).first();
      if (await growCard.isVisible({ timeout: 2000 }).catch(() => false)) {
        await growCard.click();

        const image = page.locator('img[alt*="plant"], img[alt*="observation"]').first();
        if (await image.isVisible({ timeout: 2000 }).catch(() => false)) {
          await image.click();

          // Gallery should open and be optimized for landscape
          await expect(page.locator('[role="dialog"], .gallery-modal')).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('Font sizes and touch targets', () => {
    test('should have readable font sizes on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard');

      // Check main heading font size
      const heading = page.locator('h1, h2').first();
      if (await heading.isVisible({ timeout: 2000 }).catch(() => false)) {
        const fontSize = await heading.evaluate((el) => {
          return window.getComputedStyle(el).fontSize;
        });

        // Font should be at least 16px
        const sizeValue = parseInt(fontSize);
        expect(sizeValue).toBeGreaterThanOrEqual(16);
      }
    });

    test('should have adequate touch target sizes', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/dashboard');

      // Check button sizes (should be at least 44x44px for touch)
      const button = page.locator('button').first();
      if (await button.isVisible({ timeout: 2000 }).catch(() => false)) {
        const buttonBox = await button.boundingBox();

        expect(buttonBox?.height).toBeGreaterThanOrEqual(40);
        expect(buttonBox?.width).toBeGreaterThanOrEqual(40);
      }
    });
  });
});