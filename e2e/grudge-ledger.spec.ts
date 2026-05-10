import { expect, test } from './fixtures';

/**
 * Taxman Grudge Ledger (DESIGN_IDEAS §1) — recording smoke.
 *
 * Asserts that the silent per-run ledger records elite/boss finishes via
 * the `'eliteOrBossFinished'` weapon-system event wired in
 * `src/scenes/game/wireWeaponSystemListeners.ts`. The ledger is a public
 * field on GameScene (`grudgeLedger: GrudgeLedgerState`); each push has
 * shape `{ distancePx, hpFraction, wasBoss }` clamped to defensive ranges.
 *
 * Flow: AUTO_BATTLE auto-shoots while `DEBUG.skipToGameSecond` fast-
 * forwards past the 120s elite-spawn threshold (CLAUDE.md: "10% spawn
 * chance after 2 minutes"). The auto-battler kills enough elites to
 * land at least one ledger entry; we then force a boss kill via
 * `DEBUG.killCurrentBoss()` to confirm boss finishes also land.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('taxman grudge ledger (DESIGN_IDEAS §1)', () => {
  test('records elite + boss finishes during a run', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch {
        /* ignore */
      }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const gameBooted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, data?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(gameBooted, 'Game scene failed to activate').toBe(true);

    type LedgerSnapshot = { count: number; bossCount: number };
    const readLedger = (): Promise<LedgerSnapshot | null> => page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        grudgeLedger?: { finishes: ReadonlyArray<{ wasBoss: boolean }> };
      } | undefined;
      const finishes = scene?.grudgeLedger?.finishes;
      if (!finishes) return null;
      return {
        count: finishes.length,
        bossCount: finishes.filter((f) => f.wasBoss).length,
      };
    });

    // Skip past the 120s elite-spawn threshold (CLAUDE.md). 180s gives
    // AUTO_BATTLE headroom to clear the spawn pressure ramp once elites
    // start dropping.
    await page.evaluate(() => {
      (window as unknown as { DEBUG?: { skipToGameSecond(s: number): void } })
        .DEBUG?.skipToGameSecond(180);
    });

    // Poll for at least one elite finish landing in the ledger. AUTO_BATTLE
    // sprays projectiles continuously, so this typically resolves within a
    // couple of seconds of real time post-skip.
    await expect.poll(async () => (await readLedger())?.count ?? 0, {
      timeout: 20_000,
    }).toBeGreaterThanOrEqual(1);

    // Force-kill the current boss (taxman/gordon/tour_bus depending on
    // skipped-to second) and confirm the boss finish lands. Returns false
    // if no boss is currently active — the assertion below tolerates that
    // by allowing zero bosses but still requiring the elite count to hold.
    const bossKillFired = await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { killCurrentBoss(): boolean } }).DEBUG;
      return dbg?.killCurrentBoss() ?? false;
    });

    if (bossKillFired) {
      await expect.poll(async () => (await readLedger())?.bossCount ?? 0, {
        timeout: 5_000,
      }).toBeGreaterThanOrEqual(1);
    }

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
