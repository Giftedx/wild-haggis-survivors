import { expect, test } from './fixtures';

/**
 * Nessie, Reconsidered — spawn + kill smoke.
 *
 * A post-bell exclusive boss (postBellOnly: true) with a 'loch_emergence'
 * behaviour: phase 1 (HP > 50%) tentacle sweep fans every 6 s; phase 2
 * (HP ≤ 50%) speed ×1.5 + 6-shard plunge burst every 3.8 s.
 *
 * The boss never appears in the standard 0–25 min arc, so the test calls
 * `spawnBossManually` directly — same public API used by
 * CailleachGauntletScheduler and the other post-bell boss smokes.
 *
 * This smoke verifies:
 *   1. Boss appears in the enemy group after a manual spawn call.
 *   2. `takeDamageWithKillEvents` drives the full kill pipeline.
 *   3. GameScene.bossKilledKeys records 'nessie' after the kill.
 *
 * Phase logic is covered by nessieBehaviour.test.ts.
 * Chromium-only — FF/WK headless WebGL flakes.
 */

const META_SAVE_VERSION = 11;

test.describe('Nessie boss — spawn and kill', () => {
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
      g.scene.start('Game', { seed: 55555 });
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
      gs.getSpawnSystem().spawnBossManually('nessie', px, py);
      return true;
    });
    expect(spawned, 'spawnBossManually must succeed').toBe(true);

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
        .some((e) => e.active && e.getEnemyKey?.() === 'nessie') ?? false;
    }, undefined, { timeout: 8_000 });

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
        .find((e) => e.active && e.getEnemyKey?.() === 'nessie');
      if (!boss) return false;
      boss.takeDamageWithKillEvents?.(999_999);
      return true;
    });
    expect(bossKilled, 'nessie must be found and killed').toBe(true);

    const killRegistered = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        bossKilledKeys?: string[];
      } | undefined;
      return (gs?.bossKilledKeys ?? []).includes('nessie');
    }, undefined, { timeout: 5_000 });

    expect(await killRegistered.jsonValue(), 'bossKilledKeys must include nessie').toBe(true);
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
