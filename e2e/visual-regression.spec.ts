import { expect, test } from './fixtures';
import path from 'node:path';

/**
 * T408 — visual regression capture at uiScale 1.4 + mobile viewport.
 *
 * NOT a hard CI gate. A real `toHaveScreenshot` diff harness on a Phaser
 * canvas is fragile: random-seeded particle drift, ambient wind, GPU
 * driver differences between runners — all produce >1% pixel deltas
 * even on byte-identical scene graphs.
 *
 * What this spec DOES do is capture a reference shot of MainMenu /
 * Croft / first-run-frame at uiScale 1.4 (the highest a11y scale) and
 * at the iPhone-emulated mobile viewport, so a reviewer can eyeball
 * layout regressions on each PR. The output lands under
 * `design-verify-screens/visual-regression/` next to the existing
 * design-verify spec's outputs (well-known location).
 *
 * If a future audit wants real pixel-diff CI, the upgrade path is:
 *   1. Add `expect(canvas).toHaveScreenshot('main-menu-1.4x.png',
 *      { maxDiffPixelRatio: 0.05 })` next to each `canvas.screenshot`.
 *   2. Commit the baselines once the spec runs locally.
 *   3. Tighten the ratio as the canvas proves stable.
 */

const OUT_DIR = 'design-verify-screens/visual-regression';

// Use the shared fixture (FORCE_CANVAS + photosensitivity-warning-seen)
// so the captures don't have to re-establish that boot state per case.
test.describe('T408 visual regression — high-uiScale + mobile', () => {
  test.beforeEach(async ({ page }) => {
    // Skip the tutorial first-run path so the captures aren't dominated
    // by the tutorial overlay.
    await page.addInitScript(() => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: 9,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    });
  });

  test('MainMenu + Croft at uiScale 1.4 (desktop)', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        const settingsRaw = localStorage.getItem('whs_game_settings');
        const settings = (settingsRaw
          ? (JSON.parse(settingsRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_game_settings', JSON.stringify({
          ...settings,
          uiScale: 1.4,
        }));
      } catch {
        /* ignore */
      }
    });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await page.waitForTimeout(800);

    // Capture MainMenu first.
    await canvas.screenshot({ path: path.join(OUT_DIR, 'main-menu-1.4x.png') });

    // Drive into Croft and capture again.
    await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return;
      g.scene.start('Croft');
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Croft')) return;
        await new Promise((r) => setTimeout(r, 50));
      }
    });
    await page.waitForTimeout(400);
    await canvas.screenshot({ path: path.join(OUT_DIR, 'croft-1.4x.png') });
  });

  test('MainMenu + Croft at iPhone viewport', async ({ page, browser, browserName }) => {
    // Reuse iPhone 13 viewport regardless of which project the runner picked.
    // Skip on browsers where viewport emulation isn't reliable for our boot path.
    test.skip(browserName === 'webkit', 'iPhone emulation only on chromium runners');
    await page.setViewportSize({ width: 390, height: 664 });
    void browser;

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await page.waitForTimeout(800);

    await canvas.screenshot({ path: path.join(OUT_DIR, 'main-menu-mobile.png') });

    await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return;
      g.scene.start('Croft');
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Croft')) return;
        await new Promise((r) => setTimeout(r, 50));
      }
    });
    await page.waitForTimeout(400);
    await canvas.screenshot({ path: path.join(OUT_DIR, 'croft-mobile.png') });
  });
});
