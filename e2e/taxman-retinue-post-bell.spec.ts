import { expect, test } from './fixtures';

/**
 * Taxman's Retinue — post-bell wave wiring smoke.
 *
 * After the bell (the Taxman's defeat) the player's accepted keep-going offer
 * puts the run into post-bell, and `SpawnSystem.tickPostBellRetinue` clocks in
 * coordinated ledger_wraith + auditor_priest waves on a cadence (first wave at
 * 90 s past the bell, from `computePostBellMultipliers` step 0). The pure
 * cadence + escalation math is covered by `postBellRetinueCadence.test.ts` and
 * `PostBellEscalation` unit tests; THIS spec covers the integration the unit
 * tests cannot — that being post-bell + the clock advancing actually drives a
 * wave spawn in a running game.
 *
 * Drive (fully deterministic): `RunLifecycle.forcePostBell()` is a test seam
 * that enters post-bell directly (anchoring the bell at the current game time)
 * without the fragile victory ceremony — killing the finale boss in a synthetic
 * early-run state resets transient run state, so the real ceremony can't be
 * faked reliably. Then `skipToGameSecond(+100)` pushes secondsPastBell past the
 * 90 s cadence. The retinue wave counter is the only generic-spawn-immune
 * signal (ledger_wraith / auditor_priest are also ordinary timed spawns, so an
 * enemy-key check would be ambiguous after a time skip).
 *
 * Chromium-only — FF/WK headless WebGL flakes (matches the other boss smokes).
 */

const META_SAVE_VERSION = 11;

test.describe("Taxman's Retinue — post-bell", () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('fires a retinue wave once the post-bell cadence elapses', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver: number) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
          hasSeenEliteAffixTip: true,
        }));
        localStorage.removeItem('whs_save');
        // Auto-fight so the haggis survives the post-bell escalation while the
        // wave counter ticks (the assertion lands within a frame of the skip).
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch { /* ignore */ }
    }, META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, d?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 90210 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    // Keep the haggis healthy, then enter post-bell and jump past the 90 s
    // first-wave cadence in one synchronous step (bell is anchored at the
    // current game-second, so +100 lands secondsPastBell at ~100).
    const armed = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        player?: { heal(n: number): void };
        runLifecycle?: { forcePostBell?(): void; isPostBell?(): boolean };
        isPostBell?(): boolean;
        getSpawnSystem?(): { getGameTimeSec(): number };
      } | undefined;
      const dbg = (window as unknown as { DEBUG?: { skipToGameSecond(s: number): void } }).DEBUG;
      if (!gs?.runLifecycle?.forcePostBell || !gs.getSpawnSystem || !dbg) return { ok: false };
      gs.player?.heal(99_999);
      gs.runLifecycle.forcePostBell();
      const postBell = gs.isPostBell?.() ?? false;
      const sec = gs.getSpawnSystem().getGameTimeSec();
      dbg.skipToGameSecond(sec + 100);
      return { ok: true, postBell };
    });
    expect(armed.ok, 'forcePostBell + skipToGameSecond seams must be available').toBe(true);
    expect(armed.postBell, 'forcePostBell must put the run into post-bell').toBe(true);

    const fired = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        getSpawnSystem?(): { getPostBellRetinueWavesSpawned(): number };
      } | undefined;
      return (gs?.getSpawnSystem?.().getPostBellRetinueWavesSpawned() ?? 0) >= 1;
    }, undefined, { timeout: 8_000 });
    expect(await fired.jsonValue(), 'a post-bell retinue wave must fire').toBe(true);

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
