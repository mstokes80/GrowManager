import { test, expect } from '@playwright/test';
import { testUser, testGrow, testCultivar, testPlant, testObservation } from '../fixtures/testData';

test.describe('Core Workflows', () => {
  // Helper to login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', testUser.email);
    await page.fill('input[name="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard|\/grows/, { timeout: 10000 });
  });

  test('should complete full user journey: create grow → add plants → log activities → add observations → log harvest', async ({ page }) => {
    // Step 1: Create a grow
    await page.goto('/grows');
    await page.click('button:has-text("New Grow"), button:has-text("Create Grow")');
    
    await page.fill('input[name="growName"]', testGrow.growName);
    await page.fill('input[name="location"]', testGrow.location);
    await page.selectOption('select[name="setupType"]', testGrow.setupType);
    await page.selectOption('select[name="medium"]', testGrow.medium);
    await page.click('button[type="submit"]');
    
    // Wait for grow to be created
    await expect(page.locator(`text=${testGrow.growName}`)).toBeVisible({ timeout: 5000 });
    
    // Step 2: Add a plant
    await page.click(`text=${testGrow.growName}`);
    await page.click('button:has-text("Add Plant")');
    
    await page.fill('input[name="plantTag"]', testPlant.plantTag);
    await page.selectOption('select[name="stage"]', testPlant.stage);
    await page.click('button[type="submit"]');
    
    // Verify plant created
    await expect(page.locator(`text=${testPlant.plantTag}`)).toBeVisible({ timeout: 5000 });
    
    // Step 3: Log an activity (watering)
    await page.click('button:has-text("Log Activity"), button:has-text("Log Feeding")');
    await page.selectOption('select[name="activityType"]', 'WATERING');
    await page.fill('textarea[name="description"]', 'Watered plant with pH balanced water');
    await page.click('button[type="submit"]');
    
    // Verify activity logged
    await expect(page.locator('text=/watered|watering/i')).toBeVisible({ timeout: 5000 });
    
    // Step 4: Add an observation with note
    await page.click('button:has-text("Add Observation")');
    await page.fill('textarea[name="note"]', testObservation.note);
    await page.selectOption('select[name="observationType"]', testObservation.observationType);
    await page.click('button[type="submit"]');
    
    // Verify observation added
    await expect(page.locator(`text=${testObservation.note}`)).toBeVisible({ timeout: 5000 });
    
    // Step 5: Log harvest
    await page.click('button:has-text("Log Harvest")');
    await page.fill('input[name="wetWeight"]', '500');
    await page.fill('input[name="dryWeight"]', '100');
    await page.click('button[type="submit"]');
    
    // Verify harvest logged
    await expect(page.locator('text=/harvest|harvested/i')).toBeVisible({ timeout: 5000 });
  });

  test('should manage cultivars', async ({ page }) => {
    // Navigate to cultivars
    await page.goto('/cultivars');
    
    // Create new cultivar
    await page.click('button:has-text("New Cultivar"), button:has-text("Add Cultivar")');
    await page.fill('input[name="name"]', testCultivar.name);
    await page.selectOption('select[name="type"]', testCultivar.type);
    await page.fill('input[name="breeder"]', testCultivar.breeder);
    await page.click('button[type="submit"]');
    
    // Verify cultivar created
    await expect(page.locator(`text=${testCultivar.name}`)).toBeVisible({ timeout: 5000 });
    
    // Edit cultivar
    await page.click(`text=${testCultivar.name}`);
    await page.click('button:has-text("Edit")');
    await page.fill('input[name="name"]', `${testCultivar.name} Updated`);
    await page.click('button[type="submit"]');
    
    // Verify update
    await expect(page.locator(`text=${testCultivar.name} Updated`)).toBeVisible({ timeout: 5000 });
  });

  test('should log environmental data', async ({ page }) => {
    // Navigate to a grow
    await page.goto('/grows');
    await page.click(`text=${testGrow.growName}`);
    
    // Log environmental data
    await page.click('button:has-text("Log Environment")');
    await page.fill('input[name="temperature"]', '75');
    await page.fill('input[name="humidity"]', '60');
    await page.fill('input[name="co2"]', '1200');
    await page.click('button[type="submit"]');
    
    // Verify data logged
    await expect(page.locator('text=/75|60|1200/')).toBeVisible({ timeout: 5000 });
  });
});
