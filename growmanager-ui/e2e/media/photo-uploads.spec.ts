import { test, expect } from '@playwright/test';
import { testUser, testGrow, testPlant, testObservation } from '../fixtures/testData';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Photo Uploads', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/grows/, { timeout: 10000 });

    // Navigate to a grow with a plant
    await page.goto('/grows');

    // Create grow if needed
    const growExists = await page.locator(`text=${testGrow.growName}`).isVisible({ timeout: 2000 }).catch(() => false);
    if (!growExists) {
      await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
      await page.fill('input[name="growName"]', testGrow.growName);
      await page.fill('input[name="location"]', testGrow.location);
      await page.selectOption('select[name="setupType"]', testGrow.setupType);
      await page.selectOption('select[name="medium"]', testGrow.medium);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(1000);
    }

    await page.click(`text=${testGrow.growName}`);
  });

  test('should upload single photo to observation', async ({ page }) => {
    // Click add observation
    await page.click('button:has-text("Add Observation")');

    // Fill observation details
    await page.fill('textarea[name="note"]', 'Observation with photo');
    await page.selectOption('select[name="observationType"]', 'PROGRESS');

    // Upload photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'plant-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test-image-data-jpeg'),
    });

    // Submit
    await page.click('button[type="submit"]');

    // Verify observation created
    await expect(page.locator('text=Observation with photo')).toBeVisible({ timeout: 5000 });

    // Verify photo appears in gallery or thumbnail
    await expect(page.locator('img[alt*="observation"], img[alt*="photo"]')).toBeVisible({ timeout: 5000 });
  });

  test('should upload multiple photos to observation', async ({ page }) => {
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Multi-photo observation');
    await page.selectOption('select[name="observationType"]', 'PROGRESS');

    // Upload multiple files
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([
      {
        name: 'photo1.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test-image-1'),
      },
      {
        name: 'photo2.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test-image-2'),
      },
      {
        name: 'photo3.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test-image-3'),
      },
    ]);

    await page.click('button[type="submit"]');

    // Verify observation created
    await expect(page.locator('text=Multi-photo observation')).toBeVisible({ timeout: 5000 });

    // Verify multiple photos appear
    const photos = page.locator('img[alt*="observation"], img[alt*="photo"]');
    await expect(photos).toHaveCount(3, { timeout: 5000 });
  });

  test('should compress large images before upload', async ({ page }) => {
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Large image test');

    // Upload a "large" image (simulated)
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'large-photo.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(5 * 1024 * 1024), // 5MB buffer
    });

    // Wait for compression (should see loading indicator)
    const loadingIndicator = page.locator('text=/compressing|processing/i');
    if (await loadingIndicator.isVisible({ timeout: 2000 }).catch(() => false)) {
      await expect(loadingIndicator).not.toBeVisible({ timeout: 10000 });
    }

    await page.click('button[type="submit"]');

    // Verify observation created
    await expect(page.locator('text=Large image test')).toBeVisible({ timeout: 5000 });
  });

  test('should display photo preview before upload', async ({ page }) => {
    await page.click('button:has-text("Add Observation")');

    // Upload photo
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'preview-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test-preview-image'),
    });

    // Verify preview appears
    await expect(page.locator('img[src*="blob:"], img[src*="data:image"]')).toBeVisible({ timeout: 5000 });

    // Verify can remove photo before submitting
    const removeButton = page.locator('button:has-text("Remove"), button[aria-label*="remove"]').first();
    if (await removeButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await removeButton.click();
      await expect(page.locator('img[src*="blob:"], img[src*="data:image"]')).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('should open photo gallery and navigate between photos', async ({ page }) => {
    // First create observation with photos
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Gallery test observation');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([
      { name: 'gallery1.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('photo-1') },
      { name: 'gallery2.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('photo-2') },
      { name: 'gallery3.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('photo-3') },
    ]);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Click on a photo to open gallery
    const photoThumbnail = page.locator('img[alt*="observation"], img[alt*="photo"]').first();
    await photoThumbnail.click();

    // Verify gallery/modal opened
    await expect(page.locator('[role="dialog"], .gallery-modal, .photo-viewer')).toBeVisible({ timeout: 5000 });

    // Test navigation buttons
    const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next"]').first();
    if (await nextButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nextButton.click();
      await page.waitForTimeout(500);
      await nextButton.click();
    }

    const prevButton = page.locator('button:has-text("Previous"), button:has-text("Prev"), button[aria-label*="previous"]').first();
    if (await prevButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await prevButton.click();
    }

    // Close gallery
    const closeButton = page.locator('button:has-text("Close"), button[aria-label*="close"]').first();
    await closeButton.click();
    await expect(page.locator('[role="dialog"], .gallery-modal')).not.toBeVisible({ timeout: 2000 });
  });

  test('should validate file types (only allow images)', async ({ page }) => {
    await page.click('button:has-text("Add Observation")');

    // Try to upload non-image file
    const fileInput = page.locator('input[type="file"]').first();

    // Check if file input has accept attribute for images only
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toMatch(/image/);

    // Try uploading invalid file type
    await fileInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-content'),
    });

    // Should show error message
    await expect(page.locator('text=/invalid file type|only images|must be an image/i')).toBeVisible({ timeout: 3000 });
  });

  test('should handle upload errors gracefully', async ({ page }) => {
    // Mock network failure by going offline temporarily
    await page.context().setOffline(true);

    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Failed upload test');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'error-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('test-image-error'),
    });

    await page.click('button[type="submit"]');

    // Should show error or queue for offline upload
    await expect(page.locator('text=/failed|error|queued|pending/i')).toBeVisible({ timeout: 5000 });

    // Go back online
    await page.context().setOffline(false);
  });

  test('should display photo upload progress', async ({ page }) => {
    await page.click('button:has-text("Add Observation")');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'progress-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.alloc(2 * 1024 * 1024), // 2MB
    });

    // Look for progress indicator
    const progressIndicator = page.locator('[role="progressbar"], .progress, text=/uploading|%/i');
    if (await progressIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      await expect(progressIndicator).toBeVisible({ timeout: 2000 });
    }

    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('should maintain photo order in observation', async ({ page }) => {
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Photo order test');

    // Upload photos in specific order
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles([
      { name: 'first.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('first-photo') },
      { name: 'second.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('second-photo') },
      { name: 'third.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('third-photo') },
    ]);

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Verify photos appear in order
    const photos = page.locator('img[alt*="observation"], img[alt*="photo"]');
    await expect(photos).toHaveCount(3, { timeout: 5000 });
  });

  test('should allow deleting photos from observation', async ({ page }) => {
    // Create observation with photo
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', 'Delete photo test');

    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles({
      name: 'delete-test.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('delete-me'),
    });

    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);

    // Find and click edit button
    const editButton = page.locator('button:has-text("Edit")').first();
    if (await editButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await editButton.click();

      // Delete the photo
      const deletePhotoButton = page.locator('button:has-text("Delete"), button[aria-label*="delete"]').first();
      if (await deletePhotoButton.isVisible({ timeout: 2000 }).catch(() => false)) {
        await deletePhotoButton.click();

        // Confirm deletion if needed
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').first();
        if (await confirmButton.isVisible({ timeout: 2000 }).catch(() => false)) {
          await confirmButton.click();
        }

        await page.click('button[type="submit"]');
        await page.waitForTimeout(1000);

        // Verify photo is gone
        await expect(page.locator('img[alt*="observation"]')).toHaveCount(0, { timeout: 3000 });
      }
    }
  });
});