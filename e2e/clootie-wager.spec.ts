import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * DESIGN_IDEAS §1 Clootie Rag Wager — spawn smoke.
 *
 * Asserts the clootie tree spawns within its [4:00, 9:00] window when
 * fast-forwarded to 9:00 via `DEBUG.skipToGameSecond(540)`. The walk-
 * through wager (HP cost + boon) has unit coverage in
 * `clootieRagWager.test.ts`; this smoke is strictly "tree spawns".
 */


test.describe('clootie wager spawn (DESIGN_IDEAS §1)', () => {
  test('tree spawns within the 4-9 minute window', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch { /* ignore */ }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const gameActive = await page.evaluate(async () => {
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
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    // 540s = upper bound of [CLOOTIE_SPAWN_MIN_SEC, CLOOTIE_SPAWN_MAX_SEC];
    // crossing it guarantees the once-per-second spawn boundary fired
    // regardless of where the seeded roll landed.
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: {
        skipToGameSecond?(s: number): void;
      } }).DEBUG;
      dbg?.skipToGameSecond?.(540);
    });

    const spawned = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        clootieTree?: { getMinimapMarker?(): { x: number; y: number } | null } | null;
      } | undefined;
      const m = gs?.clootieTree?.getMinimapMarker?.() ?? null;
      return m !== null ? m : false;
    }, undefined, { timeout: 5_000 });

    const marker = (await spawned.jsonValue()) as { x: number; y: number };
    expect(typeof marker.x).toBe('number');
    expect(typeof marker.y).toBe('number');
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
