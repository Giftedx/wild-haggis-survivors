import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * Black Douglas boss — spawn + kill smoke.
 *
 * A post-bell exclusive boss (postBellOnly: true) with a 'hush' behaviour:
 * fast chase (130 px/s) + 4 s cadence fear-shout AoE (220 px radius, 18
 * damage + 1.5 s net-slow).  The boss never appears in the standard 0–25 min
 * timed arc, so this test bypasses the post-bell cadence and calls
 * `spawnBossManually` directly — the same public API used by
 * CailleachGauntletScheduler for the Cailleach boss.
 *
 * This smoke verifies:
 *   1. Boss appears in the enemy group after a manual spawn call.
 *   2. `takeDamageWithKillEvents` drives the full kill pipeline.
 *   3. GameScene.bossKilledKeys records 'black_douglas' after the kill.
 *
 * The hush AoE timing is covered by hushBehaviour.test.ts.
 * Chromium-only — FF/WK headless WebGL flakes.
 */

test.describe('Black Douglas boss — spawn and kill', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('spawns via spawnBossManually and registers in bossKilledKeys on death', async ({ page }) => {
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
      g.scene.start('Game', { seed: 77777 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    const healPlayer = async () => {
      await page.evaluate(() => {
        const g = (window as unknown as { game?: {
          scene: { scenes: Array<{ scene: { key: string } }> };
        } }).game;
        const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
          player?: { heal(n: number): void };
        } | undefined;
        gs?.player?.heal(99_999);
      });
    };

    await healPlayer();

    // Black Douglas is post-bell only — bypass the post-bell cadence by
    // calling spawnBossManually directly (same API used by the Cailleach
    // Gauntlet scheduler).
    const spawned = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        getSpawnSystem?(): {
          spawnBossManually(key: string, x: number, y: number): void;
        };
        player?: { x: number; y: number };
      } | undefined;
      if (!gs?.getSpawnSystem) return false;
      const px = gs.player?.x ?? 400;
      const py = gs.player?.y ?? 300;
      gs.getSpawnSystem().spawnBossManually('black_douglas', px, py);
      return true;
    });
    expect(spawned, 'spawnBossManually must succeed').toBe(true);

    // Wait for the entity to materialise (SpawnSystem has a 1500ms warning
    // beat before the enemy object becomes active).
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): { getChildren(): Array<{ active: boolean; getEnemyKey?(): string }> };
        };
      } | undefined;
      return gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .some((e) => e.active && e.getEnemyKey?.() === 'black_douglas') ?? false;
    }, undefined, { timeout: 8_000 });

    // Descope canary (ADR-0005 enemy-bake, 2026-05-29): black_douglas is a
    // post-bell boss, never in the eager boot set, so its atlas must have been
    // lazy-baked at spawn via `ensureEnemyAtlas` (Enemy.spawn chokepoint). A
    // missing idle frame here means the lazy path regressed → magenta boss.
    const atlasBaked = await page.evaluate(() => {
      const g = (window as unknown as { game?: { textures: { exists(k: string): boolean } } }).game;
      return g?.textures.exists('black_douglas_idle_0') ?? false;
    });
    expect(atlasBaked, 'black_douglas atlas must be lazy-baked on spawn').toBe(true);

    await healPlayer();

    const bossKilled = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): {
            getChildren(): Array<{
              active: boolean;
              getEnemyKey?(): string;
              takeDamageWithKillEvents?(n: number): void;
            }>;
          };
        };
      } | undefined;
      const boss = gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .find((e) => e.active && e.getEnemyKey?.() === 'black_douglas');
      if (!boss) return false;
      boss.takeDamageWithKillEvents?.(999_999);
      return true;
    });
    expect(bossKilled, 'black_douglas must be found and killed').toBe(true);

    const killRegistered = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        bossKilledKeys?: string[];
      } | undefined;
      return (gs?.bossKilledKeys ?? []).includes('black_douglas');
    }, undefined, { timeout: 5_000 });

    expect(await killRegistered.jsonValue(), 'bossKilledKeys must include black_douglas').toBe(true);
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
