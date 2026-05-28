import { expect, test } from './fixtures';

/**
 * Whisky Breath (DESIGN_IDEAS §1) input smoke. Asserts F is wired to
 * the breath helper and a seeded `stacks ≥ BREATH_STACKS_REQUIRED`
 * gets consumed on the next Player.update tick.
 *
 * Helper unit tests (`whiskyBreath.test.ts`) cover the burst-fire
 * arithmetic. This smoke catches the wiring failure mode (key missed,
 * accessor stale, edge debouncer broken).
 *
 * AUTO_BATTLE is intentionally OFF — at timeScale=10 the kill stream
 * re-banks stacks within the poll window, masking whether F actually
 * consumed. Without AUTO_BATTLE, no kills land, no rebanking races.
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory
 * `reference_e2e_pre_existing_failures`.
 */

const CURRENT_META_SAVE_VERSION = 9;
const BREATH_STACKS_REQUIRED = 8;

test.describe('whisky breath (DESIGN_IDEAS §1)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('F consumes a ready stack and resets to zero', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
      } catch { /* ignore */ }
    }, CURRENT_META_SAVE_VERSION);

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
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    const readStacks = (): Promise<number | null> => page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: { getWhiskyBreathState(): { stacks: number } };
      } | undefined;
      const s = scene?.player?.getWhiskyBreathState?.();
      return s ? s.stacks : null;
    });

    // 1) Idle: stacks at 0.
    expect(await readStacks()).toBe(0);

    // 2) Force the player into a ready state so the F-press smoke
    //    isn't dependent on a 10-15s natural kill ramp. The recorder
    //    surface is a plain object — write through the accessor.
    const seeded = await page.evaluate((stacks) => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: {
          getWhiskyBreathState(): { stacks: number };
        } & Record<string, unknown>;
      } | undefined;
      if (!scene?.player) return false;
      // The state object is readonly at the type level but mutable at
      // runtime — same pattern shintyParry.spec uses for direct probe.
      const p = scene.player as unknown as {
        whiskyBreathState: { stacks: number };
      };
      p.whiskyBreathState = { stacks };
      return scene.player.getWhiskyBreathState().stacks === stacks;
    }, BREATH_STACKS_REQUIRED);
    expect(seeded, 'must be able to seed whisky stacks for the smoke').toBe(true);

    // 3) Wait for COUNTDOWN to clear — gameplay starts paused for the
    //    3-2-1 visual + first-frame stabilization. Player.update is
    //    gated on `!timeManager.isGameplayPaused()` (see runFrameTick).
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 10_000 });

    // 4) Hold F. Sister pattern to input-remap.spec — held key keeps
    //    `keys[70].isDown=true` across multiple Phaser frames so the
    //    rising-edge debouncer (`down && !prevDown`) catches it.
    await page.keyboard.down('f');
    const consumed = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: { getWhiskyBreathState(): { stacks: number } };
      } | undefined;
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        const stacks = scene?.player?.getWhiskyBreathState?.().stacks ?? -1;
        if (stacks === 0) return true;
        await new Promise((r) => setTimeout(r, 16));
      }
      return false;
    });
    await page.keyboard.up('f');
    expect(consumed, 'F-press must drop stacks to 0 within 2s').toBe(true);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
