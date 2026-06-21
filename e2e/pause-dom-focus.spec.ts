import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * T407 — DOM-visible focus mirror for in-run PauseMenu.
 *
 * Opens the pause overlay via GameScene.toggleUiPause and asserts the
 * hidden focus layer mounts with stable data-focus-id values and resolved
 * copy (no raw ui.pause.* key leaks on action buttons).
 */

test.describe('PauseMenu DOM focus mirror', () => {
  test('mounts whs-pause-focus-layer with resume, audio toggles, and quit', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game');
      const start = Date.now();
      while (Date.now() - start < 30_000) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      if (!g) return;
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: { getGameTimeSec?(): number };
      };
      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if ((gs.spawnSystem?.getGameTimeSec?.() ?? 0) > 2) return;
        await new Promise((r) => setTimeout(r, 100));
      }
    });

    await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as { toggleUiPause?: () => void } | undefined;
      gs?.toggleUiPause?.();
    });

    const layer = page.locator('[data-whs-dom-focus-layer="whs-pause-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    expect(count, 'pause panel should expose at least resume + sfx + music + quit').toBeGreaterThanOrEqual(4);

    await expect(layer.locator('[data-focus-id="pause-resume"]')).toHaveCount(1);
    await expect(layer.locator('[data-focus-id="pause-toggle-sfx"]')).toHaveCount(1);
    await expect(layer.locator('[data-focus-id="pause-toggle-music"]')).toHaveCount(1);
    await expect(layer.locator('[data-focus-id="pause-quit"]')).toHaveCount(1);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('ui.pause.'), `button ${i} leaks ui.pause.* key`).toBe(false);
    }

    const resumeBtn = layer.locator('button[data-focus-id="pause-resume"]');
    await resumeBtn.focus();
    await page.keyboard.press('ArrowDown');
    const focusedAfterArrow = await page.evaluate(() =>
      (document.activeElement as HTMLElement | null)?.getAttribute('data-focus-id') ?? '',
    );
    expect(focusedAfterArrow).toBe('pause-toggle-sfx');

    await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as { toggleUiPause?: () => void } | undefined;
      gs?.toggleUiPause?.();
    });

    await expect(layer).not.toBeAttached();

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
