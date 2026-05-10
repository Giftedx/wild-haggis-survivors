import { expect, test } from './fixtures';

/**
 * Shinty Parry (DESIGN_IDEAS §1) input smoke. Asserts E opens the
 * parry window: idle → active for ~350ms → cooldown. Phases derived
 * from the Player's `isShintyParryActive()` + `isShintyParryReady()`
 * HUD accessors (`src/entities/Player.ts`). Constants live in
 * `src/entities/shintyParry.ts` (`PARRY_WINDOW_MS = 350`).
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('shinty parry (DESIGN_IDEAS §1)', () => {
  test('E opens the parry window: idle → active → cooldown', async ({ page }) => {
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
      } catch {
        /* ignore */
      }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const gameBooted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, data?: unknown): void; isActive(k: string): boolean };
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
    expect(gameBooted, 'Game scene failed to activate').toBe(true);

    type ParryProbe = { active: boolean; ready: boolean } | null;
    const readPhase = (): Promise<ParryProbe> => page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: { isShintyParryActive(): boolean; isShintyParryReady(): boolean };
      } | undefined;
      const p = scene?.player;
      if (!p) return null;
      return { active: p.isShintyParryActive(), ready: p.isShintyParryReady() };
    });

    // 1) Idle: ready, not active.
    await expect.poll(readPhase, { timeout: 5_000 }).toMatchObject({ active: false, ready: true });

    // 2) Active: E-edge opens the window.
    await page.keyboard.press('e');
    await expect.poll(readPhase, { timeout: 1_000 }).toMatchObject({ active: true });

    // 3) Cooldown: window expires (>350ms) into recovery.
    await page.waitForTimeout(450);
    await expect.poll(readPhase, { timeout: 1_000 }).toMatchObject({ active: false, ready: false });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
