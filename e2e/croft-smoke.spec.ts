import type { Page } from '@playwright/test';
import { SAVE_SCHEMA_VERSION as LEGACY_SAVE_SCHEMA_VERSION } from '../src/utils/save/schema';
import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as META_SAVE_VERSION } from '../src/core/SaveManager';

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
 *   4. On a fresh save, Croft shows only Start Run + Settings and
 *      `handleAction('start_run')` routes directly into a clean Game.
 *   5. Starting 'Croft' again reactivates cleanly — post-run return
 *      from GameOver (T9) relies on this re-entry path.
 *   6. Default `whs_save` (no blob) → `livingWorldUnlocks.selectedCompanion`
 *      stays the schema default (`sheepdog`) → GameScene's delayed
 *      `whistleCall` actually spawns the ally (wiring smoke).
 *   7. Explicit `selectedCompanion: null` in `whs_save` → no delayed
 *      whistle; companion stays absent (opt-out path).
 */

type GameWin = {
  game?: {
    scene: {
      start(k: string): void;
      isActive(k: string): boolean;
      getScene(k: string): unknown;
    };
  };
};

async function dismissCanvasChrome(page: Page): Promise<void> {
  const canvas = page.locator('canvas[role="application"]');
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await canvas.click({ position: { x: 8, y: 8 } });
  await page.bringToFront();
}

type GameSceneProbe = {
  companionSystem?: { getActiveKey(): string | null } | null;
};

/**
 * Croft active → Start Run → Game active **and** `GameScene.create()` has
 * constructed `companionSystem` (`isActive('Game')` alone can be true while
 * `create()` is still running on the reused instance).
 */
async function croftStartRunToGame(page: Page): Promise<boolean> {
  return page.evaluate(async () => {
    const g = (window as unknown as GameWin).game;
    if (!g) return false;
    g.scene.start('Croft');
    const croftDeadline = Date.now() + 15_000;
    while (Date.now() < croftDeadline) {
      if (g.scene.isActive('Croft')) break;
      await new Promise((r) => setTimeout(r, 50));
    }
    if (!g.scene.isActive('Croft')) return false;
    const croftScene = g.scene.getScene('Croft') as { handleAction?(key: string): void };
    croftScene.handleAction?.('start_run');
    const gameDeadline = Date.now() + 20_000;
    while (Date.now() < gameDeadline) {
      if (!g.scene.isActive('Game')) {
        await new Promise((r) => setTimeout(r, 50));
        continue;
      }
      const gameScene = g.scene.getScene('Game') as GameSceneProbe | null;
      if (gameScene?.companionSystem != null) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  });
}

test.describe('H1 Gran\'s Croft — M1 scene smoke', () => {
  test('Croft activates, shows Gran+hearth, starts first run cleanly, and reactivates', async ({ page }) => {
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
    }, META_SAVE_VERSION);

    await page.goto('./');
    await dismissCanvasChrome(page);

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

    // (3) — Gran + hearth + Living World first-slice textures exist in the TextureManager.
    const textures = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        textures: { exists(k: string): boolean };
      } }).game;
      return {
        granF0: g.textures.exists('croft_gran_f0'),
        granF2: g.textures.exists('croft_gran_f2'),
        hearthF0: g.textures.exists('croft_hearth_f0'),
        hearthF3: g.textures.exists('croft_hearth_f3'),
        selkie: g.textures.exists('haggis_selkie'),
        sheepdog: g.textures.exists('croft_sheepdog_stand_f0'),
        waulkingMallet: g.textures.exists('wicon_waulking_mallet'),
        upHellyAaEmber: g.textures.exists('fx_ember_spark'),
      };
    });
    expect(textures.granF0, 'croft_gran_f0 missing from cache').toBe(true);
    expect(textures.granF2, 'croft_gran_f2 missing from cache').toBe(true);
    expect(textures.hearthF0, 'croft_hearth_f0 missing from cache').toBe(true);
    expect(textures.hearthF3, 'croft_hearth_f3 missing from cache').toBe(true);
    expect(textures.selkie, 'haggis_selkie missing from cache').toBe(true);
    expect(textures.sheepdog, 'croft_sheepdog_stand_f0 missing from cache').toBe(true);
    expect(textures.waulkingMallet, 'wicon_waulking_mallet missing from cache').toBe(true);
    expect(textures.upHellyAaEmber, 'fx_ember_spark missing from cache').toBe(true);

    // Gran + hearth sprites ended up in the scene's display list.
    const displayList = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g.scene.getScene('Croft') as {
        children: { list: Array<{ texture?: { key?: string }; text?: string; list?: unknown[] }> };
      };
      const keys = scene.children.list
        .map((o) => o.texture?.key)
        .filter((k): k is string => typeof k === 'string');
      const labels: string[] = [];
      const visit = (obj: unknown): void => {
        const maybe = obj as { text?: unknown; list?: unknown[] };
        if (typeof maybe.text === 'string') labels.push(maybe.text);
        if (Array.isArray(maybe.list)) {
          for (const child of maybe.list) visit(child);
        }
      };
      for (const obj of scene.children.list) visit(obj);
      return {
        hasGran: keys.some((k) => k.startsWith('croft_gran_')),
        hasHearth: keys.some((k) => k.startsWith('croft_hearth_')),
        hasLivingWorldPanel: labels.includes('THE LIVING MOOR'),
      };
    });
    expect(displayList.hasGran, 'Gran sprite not rendered in CroftScene').toBe(true);
    expect(displayList.hasHearth, 'Hearth sprite not rendered in CroftScene').toBe(true);
    expect(displayList.hasLivingWorldPanel, 'Living World Croft panel not rendered').toBe(true);

    // (4) — First-run progressive disclosure: no empty Shop/Chronicle
    // detour, and Start Run routes straight into a clean Game.
    const firstRunActions = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g.scene.getScene('Croft') as {
        actionEntries?: Array<{ key: string }>;
      };
      return scene.actionEntries?.map((e) => e.key) ?? [];
    });
    expect(firstRunActions).toEqual(['start_run', 'settings']);

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
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(routed, 'Start Run did not transition Croft → Game for a first run').toBe(true);

    // (5) — Re-enter Croft from the Game scene (simulates the T9 return path
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

  test('Croft → Game: default save whistles sheepdog after run-intro delay', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaVer) => {
      try {
        localStorage.removeItem('whs_save');
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: metaVer,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, META_SAVE_VERSION);

    await page.goto('./');
    await dismissCanvasChrome(page);

    const enteredGame = await croftStartRunToGame(page);
    expect(enteredGame, 'Croft → Game transition failed').toBe(true);

    // GameScene schedules `whistleCall(selected)` at +2400 ms game time;
    // wall-clock wait with headroom for countdown / first-frame skew.
    const sheepdogOk = await page.evaluate(async () => {
      const g = (window as unknown as GameWin).game;
      const deadline = Date.now() + 12_000;
      while (Date.now() < deadline) {
        const game = g?.scene.getScene('Game') as GameSceneProbe | null | undefined;
        const sys = game?.companionSystem;
        if (sys && typeof sys.getActiveKey === 'function' && sys.getActiveKey() === 'sheepdog') {
          return true;
        }
        await new Promise((r) => setTimeout(r, 80));
      }
      return false;
    });
    expect(sheepdogOk, 'sheepdog should whistle in from default livingWorldUnlocks').toBe(true);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('Croft → Game: persisted companion opt-out skips whistleCall', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaVer, schemaVer) => {
      try {
        localStorage.setItem('whs_save', JSON.stringify({
          schemaVersion: schemaVer,
          livingWorldUnlocks: {
            unlockedCompanions: ['sheepdog'],
            selectedCompanion: null,
          },
        }));
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: metaVer,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, META_SAVE_VERSION, LEGACY_SAVE_SCHEMA_VERSION);

    await page.goto('./');
    await dismissCanvasChrome(page);

    const enteredGame = await croftStartRunToGame(page);
    expect(enteredGame, 'Croft → Game transition failed').toBe(true);

    const stayedSolo = await page.evaluate(async () => {
      const g = (window as unknown as GameWin).game;
      // Past the run-intro whistle window — a stray spawn would have fired by now.
      await new Promise((r) => setTimeout(r, 4500));
      const game = g?.scene.getScene('Game') as GameSceneProbe | null | undefined;
      const sys = game?.companionSystem;
      if (!sys || typeof sys.getActiveKey !== 'function') return { ok: false, reason: 'no_companion_system' };
      return { ok: sys.getActiveKey() === null, key: sys.getActiveKey() };
    });
    expect(stayedSolo.ok, JSON.stringify(stayedSolo)).toBe(true);
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
