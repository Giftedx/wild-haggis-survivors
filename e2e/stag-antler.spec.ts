import { expect, test } from './fixtures';

/**
 * Stag Antler dash-strike fork (DESIGN_IDEAS §5) wiring smoke.
 *
 * Helper unit tests (`dashStrikeTrigger.test.ts`) cover the rising-
 * edge / cooldown-gate arithmetic. This smoke catches the wiring
 * failure mode: does the chain
 *
 *   Player.isDashing → tickFrameWorld → WeaponSystem.setPlayerDashState
 *   → WeaponSystem.update dash-strike loop → fireDashStrike → cooldown stamped
 *
 * actually fire end-to-end when stag_antler is owned and the player
 * dashes. Asserts the per-weapon `cooldownRemainingMs` flips from 0
 * to ≥ 1 within one frame after the dash flag rises.
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('stag antler dash-strike (DESIGN_IDEAS §5)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('dash rising-edge stamps the dash-strike cooldown', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
        // AUTO_BATTLE intentionally OFF — when on, `Player.tryDash` is
        // gated by `!this.autoBattleSteering` so the dash key path is
        // skipped entirely. Without auto-steering the manual Space
        // press routes through tryDash → isDashing → tickFrameWorld.
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

    // Add stag_antler to the active loadout (public weapon-system API).
    const added = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        weaponSystem?: { addWeapon(k: string): boolean; getWeapons(): unknown[] };
      } | undefined;
      if (!scene?.weaponSystem) return false;
      scene.weaponSystem.addWeapon('stag_antler');
      const ws = scene.weaponSystem.getWeapons() as Array<{ config?: { key?: string } }>;
      return ws.some((w) => w.config?.key === 'stag_antler');
    });
    expect(added, 'stag_antler must be in active weapons').toBe(true);

    // Wait for COUNTDOWN to clear — Player.update is gated on
    // `!timeManager.isGameplayPaused()`. Without the wait, Space
    // lands during the 3-2-1 freeze and tryDash never runs.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 10_000 });

    // Press Space to dash — Player.tryDash falls back to last move dir
    // (or facing) when no movement input is held, so a stationary press
    // still routes through the full dash code path that tickFrameWorld
    // observes. AUTO_BATTLE off keeps the autoBattleSteering gate clear.
    await page.keyboard.down('Space');
    const stamped = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        weaponSystem?: Record<string, unknown>;
      } | undefined;
      const ws = scene?.weaponSystem as unknown as {
        dashStrikeStates?: Map<string, { cooldownRemainingMs: number }>;
      } | undefined;
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const state = ws?.dashStrikeStates?.get('stag_antler');
        if (state && state.cooldownRemainingMs > 0) return state.cooldownRemainingMs;
        await new Promise((r) => setTimeout(r, 16));
      }
      return 0;
    });
    await page.keyboard.up('Space');
    expect(stamped, 'dash-strike cooldown must be stamped within 3s').toBeGreaterThan(0);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
