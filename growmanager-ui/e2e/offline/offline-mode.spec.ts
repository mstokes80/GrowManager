import { test, expect } from '@playwright/test';
import { testUser, testGrow, testPlant, testObservation } from '../fixtures/testData';

test.describe('Offline Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/grows/, { timeout: 10000 });
  });

  test('should detect offline status', async ({ page, context }) => {
    // Navigate to a page
    await page.goto('/grows');

    // Simulate offline mode
    await context.setOffline(true);

    // Verify offline indicator is shown
    await expect(page.locator('text=/offline|no connection/i')).toBeVisible({ timeout: 5000 });
  });

  test('should allow creating grow while offline', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Navigate to grows page
    await page.goto('/grows');

    // Create a grow
    await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
    await page.fill('input[name="growName"]', 'Offline Grow');
    await page.fill('input[name="location"]', 'Offline Location');
    await page.selectOption('select[name="setupType"]', 'INDOOR');
    await page.selectOption('select[name="medium"]', 'SOIL');
    await page.click('button[type="submit"]');

    // Verify grow appears in local list
    await expect(page.locator('text=Offline Grow')).toBeVisible({ timeout: 5000 });

    // Verify offline indicator or pending sync badge
    await expect(page.locator('text=/pending|not synced|offline/i')).toBeVisible({ timeout: 5000 });
  });

  test('should allow adding plant while offline', async ({ page, context }) => {
    // First create a grow while online
    await page.goto('/grows');
    await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
    await page.fill('input[name="growName"]', testGrow.growName);
    await page.fill('input[name="location"]', testGrow.location);
    await page.selectOption('select[name="setupType"]', testGrow.setupType);
    await page.selectOption('select[name="medium"]', testGrow.medium);
    await page.click('button[type="submit"]');
    await expect(page.locator(`text=${testGrow.growName}`)).toBeVisible({ timeout: 5000 });

    // Go offline
    await context.setOffline(true);

    // Add plant
    await page.click(`text=${testGrow.growName}`);
    await page.click('button:has-text("Add Plant")');
    await page.fill('input[name="plantTag"]', 'OFFLINE-001');
    await page.selectOption('select[name="stage"]', 'SEEDLING');
    await page.click('button[type="submit"]');

    // Verify plant appears
    await expect(page.locator('text=OFFLINE-001')).toBeVisible({ timeout: 5000 });
  });

  test('should allow adding observation while offline', async ({ page, context }) => {
    // Navigate to a grow with a plant
    await page.goto('/grows');
    await page.click(`text=${testGrow.growName}`);

    // Go offline
    await context.setOffline(true);

    // Add observation
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Offline observation note');
    await page.selectOption('select[name="observationType"]', 'PROGRESS');
    await page.click('button[type="submit"]');

    // Verify observation appears
    await expect(page.locator('text=Offline observation note')).toBeVisible({ timeout: 5000 });
  });

  test('should sync offline changes when back online', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Create data offline
    await page.goto('/grows');
    await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
    await page.fill('input[name="growName"]', 'Sync Test Grow');
    await page.fill('input[name="location"]', 'Sync Location');
    await page.selectOption('select[name="setupType"]', 'INDOOR');
    await page.selectOption('select[name="medium"]', 'HYDROPONIC');
    await page.click('button[type="submit"]');

    // Verify offline indicator
    await expect(page.locator('text=/pending|not synced/i')).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);

    // Trigger sync (might be automatic or via button)
    const syncButton = page.locator('button:has-text("Sync"), button:has-text("Retry")').first();
    if (await syncButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await syncButton.click();
    }

    // Wait for sync to complete
    await page.waitForTimeout(3000);

    // Verify sync indicator is gone
    await expect(page.locator('text=/pending|not synced/i')).not.toBeVisible({ timeout: 10000 });
  });

  test('should handle offline photo queue', async ({ page, context }) => {
    // Navigate to a grow with a plant
    await page.goto('/grows');
    await page.click(`text=${testGrow.growName}`);

    // Go offline
    await context.setOffline(true);

    // Try to add observation with photo
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Observation with offline photo');

    // Upload photo (if file input is available)
    const fileInput = page.locator('input[type="file"]').first();
    if (await fileInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      // Create a small test image file
      await fileInput.setInputFiles({
        name: 'test-photo.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake-image-data'),
      });
    }

    await page.click('button[type="submit"]');

    // Verify observation created with pending photo
    await expect(page.locator('text=Observation with offline photo')).toBeVisible({ timeout: 5000 });
  });

  test('should display pending sync count', async ({ page, context }) => {
    // Go offline
    await context.setOffline(true);

    // Create multiple items
    await page.goto('/grows');

    for (let i = 1; i <= 3; i++) {
      await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
      await page.fill('input[name="growName"]', `Offline Grow ${i}`);
      await page.fill('input[name="location"]', `Location ${i}`);
      await page.selectOption('select[name="setupType"]', 'INDOOR');
      await page.selectOption('select[name="medium"]', 'SOIL');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(500);
    }

    // Check for pending sync count indicator
    const syncIndicator = page.locator('text=/3 pending|3 items|3 changes/i');
    await expect(syncIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should preserve offline data across page reload', async ({ page, context }) => {
    // Go offline and create data
    await context.setOffline(true);
    await page.goto('/grows');
    await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
    await page.fill('input[name="growName"]', 'Persistent Grow');
    await page.fill('input[name="location"]', 'Persistent Location');
    await page.selectOption('select[name="setupType"]', 'OUTDOOR');
    await page.selectOption('select[name="medium"]', 'SOIL');
    await page.click('button[type="submit"]');

    // Verify created
    await expect(page.locator('text=Persistent Grow')).toBeVisible({ timeout: 5000 });

    // Reload page while still offline
    await page.reload();

    // Verify data still exists
    await expect(page.locator('text=Persistent Grow')).toBeVisible({ timeout: 5000 });
  });
});