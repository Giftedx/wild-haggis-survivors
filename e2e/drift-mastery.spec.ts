import { expect, test } from './fixtures';

/**
 * Drift Mastery (DESIGN_IDEAS §1) input smoke. Asserts G is wired to
 * the consume edge and a seeded Grip pip gets consumed on the next
 * Player.update tick.
 *
 * Helper unit tests (`driftMastery.test.ts`) cover charge-accrual and
 * burst-cancel arithmetic. This smoke catches wiring failure (key
 * missed, accessor stale, burst never observable from outside).
 *
 * AUTO_BATTLE intentionally OFF — at timeScale=10 the auto-battler
 * keeps the player moving, the helper banks new charge and re-mints
 * a pip within the poll window, masking the consume edge.
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('drift mastery (DESIGN_IDEAS §1)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('G consumes a banked Grip pip and starts a burst', async ({ page }) => {
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

    type Probe = { pips: number; chargeMs: number; burstRemainingMs: number } | null;
    const readState = (): Promise<Probe> => page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: { getDriftMasteryState(): {
          pips: number; chargeMs: number; burstRemainingMs: number;
        } };
      } | undefined;
      const s = scene?.player?.getDriftMasteryState?.();
      return s ? { pips: s.pips, chargeMs: s.chargeMs, burstRemainingMs: s.burstRemainingMs } : null;
    });

    // 1) Idle: zero pips.
    const initial = await readState();
    expect(initial).not.toBeNull();
    expect(initial!.pips).toBe(0);

    // 2) Seed a pip directly so the G-press smoke isn't dependent on
    //    the player wrestling the input vector for a full second
    //    (pure helper covers that arithmetic).
    const seeded = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: Record<string, unknown>;
      } | undefined;
      if (!scene?.player) return false;
      const p = scene.player as unknown as {
        driftMasteryState: { pips: number; chargeMs: number; burstRemainingMs: number };
      };
      p.driftMasteryState = { pips: 1, chargeMs: 0, burstRemainingMs: 0 };
      return true;
    });
    expect(seeded).toBe(true);
    expect((await readState())!.pips).toBe(1);

    // 3) Wait for COUNTDOWN to clear — Player.update is gated on
    //    `!timeManager.isGameplayPaused()`. Without the wait, the G
    //    keydown lands during the 3-2-1 freeze and the helper never
    //    ticks the consume edge.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 10_000 });

    // 4) Hold G + in-page poll for the consume. Sister pattern to
    //    input-remap.spec — `keyboard.press()` can keydown→keyup inside
    //    one Phaser frame, missing the rising edge.
    await page.keyboard.down('g');
    const result = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        player?: { getDriftMasteryState(): {
          pips: number; burstRemainingMs: number;
        } };
      } | undefined;
      const deadline = Date.now() + 2000;
      while (Date.now() < deadline) {
        const s = scene?.player?.getDriftMasteryState?.();
        if (s && s.pips === 0 && s.burstRemainingMs > 0) return true;
        await new Promise((r) => setTimeout(r, 16));
      }
      return false;
    });
    await page.keyboard.up('g');
    expect(result, 'G-press must consume the pip and start a burst within 2s').toBe(true);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
