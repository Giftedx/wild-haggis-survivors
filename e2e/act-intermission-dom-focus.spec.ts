import { expect, test } from './fixtures';

/**
 * T407 — DOM-visible focus layer for ActIntermissionScene (W2 route picker).
 *
 * Launches the intermission from a running Game (ScenePlugin.launch) and
 * asserts the visually-hidden mirror mounts with one button per route card,
 * stable `data-focus-id` values, and resolved copy (no raw i18n key leaks).
 */

const CURRENT_SAVE_VERSION = 9;

test.describe('ActIntermissionScene DOM focus mirror', () => {
  test('slot A mounts whs-act-intermission-focus-layer with three route buttons', async ({ page }) => {
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
    }, CURRENT_SAVE_VERSION);

    await page.goto('/');
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
        scene: {
          getScene(k: string): unknown;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) throw new Error('no game');
      const gameScenePlugin = g.scene.getScene('Game') as {
        scene: { launch(k: string, data?: unknown): void };
      } | null;
      if (!gameScenePlugin) throw new Error('no Game scene');
      gameScenePlugin.scene.launch('ActIntermission', {
        slot: 'A',
        atGameTimeSec: 305,
        onResolve: () => undefined,
      });
      const start = Date.now();
      while (Date.now() - start < 5_000) {
        if (g.scene.isActive('ActIntermission')) return;
        await new Promise((r) => setTimeout(r, 50));
      }
      throw new Error('ActIntermission never became active');
    });

    const layer = page.locator('[data-whs-dom-focus-layer="whs-act-intermission-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    await expect(buttons).toHaveCount(3);

    const expectedIds = [
      'act-intermission-up_the_brae',
      'act-intermission-round_the_loch',
      'act-intermission-through_the_kirkyard',
    ];
    for (let i = 0; i < 3; i++) {
      const focusId = await buttons.nth(i).getAttribute('data-focus-id');
      expect(focusId).toBe(expectedIds[i]);
    }

    for (let i = 0; i < 3; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('routes.'), `button ${i} leaks routes.* key`).toBe(false);
      expect(effective.startsWith('ui.actIntermission'), `button ${i} leaks ui.actIntermission key`).toBe(false);
    }

    await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { stop(k: string): void };
      } }).game;
      g?.scene.stop('ActIntermission');
    });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
