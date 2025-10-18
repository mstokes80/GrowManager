import { test, expect } from '@playwright/test';
import { testUser } from '../fixtures/testData';

test.describe('Authentication Flows', () => {
  test('should complete registration flow', async ({ page }) => {
    // Navigate to registration page
    await page.goto('/register');
    
    // Fill out registration form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="displayName"]', testUser.displayName);
    await page.fill('input[name="password"]', testUser.password);
    await page.fill('input[name="confirmPassword"]', testUser.password);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message or redirect
    await expect(page).toHaveURL(/\/verify-email|\/login/, { timeout: 10000 });
  });

  test('should complete login flow', async ({ page }) => {
    await page.goto('/login');
    
    // Fill login form
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    
    // Submit
    await page.click('button[type="submit"]');
    
    // Verify successful login (redirected to dashboard)
    await expect(page).toHaveURL(/\/dashboard|\/grows/, { timeout: 10000 });
  });

  test('should handle failed login attempts', async ({ page }) => {
    await page.goto('/login');
    
    // Attempt login with wrong password
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');
    
    // Verify error message
    await expect(page.locator('text=/invalid credentials|incorrect password/i')).toBeVisible({ timeout: 5000 });
  });

  test('should initiate password reset flow', async ({ page }) => {
    await page.goto('/forgot-password');
    
    // Enter email
    await page.fill('input[name="email"]', testUser.email);
    await page.click('button[type="submit"]');
    
    // Verify success message
    await expect(page.locator('text=/check your email|reset link sent/i')).toBeVisible({ timeout: 5000 });
  });

  test('should maintain session after page reload', async ({ page, context }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/dashboard|\/grows/, { timeout: 10000 });
    
    // Reload page
    await page.reload();
    
    // Should still be logged in
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect
    await page.waitForURL(/\/dashboard|\/grows/, { timeout: 10000 });
    
    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign Out")').first();
    await logoutButton.click();
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/, { timeout: 5000 });
  });
});
