import { expect, test } from './fixtures';

/**
 * W71 atlas bake budget — browser-side boot guard.
 *
 * The W71 runtime hot path is covered by `animationPerf.bench.test.ts`;
 * this smoke catches the other measurable risk: boot-time texture
 * generation. BootScene logs the bake timings; this spec turns those
 * diagnostics into a Chromium regression guard so variant/frame-count
 * growth cannot silently make boot heavy.
 *
 * 2026-05-11 ADR-0005 descope: boot only bakes the default variant +
 * the saved selected variant + non-variant accessories + enemies.
 * Other variants bake lazily via `ensureVariantAtlas(scene, key)` in
 * `GameScene.create()`. The new log lines are:
 *
 *   `[BootScene] Non-variant accessory bake: +N keys, X.X ms`
 *   `[BootScene] Variant atlas bake (default classic): +N keys, X.X ms`
 *   `[BootScene] Variant atlas bake (saved <key>): +N keys, X.X ms` (optional)
 *   `[BootScene] Enemy atlas bake: +N keys, X.X ms`
 */

const BAKE_LOG_PATTERN = /^\[BootScene\] (Non-variant accessory|Variant atlas|Enemy atlas)( bake)?[^:]*: \+\d+ keys, ([0-9]+(?:\.[0-9]+)?) ms$/;
const ENEMY_LOG_PATTERN = /^\[BootScene\] Enemy atlas bake: \+\d+ keys, ([0-9]+(?:\.[0-9]+)?) ms$/;

// Calibrated 2026-05-11 to the lazy-bake-descoped floor on local headless
// Chromium: total ~251ms (down from ~430ms pre-descope), enemy ~197ms.
// Budgets carry CI/host headroom (~1.6× for total, ~1.5× for enemy) while
// still catching a large accidental frame-count or animated-enemy roster
// expansion. Tightening further requires also descoping the enemy bake
// (separate slice; see ADR-0005 addendum 2026-05-11).
const TOTAL_BAKE_BUDGET_MS = 400;
const ENEMY_BAKE_BUDGET_MS = 300;
const MIN_EXPECTED_LOG_LINES = 3; // accessory + variant(default) + enemy. Saved-variant log is optional.

test.describe('W71 atlas bake budget (chromium-only)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'Atlas bake timings are browser/renderer dependent; budget is calibrated for chromium-desktop',
  );

  test('BootScene atlas bakes stay under the W71 boot budget', async ({ page }) => {
    const pageErrors: string[] = [];
    const bakeMsLines: Array<{ label: string; ms: number }> = [];
    let enemyMs: number | undefined;

    page.on('pageerror', (err) => { pageErrors.push(err.message); });
    page.on('console', (msg) => {
      const text = msg.text();
      const enemyMatch = text.match(ENEMY_LOG_PATTERN);
      if (enemyMatch) {
        enemyMs = Number(enemyMatch[1]);
      }
      const bakeMatch = text.match(BAKE_LOG_PATTERN);
      if (bakeMatch) {
        bakeMsLines.push({ label: text, ms: Number(bakeMatch[3]) });
      }
    });

    await page.goto('/');
    await expect(page.locator('canvas[role="application"]')).toBeVisible({ timeout: 60_000 });

    expect(
      bakeMsLines.length,
      `BootScene should log at least ${MIN_EXPECTED_LOG_LINES} bake lines (got ${bakeMsLines.length}: ${bakeMsLines.map((l) => l.label).join('|')})`,
    ).toBeGreaterThanOrEqual(MIN_EXPECTED_LOG_LINES);

    expect(enemyMs, 'BootScene should log enemy atlas bake time').toBeDefined();

    const totalBakeMs = bakeMsLines.reduce((sum, line) => sum + line.ms, 0);
    console.log('[w71-atlas-bake-budget] bake lines:', bakeMsLines, 'total:', totalBakeMs.toFixed(1));

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
    expect(
      totalBakeMs,
      `Total W71 atlas bake time should stay below ${TOTAL_BAKE_BUDGET_MS}ms (post ADR-0005 lazy-bake descope)`,
    ).toBeLessThan(TOTAL_BAKE_BUDGET_MS);
    expect(
      enemyMs,
      `Enemy atlas bake should stay below ${ENEMY_BAKE_BUDGET_MS}ms`,
    ).toBeLessThan(ENEMY_BAKE_BUDGET_MS);
  });
});
