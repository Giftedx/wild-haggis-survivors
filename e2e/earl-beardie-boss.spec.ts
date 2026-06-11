import { expect, test } from './fixtures';

/**
 * Earl Beardie boss — spawn + kill smoke.
 *
 * A 15th-century Glamis ghost with a card-deal behaviour: fires a fan of
 * 3 spectral playing cards every 3.5 s. Spawns at 22:30 (spawnTimeSec:
 * 1350) — the gap slot between Hunter General (20:00) and Taxman (25:00).
 *
 * This smoke verifies:
 *   1. Boss appears in the enemy group at the expected game time.
 *   2. `takeDamageWithKillEvents` drives the full kill pipeline.
 *   3. GameScene.bossKilledKeys records 'earl_beardie' after the kill.
 *
 * The card-deal fan mechanic is covered by cardDealBehaviour.test.ts.
 * The e2e only checks spawn + kill wiring so CI stays fast.
 *
 * Chromium-only — FF/WK headless WebGL flakes; single-browser coverage
 * is sufficient for the wiring smoke.
 */

const META_SAVE_VERSION = 11;

test.describe('Earl Beardie boss — spawn and kill', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('spawns at 22:30 and registers in bossKilledKeys on death', async ({ page }) => {
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

    // Boot GameScene directly with a fixed seed.
    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, d?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 88888 });
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

    // Advance to 23:00 — Earl Beardie spawns at spawnTimeSec 1350 (22:30),
    // so minute 23 guarantees we are past the spawn threshold.
    await healPlayer();
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToMinute(m: number): void } }).DEBUG;
      dbg?.skipToMinute(23);
    });
    await healPlayer();

    // Wait for Earl Beardie to materialise in the enemy group.
    // SpawnSystem emits a 1500ms wall-clock warning before the entity
    // appears, so we allow generous time here.
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
        .some((e) => e.active && e.getEnemyKey?.() === 'earl_beardie') ?? false;
    }, undefined, { timeout: 8_000 });

    // Ensure player is alive before the kill strike.
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
        .find((e) => e.active && e.getEnemyKey?.() === 'earl_beardie');
      if (!boss) return false;
      boss.takeDamageWithKillEvents?.(999_999);
      return true;
    });
    expect(bossKilled, 'earl_beardie must be found and killed').toBe(true);

    // Wait for the kill to propagate through EnemyKillHandler.
    const killRegistered = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        bossKilledKeys?: string[];
      } | undefined;
      return (gs?.bossKilledKeys ?? []).includes('earl_beardie');
    }, undefined, { timeout: 5_000 });

    expect(await killRegistered.jsonValue(), 'bossKilledKeys must include earl_beardie').toBe(true);
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
