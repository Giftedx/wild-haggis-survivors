import { expect, test } from './fixtures';
import path from 'node:path';

/**
 * T408 — visual regression at uiScale 1.4 + mobile viewport.
 *
 * Two-part gate:
 *   1. **Design-verify writes** — `canvas.screenshot({ path: ... })` lands a
 *      reference shot under `design-verify-screens/visual-regression/` for
 *      reviewers to eyeball on each PR. That directory is git-ignored, so
 *      these are local artefacts only.
 *   2. **Thresholded diff (T408 upgrade)** — `expect(canvas).toHaveScreenshot()`
 *      compares against committed baselines under
 *      `e2e/visual-regression.spec.ts-snapshots/`. Diff budgets are
 *      per-scene: MainMenu 5%, Croft 30% (Croft animates a hearth fire +
 *      Gran's idle pulse so its natural inter-run variance is higher).
 *
 * Why per-scene thresholds: Phaser canvas variance from random-seeded particle
 * drift, ambient wind, and GPU driver differences across runners produces
 * >1% pixel deltas even on byte-identical scene graphs (cited in CLAUDE.md
 * "Phaser 4 Gotchas" / fixed-step section). The thresholds are loose enough
 * to absorb that wobble but tight enough to catch gross layout regressions
 * (those produce 50%+ deltas from sprite repositioning). Tighten as scenes
 * prove stable under repeat runs.
 *
 * **Update procedure:** when a deliberate visual change ships, run
 * `npx playwright test visual-regression --update-snapshots --project=chromium-desktop`
 * and commit the regenerated PNGs under `e2e/visual-regression.spec.ts-snapshots/`.
 *
 * **Cross-OS note (T409):** Playwright suffixes baseline PNGs with `{platform}`
 * (e.g. `-win32`, `-linux`, `-darwin`). Baselines from one OS won't satisfy
 * a different OS's runner — Playwright reports "missing baseline" instead.
 * Initial baselines were captured on `-win32`; the diff comparison is
 * deliberately gated to `process.platform === 'win32'` below until linux
 * baselines are regenerated under CI (T409). On linux the spec still runs
 * the design-verify writes for parity but skips the comparison step. The
 * fix is to regen via `--update-snapshots --project=chromium-desktop` on
 * linux (locally via Docker or via a one-off CI artifact pull) and commit
 * the `-linux` PNGs alongside the existing `-win32` ones, then drop the
 * `process.platform` guard.
 *
 * Currently scoped to **chromium-desktop only**. Webkit + Firefox baselines
 * are out of scope (DPR / GPU-driver variance would require per-engine
 * baseline sets). The mobile-viewport test runs on the same chromium engine
 * via `setViewportSize`, so it shares the chromium baseline. On firefox /
 * webkit projects the spec still produces the design-verify writes but skips
 * the diff comparison.
 */

const OUT_DIR = 'design-verify-screens/visual-regression';

// Diff thresholds. `maxDiffPixelRatio` is dimension-independent (the desktop
// and mobile canvases differ in size), so we use it instead of `maxDiffPixels`.
// `threshold` is the per-pixel colour delta tolerance (0..1) — 0.2 is
// Playwright's default; explicit here so future readers know it's intentional.
//
// Per-scene tuning: MainMenu is mostly static text/UI so 5% catches real
// layout regressions. Croft has the hearth fire, ambient drones, and Gran's
// idle pulse — measured natural variance is ~14% even with 600ms settle, so
// we widen its budget to 30% to cover one or two more animation tiers without
// flaking. Both still trip on gross layout regressions (those produce 50%+
// deltas from sprite repositioning, which is the real failure mode we care
// about). Tighten as the canvas proves stable under repeat runs.
const DIFF_OPTIONS_MENU = {
  maxDiffPixelRatio: 0.05,
  threshold: 0.2,
} as const;

const DIFF_OPTIONS_CROFT = {
  maxDiffPixelRatio: 0.3,
  threshold: 0.2,
} as const;

// Extra settle time before the diff snap so particle systems / drone-pulse
// animations have a chance to reach their resting state. The original
// design-verify capture used 400 ms; the diff comparison needs a bit more
// margin to avoid mid-animation frame captures.
const SETTLE_MS = 600;

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

  test('MainMenu + Croft at uiScale 1.4 (desktop)', async ({ page, browserName }) => {
    // Diff baselines are chromium-only. Other engines still run the
    // design-verify writes for parity but skip the comparison step.
    // T409: gate to win32 until linux baselines regenerated under CI.
    const compareDiff = browserName === 'chromium' && process.platform === 'win32';

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

    // Capture MainMenu — write design-verify reference + thresholded diff.
    await canvas.screenshot({ path: path.join(OUT_DIR, 'main-menu-1.4x.png') });
    if (compareDiff) {
      await page.waitForTimeout(SETTLE_MS);
      await expect(canvas).toHaveScreenshot('main-menu-1.4x.png', DIFF_OPTIONS_MENU);
    }

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
    if (compareDiff) {
      await page.waitForTimeout(SETTLE_MS);
      await expect(canvas).toHaveScreenshot('croft-1.4x.png', DIFF_OPTIONS_CROFT);
    }
  });

  test('MainMenu + Croft at iPhone viewport', async ({ page, browser, browserName }) => {
    // Reuse iPhone 13 viewport regardless of which project the runner picked.
    // Skip on browsers where viewport emulation isn't reliable for our boot path.
    test.skip(browserName === 'webkit', 'iPhone emulation only on chromium runners');
    // T409: gate to win32 until linux baselines regenerated under CI.
    const compareDiff = browserName === 'chromium' && process.platform === 'win32';
    await page.setViewportSize({ width: 390, height: 664 });
    void browser;

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await page.waitForTimeout(800);

    await canvas.screenshot({ path: path.join(OUT_DIR, 'main-menu-mobile.png') });
    if (compareDiff) {
      await page.waitForTimeout(SETTLE_MS);
      await expect(canvas).toHaveScreenshot('main-menu-mobile.png', DIFF_OPTIONS_MENU);
    }

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
    if (compareDiff) {
      await page.waitForTimeout(SETTLE_MS);
      await expect(canvas).toHaveScreenshot('croft-mobile.png', DIFF_OPTIONS_CROFT);
    }
  });
});
