import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * F1 M5 — GameScene persistent haar + BiomeController-driven ambient density.
 *
 * Proves the M5 wiring is live: GameScene mounts a HaarFogController on its
 * main camera at run start, the controller's renderNode resolves to
 * `'HaarFog'`, and the BiomeController's onBiomeEnter hook fires against
 * the haar state (teleport to a loch tile, assert density lifts above 0).
 *
 * Teleport uses `scene.physics.world` state directly — no public debug
 * helper exists for world-pos injection, so we reach through the Player
 * body via `window.game`. This is unavoidable on a canvas-only render
 * surface without adding test-only code to the production bundle.
 */

test.describe('F1 M5 — GameScene biome haar', () => {
  test('main camera carries a HaarFog filter for the full run', async ({ page }) => {
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

    const report = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        renderer?: { type?: number };
        scene: { getScene(k: string): unknown };
      } }).game;
      if (!g) return { error: 'no-game' };

      const WEBGL = 2;
      if (g.renderer?.type !== undefined && g.renderer.type !== WEBGL) {
        return { skipped: 'canvas-renderer' };
      }

      // Let the scene settle for one second — enough for initial biome tick.
      await new Promise((r) => setTimeout(r, 1_000));

      const scene = g.scene.getScene('Game') as {
        cameras?: {
          main?: {
            filters?: {
              internal?: { list?: Array<{ renderNode?: string; active?: boolean; state?: { density?: number } }> };
            };
          };
        };
      };
      const list = scene?.cameras?.main?.filters?.internal?.list ?? [];
      const haar = list.find((c) => c.renderNode === 'HaarFog');
      return {
        filtersListLength: list.length,
        haarPresent: !!haar,
        haarRenderNode: haar?.renderNode ?? null,
        haarActive: haar?.active ?? null,
        haarDensityNonNegative: (haar?.state?.density ?? -1) >= 0,
      };
    });

    if ('skipped' in report) {
      test.info().annotations.push({ type: 'skip-reason', description: 'Canvas renderer — haar disabled' });
      return;
    }

    expect(report.error, `Unexpected setup error: ${report.error}`).toBeUndefined();
    expect(report.haarPresent, 'HaarFogController missing from GameScene camera').toBe(true);
    expect(report.haarRenderNode).toBe('HaarFog');
    expect(report.haarActive).toBe(true);
    expect(report.haarDensityNonNegative).toBe(true);

    expect(pageErrors, 'No page errors during game-scene haar flow').toEqual([]);
  });

  test('teleporting to a loch tile lifts haar density above 0', async ({ page }) => {
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
    expect(gameActive).toBe(true);

    const report = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        renderer?: { type?: number };
        scene: { getScene(k: string): unknown };
      } }).game;
      if (!g) return { error: 'no-game' };

      const WEBGL = 2;
      if (g.renderer?.type !== undefined && g.renderer.type !== WEBGL) {
        return { skipped: 'canvas-renderer' };
      }

      const scene = g.scene.getScene('Game') as {
        getBiomeManager?: () => { biomeAt(x: number, y: number): string } | null;
        getPlayer?: () => { x: number; y: number; body?: { x: number; y: number; position?: { x: number; y: number } } };
        cameras?: {
          main?: {
            filters?: {
              internal?: { list?: Array<{ renderNode?: string; state?: { density?: number } }> };
            };
          };
        };
      };

      const bm = scene.getBiomeManager?.();
      if (!bm) return { error: 'no-biome-manager' };

      // Scan a grid for a loch tile.
      let lochPoint: { x: number; y: number } | null = null;
      outer: for (let x = 200; x < 2000; x += 80) {
        for (let y = 200; y < 2000; y += 80) {
          if (bm.biomeAt(x, y) === 'loch') { lochPoint = { x, y }; break outer; }
        }
      }
      if (!lochPoint) return { skipped: 'no-loch-in-scan' };

      const player = scene.getPlayer?.();
      if (!player) return { error: 'no-player' };
      player.x = lochPoint.x;
      player.y = lochPoint.y;
      const b = player.body;
      if (b) {
        b.x = lochPoint.x;
        b.y = lochPoint.y;
        if (b.position) { b.position.x = lochPoint.x; b.position.y = lochPoint.y; }
      }

      // Let BiomeController.tick observe the biome change + tween run a bit.
      await new Promise((r) => setTimeout(r, 1_200));

      const list = scene?.cameras?.main?.filters?.internal?.list ?? [];
      const haar = list.find((c) => c.renderNode === 'HaarFog');
      return {
        lochPoint,
        haarDensity: haar?.state?.density ?? null,
      };
    });

    if ('skipped' in report) {
      test.info().annotations.push({ type: 'skip-reason', description: String(report.skipped) });
      return;
    }
    expect(report.error, `Unexpected setup error: ${report.error}`).toBeUndefined();
    expect(report.haarDensity ?? 0).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
  });
});
