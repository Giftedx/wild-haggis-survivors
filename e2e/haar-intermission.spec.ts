import { expect, test } from './fixtures';

/**
 * F1 — ActIntermissionScene haar-fog smoke.
 *
 * Launches the picker via the Game scene's ScenePlugin (same pattern as
 * w2-moor-road.spec.ts) and inspects the intermission camera's filter list
 * to confirm the HaarFogController landed, its renderNode id resolves to
 * `'HaarFog'`, and the tween has lifted density above 0 by the time the
 * scene is active.
 *
 * This is the first e2e that proves Phaser 4's filter render-node pipeline
 * is wired end-to-end: render-node registered in game config, controller
 * attached to camera.filters.internal, shader program compiles, tween
 * mutates state the render node reads at draw time.
 */

const CURRENT_SAVE_VERSION = 14;

test.describe('F1 haar fog — ActIntermissionScene smoke', () => {
  test('intermission applies a HaarFogController with density tweening up', async ({ page }) => {
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

    const haarReport = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        renderer?: { type?: number };
        scene: {
          getScene(k: string): unknown;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return { error: 'no-game' };

      const WEBGL = 2;
      const rendererType = g.renderer?.type;
      if (rendererType !== undefined && rendererType !== WEBGL) {
        return { skipped: 'canvas-renderer', rendererType };
      }

      const gameScenePlugin = g.scene.getScene('Game') as {
        scene: { launch(k: string, data?: unknown): void };
      } | null;
      if (!gameScenePlugin) return { error: 'no-game-scene' };

      gameScenePlugin.scene.launch('ActIntermission', {
        slot: 'A',
        atGameTimeSec: 305,
        onResolve: () => undefined,
      });

      const start = Date.now();
      while (Date.now() - start < 5_000) {
        if (g.scene.isActive('ActIntermission')) break;
        await new Promise((r) => setTimeout(r, 50));
      }
      if (!g.scene.isActive('ActIntermission')) return { error: 'intermission-never-active' };

      // Let the ease-in tween run a little past 0.
      await new Promise((r) => setTimeout(r, 400));

      const actScene = g.scene.getScene('ActIntermission') as {
        cameras?: {
          main?: {
            filters?: {
              internal?: { list?: Array<{ renderNode?: string; active?: boolean; state?: { density?: number } }> };
            };
          };
        };
      };
      const list = actScene?.cameras?.main?.filters?.internal?.list ?? [];
      const haar = list.find((c) => c.renderNode === 'HaarFog');
      return {
        filtersListLength: list.length,
        haarPresent: !!haar,
        haarRenderNode: haar?.renderNode ?? null,
        haarActive: haar?.active ?? null,
        haarDensity: haar?.state?.density ?? null,
      };
    });

    if ('skipped' in haarReport) {
      test.info().annotations.push({ type: 'skip-reason', description: 'Canvas renderer — haar disabled' });
      return;
    }

    expect(haarReport.error, `Unexpected setup error: ${haarReport.error}`).toBeUndefined();
    expect(haarReport.haarPresent, 'HaarFogController missing from intermission camera').toBe(true);
    expect(haarReport.haarRenderNode).toBe('HaarFog');
    expect(haarReport.haarActive).toBe(true);
    expect(haarReport.haarDensity ?? 0).toBeGreaterThan(0);

    expect(pageErrors, 'No page errors during haar intermission flow').toEqual([]);
  });
});
