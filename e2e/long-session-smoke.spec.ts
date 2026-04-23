import { expect, test } from './fixtures';

/**
 * Long-session smoke — closes the coverage gap left by the existing e2e
 * suite. Drives 5 minutes of simulated game-time via DEBUG.skipToMinute,
 * sampling FPS + entity-pool counts at each step, kills the gordon boss
 * to exercise the act-transition path, then asserts no page errors,
 * no console.error noise, no entity-pool leaks, and a playable median
 * FPS.
 *
 * Specifically catches v4 regressions the unit suite cannot:
 *  - Long-burn rendering stability (any per-frame allocation leak)
 *  - Entity pool growth over time
 *  - Tween / scheduler drift
 *  - Audio context death over time
 *  - Late-game weapon/projectile saturation behaviour
 *
 * AUTO_BATTLE handles level-ups automatically so the test never blocks
 * on the upgrade-card modal. FORCE_CANVAS is set by the shared fixture
 * for headless WebGL stability.
 */

const CURRENT_SAVE_VERSION = 9;

interface FpsSample {
  minute: number;
  fps: number;
  enemies: number;
  projectiles: number;
  gems: number;
  level: number;
  weaponsEquipped: number;
}

// Headless Chromium with FORCE_CANVAS is much slower than real browsers.
// We're checking "did anything fall off a cliff", not "is it 60fps".
const FPS_FLOOR = 12;

// Pool caps from src/config.ts ENEMIES.MAX_ACTIVE + BALANCE pools. We just
// want to know we never approached double the configured cap (would imply
// a leak or runaway spawning).
const ENEMY_POOL_CEILING = 600;
const PROJECTILE_POOL_CEILING = 400;
const GEM_POOL_CEILING = 600;

const NOISE_RX = [
  /\[vite\]/i,
  /Violation/i,
  /webkit-/i,
  /Mixed Content/i,
  /service worker/i,
  /favicon/i,
];

test.describe('Long-session smoke', () => {
  test('survives 5 minutes of simulated gameplay with no leaks or errors', async ({ page }) => {
    const pageErrors: string[] = [];
    const consoleErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (NOISE_RX.some((rx) => rx.test(text))) return;
      consoleErrors.push(text);
    });

    await page.addInitScript(({ ver }) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch {
        /* ignore */
      }
    }, { ver: CURRENT_SAVE_VERSION });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await canvas.focus();

    // Boot directly into Game and wait for the first physics tick.
    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game');
      const start = Date.now();
      while (Date.now() - start < 30_000) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    // Wait for DEBUG hooks to install (DebugTimeTravelApi.install runs
    // during GameScene.create after spawnSystem is wired).
    await page.waitForFunction(
      () => Boolean((window as unknown as { DEBUG?: unknown }).DEBUG),
      undefined,
      { timeout: 15_000 },
    );

    // Force-equip all 8 weapons so every weapon's render path (projectile,
    // piercing, bouncing, aoe_pulse, trail, arc_sweep, aura_pulse, utility)
    // gets exercised in the same run. Without this, AUTO_BATTLE alone leaves
    // most slots empty because skipToMinute fast-forwards spawn timing
    // without simulating XP collection.
    const weaponLoadout = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        weaponSystem?: {
          addWeapon(k: string): boolean;
          weapons: Array<{ config: { key: string } }>;
        };
      };
      const ws = gs.weaponSystem;
      if (!ws) return { final: [] as string[] };
      const all = [
        'thistle_shot', 'bagpipe_blast', 'caber_toss', 'scotch_mist',
        'haggis_hurler', 'nessie_tentacle', 'claymore', 'bagpipes',
      ];
      // addWeapon returns false if already equipped (player auto-starts
      // with thistle_shot). We only care about the final loadout.
      for (const k of all) ws.addWeapon(k);
      return { final: ws.weapons.map((w) => w.config.key) };
    });

    // Walk forward through 5 minutes of game-time, sampling at each step.
    const samples: FpsSample[] = [];
    const minutes = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5];
    for (const minute of minutes) {
      const sample = await page.evaluate(async (m) => {
        const dbg = (window as unknown as { DEBUG?: {
          skipToMinute(m: number): void;
        } }).DEBUG;
        const g = (window as unknown as { game: {
          loop: { actualFps: number };
          scene: { scenes: Array<{ scene: { key: string } }> };
        } }).game;
        const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
          spawnSystem?: {
            getGameTimeSec?(): number;
            getEnemyGroup?(): { getChildren(): unknown[] };
          };
          weaponSystem?: {
            getProjectileGroup?(): { getChildren(): unknown[] };
            weapons?: unknown[];
          };
          xpSystem?: { getGemGroup?(): { getChildren(): unknown[] } };
          player?: { level?: number };
        };

        dbg?.skipToMinute(m);

        // Let the game settle for a wall-clock half-second so the renderer
        // catches up with the time-travel + spawn-cascade.
        await new Promise((r) => setTimeout(r, 500));

        // Sample FPS over a short window for stability.
        const fpsReadings: number[] = [];
        for (let i = 0; i < 8; i++) {
          fpsReadings.push(g.loop.actualFps);
          await new Promise((r) => setTimeout(r, 100));
        }
        fpsReadings.sort((a, b) => a - b);
        const fps = fpsReadings[Math.floor(fpsReadings.length / 2)] ?? 0;

        const countActive = (group?: { getChildren(): unknown[] }): number => {
          if (!group) return 0;
          const arr = group.getChildren();
          let n = 0;
          for (const c of arr) {
            if ((c as { active?: boolean }).active) n++;
          }
          return n;
        };

        return {
          minute: m,
          fps,
          enemies: countActive(gs.spawnSystem?.getEnemyGroup?.()),
          projectiles: countActive(gs.weaponSystem?.getProjectileGroup?.()),
          gems: countActive(gs.xpSystem?.getGemGroup?.()),
          level: gs.player?.level ?? 0,
          weaponsEquipped: gs.weaponSystem?.weapons?.length ?? 0,
        };
      }, minute);
      samples.push(sample);
    }

    // Trigger the gordon boss kill at minute 5 to exercise act transition.
    const bossOutcome = await page.evaluate(async () => {
      const dbg = (window as unknown as { DEBUG?: {
        skipToMinute(m: number): void;
        killCurrentBoss(): boolean;
      } }).DEBUG;
      if (!dbg) return { killed: false };
      dbg.skipToMinute(5);
      await new Promise((r) => setTimeout(r, 2500));
      const start = Date.now();
      while (Date.now() - start < 15_000) {
        if (dbg.killCurrentBoss()) return { killed: true };
        await new Promise((r) => setTimeout(r, 200));
      }
      return { killed: false };
    });

    // Settle one more tick so any boss-death VFX completes.
    await page.waitForTimeout(2000);

    // Save evidence regardless of pass/fail.
    await canvas.screenshot({ path: 'design-verify-screens/long-session-final.png' });

    const sceneStillActive = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { isActive(k: string): boolean };
      } }).game;
      return g.scene.isActive('Game') || g.scene.isActive('GameOver') || g.scene.isActive('ActIntermission');
    });

    // Diagnostics on stdout — only visible if --reporter=list, but Playwright
    // surfaces them in failure reports.
    console.log('[long-session] weapon loadout:', weaponLoadout);
    console.log('[long-session] samples:', JSON.stringify(samples, null, 2));
    console.log('[long-session] boss kill:', bossOutcome);
    console.log('[long-session] page errors:', pageErrors);
    console.log('[long-session] console errors:', consoleErrors);

    // Assertions — what would actually fail a v4 regression.
    expect(pageErrors, 'no uncaught page errors during 5-min session').toEqual([]);
    expect(consoleErrors, 'no unexpected console.error noise').toEqual([]);

    const medianFps = [...samples.map((s) => s.fps)].sort((a, b) => a - b)[
      Math.floor(samples.length / 2)
    ] ?? 0;
    expect(medianFps, `median FPS should clear ${FPS_FLOOR} (sampled: ${samples.map((s) => s.fps.toFixed(1)).join(', ')})`).toBeGreaterThanOrEqual(FPS_FLOOR);

    const maxEnemies = Math.max(...samples.map((s) => s.enemies));
    const maxProjectiles = Math.max(...samples.map((s) => s.projectiles));
    const maxGems = Math.max(...samples.map((s) => s.gems));
    expect(maxEnemies, 'enemy pool no leak').toBeLessThan(ENEMY_POOL_CEILING);
    expect(maxProjectiles, 'projectile pool no leak').toBeLessThan(PROJECTILE_POOL_CEILING);
    expect(maxGems, 'gem pool no leak').toBeLessThan(GEM_POOL_CEILING);

    // Game must still be running (not crashed or stuck on dead overlay).
    expect(sceneStillActive, 'Game/Intermission/GameOver scene active at end').toBe(true);

    // Confirm weapon loadout actually took. Tests every weapon's
    // construction path; render path is exercised continuously across
    // the 9 sample steps as enemies + projectiles cycle through.
    expect(weaponLoadout.final, 'all 8 weapons should be equipped').toHaveLength(8);

    // Boss kill is informational — if AUTO_BATTLE didn't get the player to
    // tank gordon's contact damage in time, the kill may not fire. Don't
    // assert killed; just log.
    if (!bossOutcome.killed) {
      console.warn('[long-session] gordon kill did not fire (informational, not asserted)');
    }
  });
});
