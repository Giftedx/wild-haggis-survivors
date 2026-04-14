import { test, expect } from '@playwright/test';

test.describe('production build smoke', () => {
  test('serves the app title and mounts a Phaser canvas', async ({ page }) => {
    const pageErrors: string[] = [];
    const versionConsoleErrors: string[] = [];

    page.on('pageerror', (err) => {
      pageErrors.push(err.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error' && msg.text().includes('__APP_VERSION__')) {
        versionConsoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await expect(page).toHaveTitle(/Wild Haggis Survivors/i);
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    // User gesture: exercises audio unlock + input paths without relying on gamepad.
    await canvas.click({ position: { x: 8, y: 8 } });

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(
      versionConsoleErrors,
      `Console errors mentioning __APP_VERSION__:\n${versionConsoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
