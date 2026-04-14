import { test, expect } from '@playwright/test';

test.describe('production build smoke', () => {
  test('serves the app title and mounts a Phaser canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Wild Haggis Survivors/i);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
  });
});
