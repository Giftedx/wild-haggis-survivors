import { expect, test } from './fixtures';

/**
 * T407 — CroftScene mounts a visually-hidden DOM focus mirror for the
 * action column + back row, aligned with gamepad highlight order.
 */

test.describe('CroftScene DOM focus mirror', () => {
  test('mounts croft focus layer with actions, companion opt-out, and back', async ({ page }) => {
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
          start(k: string): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Croft');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Croft')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Croft scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-croft-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    await expect(layer.locator('button[data-focus-id="croft-action-start_run"]')).toBeAttached();
    await expect(layer.locator('button[data-focus-id="croft-companion-opt-out"]')).toBeAttached();
    await expect(layer.locator('button[data-focus-id="croft-back"]')).toBeAttached();

    const startBtn = layer.locator('button[data-focus-id="croft-action-start_run"]');
    const name = ((await startBtn.getAttribute('aria-label')) ?? (await startBtn.textContent()) ?? '').trim();
    expect(name.length).toBeGreaterThan(0);
    expect(name.startsWith('ui.')).toBe(false);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
