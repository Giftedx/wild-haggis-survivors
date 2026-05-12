import { expect, test } from './fixtures';

/**
 * T407 — MainMenuScene hub mounts a visually-hidden DOM focus mirror aligned
 * with gamepad row order (start, optional abandon, daily, meta, reflection
 * row, options).
 */

test.describe('MainMenuScene DOM focus mirror', () => {
  test('mounts focus layer with stable data-focus-id buttons', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const layer = page.locator('[data-whs-dom-focus-layer="whs-main-menu-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const startBtn = layer.locator('button[data-focus-id="main-start"]');
    await expect(startBtn).toBeAttached();
    const dailyBtn = layer.locator('button[data-focus-id="main-daily"]');
    await expect(dailyBtn).toBeAttached();
    const metaBtn = layer.locator('button[data-focus-id="main-meta"]');
    await expect(metaBtn).toBeAttached();
    const optionsBtn = layer.locator('button[data-focus-id="main-options"]');
    await expect(optionsBtn).toBeAttached();

    for (const btn of [startBtn, dailyBtn, metaBtn, optionsBtn]) {
      const ariaLabel = await btn.getAttribute('aria-label');
      const text = await btn.textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, 'accessible name must be non-empty').toBeGreaterThan(0);
      expect(effective.startsWith('ui.'), 'must not leak i18n key').toBe(false);
    }

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
