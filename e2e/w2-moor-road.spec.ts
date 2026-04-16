import { expect, test } from './fixtures';

/**
 * W2 Moor Road E2E — verifies the ActIntermission scene can be launched
 * and resolved end-to-end inside a running Game.
 *
 * Phaser renders to a canvas, so queryable DOM text is not available.
 * The test therefore drives the scene manager directly (same pattern as
 * resume.spec.ts) and asserts observable side-effects:
 *   1. launch('ActIntermission', {...}) activates the scene.
 *   2. resolve(route) invokes onResolve synchronously with a complete
 *      RoutePick and stops the scene.
 *   3. The pick's shape matches what GameScene's onResolve closure expects.
 *
 * The full boss-sequence playthrough (gordon → tour_bus → the_laird)
 * would require a DEBUG.killCurrentBoss hook that doesn't exist; adding
 * one was out of scope for this ship. Picker launch + resolve is the
 * load-bearing new surface the test exists to guard.
 */

const CURRENT_SAVE_VERSION = 9;

test.describe('W2 Moor Road — ActIntermissionScene smoke', () => {
  test('launch → resolve contract holds in a running game', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    // Skip the FTUE tutorial so Game scene ticks without time locks.
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

    // Jump straight into Game.
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

    // Launch the picker scene via the running Game scene's ScenePlugin
    // (SceneManager doesn't expose `launch`; scene plugin instances do).
    const resolvedPick = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          getScene(k: string): unknown;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return null;
      const gameScenePlugin = (g.scene.getScene('Game') as {
        scene: { launch(k: string, data?: unknown): void };
      } | null);
      if (!gameScenePlugin) return { error: 'no-game-scene' };

      return new Promise<unknown>((resolve) => {
        gameScenePlugin.scene.launch('ActIntermission', {
          slot: 'A',
          atGameTimeSec: 305,
          onResolve: (pick: unknown) => resolve(pick),
        });
        setTimeout(() => resolve({ timedOut: true }), 5_000);
        (async () => {
          const start = Date.now();
          while (Date.now() - start < 3_000) {
            if (g.scene.isActive('ActIntermission')) {
              const actScene = g.scene.getScene('ActIntermission') as {
                resolve?(route: unknown): void;
              };
              actScene.resolve?.({
                key: 'up_the_brae', slot: 'A',
                labelKey: 'routes.up_the_brae.label',
                descKey: 'routes.up_the_brae.desc',
                modifierDeltas: {},
              });
              return;
            }
            await new Promise((r) => setTimeout(r, 50));
          }
        })();
      });
    });

    expect(resolvedPick).not.toBeNull();
    expect(resolvedPick).toMatchObject({
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    });

    expect(pageErrors, 'No page errors during picker flow').toEqual([]);
  });
});
