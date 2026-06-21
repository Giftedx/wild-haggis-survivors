import path from 'node:path';
import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * Boot-splash verification — catches the Highland-dawn sequence
 * before BootScene auto-transitions to MainMenu (~2.2s total).
 *
 * Snaps three timing points during the reveal:
 *   t≈0.9s  — sky + stars + first mountains
 *   t≈1.4s — dawn glow + heather + title + mascot (peak)
 *   t≈1.9s — pre-fadeout, full composition held
 */

const OUT_DIR = path.resolve(process.cwd(), 'design-verify-screens');

test.describe('DESIGN.md boot splash capture', () => {
  // Single-reference screenshot harness — see design-verify.spec.ts. Chromium is
  // the design reference; FF/WK headless WebGL flakes on the timed reveal snaps
  // and clobber the shared PNG dir (no browser suffix). Chromium-only by convention.
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'single-reference screenshot harness; chromium is the design reference (FF/WK headless WebGL flakes)',
  );
  test.setTimeout(30_000);

  test('catches the Highland-dawn sequence', async ({ page }) => {
    await page.addInitScript((ver) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: ver,
          hasCompletedTutorial: true,
          gold: 0,
          permanentUpgrades: {},
        }));
      } catch { /* ignore */ }
    }, CURRENT_META_SAVE_VERSION);

    // Navigate — this kicks Phaser boot + BootScene.create.
    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    // Don't click (no gesture) — audio isn't needed and a click could
    // affect focus timing. Just race the tween.
    const start = Date.now();

    // Three snap points relative to canvas-visible. Use absolute targets
    // and sleep only the delta so we don't over-wait.
    const targets = [
      { name: '01a-boot-splash-early',  atMs: 900 },
      { name: '01b-boot-splash-peak',   atMs: 1400 },
      { name: '01c-boot-splash-held',   atMs: 1850 },
    ];

    for (const t of targets) {
      const elapsed = Date.now() - start;
      const wait = Math.max(0, t.atMs - elapsed);
      if (wait > 0) await page.waitForTimeout(wait);
      await canvas.screenshot({ path: path.join(OUT_DIR, `${t.name}.png`) });
    }
  });
});
