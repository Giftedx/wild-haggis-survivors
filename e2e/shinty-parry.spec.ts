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
        // AUTO_BATTLE intentionally OFF — its `timeScale: 10` would
        // fast-forward the parry cooldown past the 450ms wall-time wait
        // below, masking the cooldown phase the assertion checks.
        // Default is forced off in `e2e/fixtures.ts`.
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

    // 2) Wait for COUNTDOWN — Player.update is gated on
    //    `!timeManager.isGameplayPaused()`. Without the wait, the E
    //    keydown lands during the 3-2-1 freeze and the parry helper
    //    never ticks the rising edge.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 10_000 });

    // 3) Active: E-edge opens the window. Hold to keep `key.isDown`
    //    true across at least one Phaser frame (`press()` can fire
    //    keydown→keyup inside a single frame, missing the edge).
    await page.keyboard.down('e');
    await expect.poll(readPhase, { timeout: 1_000 }).toMatchObject({ active: true });
    await page.keyboard.up('e');

    // 4) Window expires (>350ms) and parry returns to ready (no hit
    //    landed → cooldown stays 0 per `tickShintyParry`; cooldown
    //    only fires on a successful parry via `consumeParry`).
    await page.waitForTimeout(450);
    await expect.poll(readPhase, { timeout: 1_000 }).toMatchObject({ active: false, ready: true });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
