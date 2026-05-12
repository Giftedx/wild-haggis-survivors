import { expect, test } from './fixtures';

/**
 * T407 — MenuScene (loadout / variant carousel) DOM focus mirror.
 */

test.describe('MenuScene DOM focus mirror', () => {
  test('mounts loadout focus layer after navigating to Menu', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const sceneStarted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Menu');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Menu')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Menu scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-menu-loadout-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    await expect(layer.locator('button[data-focus-id="loadout-play"]')).toBeAttached();
    await expect(layer.locator('button[data-focus-id="loadout-upgrades"]')).toBeAttached();
    await expect(layer.locator('button[data-focus-id="loadout-carousel-prev"]')).toBeAttached();
    await expect(layer.locator('button[data-focus-id="loadout-carousel-next"]')).toBeAttached();

    const playBtn = layer.locator('button[data-focus-id="loadout-play"]');
    const name = ((await playBtn.getAttribute('aria-label')) ?? (await playBtn.textContent()) ?? '').trim();
    expect(name.length).toBeGreaterThan(0);
    expect(name.startsWith('ui.')).toBe(false);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
