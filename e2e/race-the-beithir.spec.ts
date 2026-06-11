import { expect, test } from './fixtures';

/**
 * Race the Beithir smoke (DESIGN_IDEAS §1+§3) — asserts the Beithir
 * spawns once game-time crosses its `appearsAt: 660`. Drives
 * `DEBUG.skipToGameSecond(665)`, then polls `spawnSystem.getEnemyGroup()`
 * for an active enemy whose `getEnemyKey() === 'beithir'`.
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('race the beithir (DESIGN_IDEAS §1+§3)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser flakes; chromium covers the smoke',
  );

  test('spawns a beithir after game-second 660', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion, hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch { /* ignore */ }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await canvas.focus();

    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, data?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    await page.waitForFunction(
      () => Boolean((window as unknown as { DEBUG?: unknown }).DEBUG),
      undefined, { timeout: 15_000 },
    );

    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToGameSecond(s: number): void } }).DEBUG;
      dbg?.skipToGameSecond(665);
    });

    const beithirSpawned = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: { getEnemyGroup?(): { getChildren(): unknown[] } };
      } | undefined;
      const arr = gs?.spawnSystem?.getEnemyGroup?.().getChildren() ?? [];
      for (const c of arr) {
        const e = c as { active?: boolean; getEnemyKey?: () => string };
        if (e.active && e.getEnemyKey?.() === 'beithir') return true;
      }
      return false;
    }, undefined, { timeout: 5_000 });

    expect(Boolean(beithirSpawned), 'beithir must spawn within 5s of skip').toBe(true);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
