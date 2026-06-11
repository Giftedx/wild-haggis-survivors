import { expect, test } from './fixtures';

/**
 * T1 Phase 3 playback cross-check — verifies that a v2 `ReplayBlob`
 * launched through `scene.start('Game', { replay })` re-applies the
 * recorded curse + composedStats instead of falling through to the
 * live singletons.
 *
 * This complements `replay-loop.spec.ts` (which records live, saves,
 * watches, and exhausts) by skipping the record step and driving
 * GameScene with a synthetic v2 blob. The synthetic shape is what
 * Phase 3's recorder produces for a curse run, so a regression in the
 * playback consumer is caught here without needing a curse
 * mid-test (the curse singleton isn't exposed to Playwright cleanly).
 */

const META_SAVE_VERSION = 9;

test.describe('T1 Phase 3 v2 playback', () => {
  test('synthetic v2 blob applies curseKey + composedStats to the run sheet', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVer) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: saveVer,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
        // No `whs_replay_mode` — we're driving playback, not recording.
        localStorage.removeItem('whs_replay_mode');
      } catch {
        /* ignore */
      }
    }, META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const playback = await page.evaluate(async () => {
      interface GameHandle {
        scene: {
          start(k: string, data?: unknown): void;
          stop(k: string): void;
          isActive(k: string): boolean;
          getScene(k: string): unknown;
        };
      }
      const g = (window as unknown as { game?: GameHandle }).game;
      if (!g) return { err: 'no game' };

      // Synthetic v2 blob. `heavy_legs` curse sets moveSpeedMult = 0.88
      // and goldMult += 0.45; a captured composedStats.speed = 111
      // lets us prove the playback branch used the blob stats (the
      // Player's reported speed will equal what the blob said, not a
      // live-computed value).
      const v2Blob = {
        version: 2,
        build: 'whs-prod',
        seed: 9999,
        variantKey: 'classic',
        frameCount: 120,
        frames: Array.from({ length: 120 }, () => ({
          dtMs: 16.67,
          dx: 0,
          dy: 0,
          dash: false,
          menu: false,
        })),
        curseKey: 'heavy_legs',
        composedStats: {
          speed: 111,
          maxHp: 99,
          driftDegrees: 10,
          pickupRadius: 100,
          damagePctBonus: 0,
          hpRegen: 0,
          critBonus: 0,
          cooldownReduction: 0,
          xpGainBonus: 0,
          armorBonus: 0,
          dashCooldownReduction: 0,
        },
      };

      g.scene.stop('MainMenu');
      g.scene.stop('Menu');
      g.scene.start('Game', { replay: v2Blob });

      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if (g.scene.isActive('Game')) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      const gs = g.scene.getScene('Game') as {
        scene: { isActive(): boolean };
        activeCurseKey: string | null;
        player: { getMoveSpeed(): number; getMaxHp(): number; getRunBaseSpeed(): number } | null;
        replayInput: unknown;
        replayRecorder: unknown;
      };
      if (!gs.scene.isActive()) return { err: 'game not active during playback' };

      return {
        activeCurseKey: gs.activeCurseKey,
        runBaseSpeed: gs.player?.getRunBaseSpeed() ?? -1,
        moveSpeed: gs.player?.getMoveSpeed() ?? -1,
        maxHp: gs.player?.getMaxHp() ?? -1,
        replayInputPresent: !!gs.replayInput,
        recorderPresent: !!gs.replayRecorder,
      };
    });

    expect(playback.replayInputPresent, 'ReplayInput should drive Player during playback').toBe(true);
    expect(playback.recorderPresent, 'recorder must be off during playback').toBe(false);
    expect(
      playback.activeCurseKey,
      'v2 blob curseKey should override live pending-curse singleton',
    ).toBe('heavy_legs');
    // Player's `runBaseSpeed` is read directly from `composed.speed` at
    // construction. The playback path spreads the blob's composedStats
    // wholesale over baseStats, so the blob's 111 wins — not any
    // live-computed value from StatComposer(metaSave) or the curse's
    // own moveSpeedMult (which would apply via `curse.apply()` but
    // the playback branch skips that bag mutation on composedStats).
    expect(
      playback.runBaseSpeed,
      'Player.runBaseSpeed should equal blob composedStats.speed',
    ).toBe(111);
    expect(playback.maxHp, 'Player.maxHp should equal blob composedStats.maxHp').toBe(99);

    expect(
      pageErrors,
      `Uncaught page errors during v2 playback:\n${pageErrors.join('\n')}`,
    ).toEqual([]);
  });
});
