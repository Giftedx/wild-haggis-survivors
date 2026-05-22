import { expect, test } from './fixtures';

/**
 * The Moor Remembers (spec 2026-05-22) — cairn walk-over smoke.
 *
 * Seeds a v10 meta-save with one FallenCairn placed at the player's
 * start position (world-centre, 1500×1500).  On the first tick of
 * GameScene the scheduler detects the player within
 * CAIRN_TOUCH_RADIUS_PX (42 px) and calls `handleCairnWalkOver`,
 * which increments `ancestralEchoesTouched` on `whs_save`.
 *
 * Assertion: `whs_save.ancestralEchoesTouched` reaches 1 within a
 * few seconds of gameplay — proving the full chain:
 *   CairnOfEchoesScheduler.tick → handleCairnWalkOverOnScene
 *   → bumpAncestralEchoesTouched → whs_save
 *
 * Walk-over banter + audio are not asserted here (audio is silenced
 * in headless; banter already has unit coverage).  The minimap marker
 * assertion uses `getMinimapMarkers()` which is the public read surface
 * on the scheduler.
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const META_SAVE_VERSION = 10;

test.describe('the moor remembers — cairn walk-over (spec 2026-05-22)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('seeded cairn at player-start triggers walk-over and bumps ancestralEchoesTouched', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    // Seed a v10 meta-save with one FallenCairn at world-centre (1500, 1500)
    // — identical to the player's spawn position so walk-over fires on the
    // first scheduler tick without needing to teleport the player.
    await page.addInitScript((ver) => {
      try {
        const cairn = {
          x: 1500,
          y: 1500,
          cause: 'enemy_contact',
          variantKey: 'classic',
          timeSurvivedMs: 60_000,
          inheritedStat: 'damage',
          savedAt: Date.now() - 86_400_000,
        };
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: ver,
          totalKills: 100,
          totalKillsSpent: 0,
          unlockedWeapons: ['bagpipes'],
          unlockedUpgrades: [],
          activeRun: null,
          unlockedAchievements: [],
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
          hasSeenEliteAffixTip: true,
          hasSeenMoorMomentTip: true,
          hasSeenCeilidhChainTip: true,
          hasSeenStandingStonesTip: true,
          hasSeenAncestralEchoTip: true,
          moorMomentsLifetime: 0,
          runHistory: [],
          dailyChallenge: null,
          codexCulledKeys: [],
          fallenCairns: [cairn],
          oldDroverRevealedCount: 0,
        }));
        // Clear any residual gameplay save so ancestralEchoesTouched starts at 0.
        localStorage.removeItem('whs_save');
        // AUTO_BATTLE: short-circuits level-up modals and keeps the player
        // mobile so the scheduler ticks with valid player coords.
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch { /* ignore */ }
    }, META_SAVE_VERSION);

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Boot GameScene directly (skips menu, same pattern as sister specs).
    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, d?: unknown): void; isActive(k: string): boolean };
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
    expect(booted, 'GameScene must boot').toBe(true);

    // Sanity: confirm the scheduler loaded the cairn — minimap marker count = 1.
    const markerCount = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        cairnOfEchoesScheduler?: { getMinimapMarkers?(): Array<{ x: number; y: number }> };
      } | undefined;
      const markers = gs?.cairnOfEchoesScheduler?.getMinimapMarkers?.() ?? [];
      return markers.length >= 1 ? markers.length : false;
    }, undefined, { timeout: 15_000 });

    expect(await markerCount.jsonValue()).toBe(1);

    // Poll until ancestralEchoesTouched reaches 1.  The walk-over fires on
    // the first scheduler tick (player spawns at the cairn coord), so this
    // should resolve in under a second of real gameplay.
    const touched = await page.waitForFunction(() => {
      try {
        const raw = localStorage.getItem('whs_save');
        if (!raw) return false;
        const save = JSON.parse(raw) as { ancestralEchoesTouched?: number };
        return (save.ancestralEchoesTouched ?? 0) >= 1
          ? save.ancestralEchoesTouched
          : false;
      } catch {
        return false;
      }
    }, undefined, { timeout: 10_000 });

    expect(await touched.jsonValue()).toBe(1);
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
