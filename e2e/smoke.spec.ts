import { GAME_CANVAS_ARIA_LABEL } from '../src/constants/gameCanvasA11y';
import { expect, test } from './fixtures';

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
    // main.ts sets role + aria-label in `callbacks.postBoot` — stricter than any stray canvas.
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await expect(canvas).toHaveAttribute('aria-label', GAME_CANVAS_ARIA_LABEL);
    // User gesture: exercises audio unlock + input paths without relying on gamepad.
    await canvas.click({ position: { x: 8, y: 8 } });

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(
      versionConsoleErrors,
      `Console errors mentioning __APP_VERSION__:\n${versionConsoleErrors.join('\n')}`,
    ).toEqual([]);
  });
});
