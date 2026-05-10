import { expect, test } from './fixtures';

/**
 * Cairn Stacking (DESIGN_IDEAS §1) spawn smoke. Asserts the scheduler
 * spawns the first cairn stone after `CAIRN_FIRST_SPAWN_SEC` (75s),
 * proving the runtime tick path → CairnStackingScheduler → PickupSpawner
 * is wired end-to-end.
 *
 * Helper unit tests (`CairnStackingScheduler.test.ts`) cover the
 * collect → boon arithmetic (full heal + 8s magnet pulse on third
 * stone). This smoke is strictly "first stone spawned by the scheduler
 * after time-skip" — the walk-through collect requires sprite
 * positioning that's not e2e-friendly.
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('cairn stacking spawn (DESIGN_IDEAS §1)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('first stone spawns after game-second 75', async ({ page }) => {
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
      } catch { /* ignore */ }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('/');
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
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    await page.waitForFunction(
      () => Boolean((window as unknown as { DEBUG?: unknown }).DEBUG),
      undefined, { timeout: 15_000 },
    );

    // 75s = CAIRN_FIRST_SPAWN_SEC; 80 ticks the per-second hook past it.
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToGameSecond?(s: number): void } }).DEBUG;
      dbg?.skipToGameSecond?.(80);
    });

    const spawned = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        cairnStacking?: {
          getSpawnedCount?(): number;
          isSpawnPending?(): boolean;
        };
      } | undefined;
      const sched = gs?.cairnStacking;
      if (!sched) return false;
      const spawnedCount = sched.getSpawnedCount?.() ?? 0;
      const pending = sched.isSpawnPending?.() ?? false;
      return spawnedCount >= 1 && pending ? { spawnedCount, pending } : false;
    }, undefined, { timeout: 5_000 });

    const result = (await spawned.jsonValue()) as { spawnedCount: number; pending: boolean };
    expect(result.spawnedCount).toBeGreaterThanOrEqual(1);
    expect(result.pending).toBe(true);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
