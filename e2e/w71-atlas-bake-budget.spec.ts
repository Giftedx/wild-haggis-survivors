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

// Recalibrated 2026-05-29 after the enemy-bake descope (ADR-0005 addendum —
// the "separate slice" the 2026-05-11 calibration promised once the animated
// roster grew). BootScene now eager-bakes ONLY early-roster enemies
// (`bakeEagerEnemyAtlas` — `appearsAt` within the opening minutes): ~16 ms /
// 57 keys. Later enemies + every boss lazy-bake at spawn via
// `ensureEnemyAtlas` (Enemy.spawn chokepoint). Boot total fell from ~400 ms
// (1026 eager keys, over budget) to ~70 ms loaded / ~45 ms clean.
//
// Budgets stay deliberately generous. GitHub Actions runs the full Playwright
// matrix for pushes and pull requests to `main`. Local `npm run ci:all` is the
// pre-push gate and can run on a busy dev box, so tight perf thresholds would
// flake. They guard against (a) a descope revert —
// flipping boot back to the full `bakeEnemyAtlas` pushes enemy bake to
// ~333 ms, tripping the 300 cap — and (b) gross accessory/variant/eager-set
// bloat. The lazy path's render correctness is guarded by the
// `black_douglas_idle_0` canary in `e2e/black-douglas-boss.spec.ts`.
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

    await page.goto('./');
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
