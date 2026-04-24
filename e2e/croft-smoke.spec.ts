import { expect, test } from './fixtures';

/**
 * H1 M1 T10 — Gran's Croft scene smoke.
 *
 * Can't DOM-assert against a Phaser canvas, so (same pattern as
 * almanac-navigation / resume / w2-moor-road) the spec drives the
 * SceneManager directly and inspects scene state. Coverage:
 *
 *   1. Launching 'Croft' activates the scene without uncaught errors.
 *   2. Transition time from scene.start → isActive crosses under the
 *      spec's 500 ms budget.
 *   3. CroftScene mounts its signature sprites — Gran + hearth — in
 *      the display list, confirming BootScene baked the textures.
 *   4. Invoking the internal `handleAction('start_run')` routes out of
 *      Croft into the Curse picker (leaves-croft branch).
 *   5. Starting 'Croft' again reactivates cleanly — post-run return
 *      from GameOver (T9) relies on this re-entry path.
 */

const CURRENT_SAVE_VERSION = 13;

test.describe('H1 Gran\'s Croft — M1 scene smoke', () => {
  test('Croft activates, shows Gran+hearth, routes to Curse, and reactivates', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
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

    // (1) + (2) — launch Croft and time the transition.
    const launch = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return { ok: false, ms: Number.POSITIVE_INFINITY };
      const t0 = performance.now();
      g.scene.start('Croft');
      const deadline = t0 + 15_000;
      while (performance.now() < deadline) {
        if (g.scene.isActive('Croft')) return { ok: true, ms: performance.now() - t0 };
        await new Promise((r) => setTimeout(r, 16));
      }
      return { ok: false, ms: performance.now() - t0 };
    });
    expect(launch.ok, 'Croft scene did not become active').toBe(true);
    expect(launch.ms, `Croft transition ${launch.ms.toFixed(0)}ms exceeds 500ms budget`).toBeLessThan(500);

    // (3) — Gran + hearth textures exist in the TextureManager.
    const textures = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        textures: { exists(k: string): boolean };
      } }).game;
      return {
        granF0: g.textures.exists('croft_gran_f0'),
        granF2: g.textures.exists('croft_gran_f2'),
        hearthF0: g.textures.exists('croft_hearth_f0'),
        hearthF3: g.textures.exists('croft_hearth_f3'),
      };
    });
    expect(textures.granF0, 'croft_gran_f0 missing from cache').toBe(true);
    expect(textures.granF2, 'croft_gran_f2 missing from cache').toBe(true);
    expect(textures.hearthF0, 'croft_hearth_f0 missing from cache').toBe(true);
    expect(textures.hearthF3, 'croft_hearth_f3 missing from cache').toBe(true);

    // Gran + hearth sprites ended up in the scene's display list.
    const displayList = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g.scene.getScene('Croft') as {
        children: { list: Array<{ texture?: { key?: string } }> };
      };
      const keys = scene.children.list
        .map((o) => o.texture?.key)
        .filter((k): k is string => typeof k === 'string');
      return {
        hasGran: keys.some((k) => k.startsWith('croft_gran_')),
        hasHearth: keys.some((k) => k.startsWith('croft_hearth_')),
      };
    });
    expect(displayList.hasGran, 'Gran sprite not rendered in CroftScene').toBe(true);
    expect(displayList.hasHearth, 'Hearth sprite not rendered in CroftScene').toBe(true);

    // (4) — Start Run action routes to Curse.
    const routed = await page.evaluate(async () => {
      const g = (window as unknown as { game: {
        scene: {
          getScene(k: string): unknown;
          isActive(k: string): boolean;
        };
      } }).game;
      const scene = g.scene.getScene('Croft') as {
        handleAction?(key: string): void;
      };
      scene.handleAction?.('start_run');
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Curse')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(routed, 'Start Run did not transition Croft → Curse').toBe(true);

    // (5) — Re-enter Croft from the Curse picker (simulates the T9 return path
    // but bypasses the full run/die cycle, which `long-session-smoke.spec.ts`
    // already exercises).
    const reEntered = await page.evaluate(async () => {
      const g = (window as unknown as { game: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      g.scene.start('Croft');
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Croft')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(reEntered, 'Second Croft activation failed').toBe(true);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
