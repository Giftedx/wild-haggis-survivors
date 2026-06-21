import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';


test.describe('stance toggle (DESIGN_IDEAS §1)', () => {
  test('Q cycles loose -> braced -> reeling -> loose', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
      } catch {
        /* ignore */
      }
      (window as Window & { AUTO_BATTLE?: boolean }).AUTO_BATTLE = true;
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    const readStance = async (): Promise<string | null> =>
      page.evaluate(() => {
        const g = (window as unknown as { game?: {
          scene: { getScene(k: string): unknown };
        } }).game;
        const scene = g?.scene.getScene('Game') as {
          player?: { getStance?: () => string };
        } | undefined;
        return scene?.player?.getStance?.() ?? null;
      });

    expect(await readStance()).toBe('loose');

    // Wait for COUNTDOWN — Player.update is gated on
    // `!timeManager.isGameplayPaused()`. Without the wait, Q lands
    // during the 3-2-1 freeze and the stance never cycles.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 10_000 });

    // Hold/release Q so each press spans at least one Phaser frame —
    // `press()` can fire keydown→keyup inside a single frame, missing
    // the rising-edge debounce on `stanceCycleKeyPrevDown`.
    const tapQ = async () => {
      await page.keyboard.down('q');
      await page.waitForTimeout(80);
      await page.keyboard.up('q');
      await page.waitForTimeout(80);
    };

    await tapQ();
    expect(await readStance()).toBe('braced');

    await tapQ();
    expect(await readStance()).toBe('reeling');

    await tapQ();
    expect(await readStance()).toBe('loose');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
