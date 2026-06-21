import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * R1 M2 Ship Gate — relic pickup end-to-end.
 *
 * Spawns a Relic pickup next to the player via the DEBUG test seam
 * (`DEBUG.spawnRelicAt`), waits for the walk-over overlap to fire, and
 * asserts that `DEBUG.getHeldRelicKeys()` reflects the pickup.
 *
 * We drive the pickup via DEBUG rather than rolling against an elite
 * kill so the smoke is deterministic — the probabilistic 15% roll +
 * catalogue weighting already has full unit coverage in
 * `src/data/relicDrops.test.ts` + `src/systems/RelicSystem.test.ts`.
 *
 * The spec also confirms the live relic catalogue is reachable at runtime
 * (DEBUG.getRelicCatalogueKeys), so a missing or mis-registered relic
 * fails fast before the slot test runs.
 */

test.describe('R1 — Relic pickup flow', () => {
  test('spawn → walk over → slot filled', async ({ page }) => {
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
        // AUTO_BATTLE keeps the player mobile + short-circuits
        // level-up modals if any fire during the smoke.
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
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

    // Boot Game.
    const gameBooted = await page.evaluate(async () => {
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
    expect(gameBooted, 'Game scene failed to activate').toBe(true);

    // Wait for the scene to tick past countdown (gameplay live).
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

    // Sanity: DEBUG surface exposes the live relic catalogue.
    const catalogueKeys = await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: {
        getRelicCatalogueKeys?(): readonly string[];
      } }).DEBUG;
      return dbg?.getRelicCatalogueKeys?.() ?? [];
    });
    expect(catalogueKeys.length).toBe(19);
    expect(catalogueKeys).toContain('sporran_of_holding');
    expect(catalogueKeys).toContain('stormcrown');

    // Held slots start empty.
    const initialHeld = await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: {
        getHeldRelicKeys?(): readonly string[];
      } }).DEBUG;
      return dbg?.getHeldRelicKeys?.() ?? [];
    });
    expect(initialHeld).toEqual([]);

    // Spawn a Relic pickup at the player's current position. Walk-over
    // is immediate because the physics hitbox radius (34px) already
    // covers "overlapping". Wait a beat for Arcade overlap dispatch.
    const held = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const dbg = (window as unknown as { DEBUG?: {
        spawnRelicAt?(key: string, x: number, y: number): boolean;
        getHeldRelicKeys?(): readonly string[];
      } }).DEBUG;
      if (!g || !dbg?.spawnRelicAt) return { ok: false, held: [] as readonly string[] };
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        player?: { x: number; y: number };
      };
      const px = gs.player?.x ?? 0;
      const py = gs.player?.y ?? 0;
      const spawned = dbg.spawnRelicAt('sporran_of_holding', px, py);
      if (!spawned) return { ok: false, held: [] };
      // Give physics a handful of frames to fire the overlap.
      const start = Date.now();
      while (Date.now() - start < 3_000) {
        const current = dbg.getHeldRelicKeys?.() ?? [];
        if (current.includes('sporran_of_holding')) {
          return { ok: true, held: current };
        }
        await new Promise((r) => setTimeout(r, 50));
      }
      return { ok: false, held: dbg.getHeldRelicKeys?.() ?? [] };
    });

    expect(held.ok, `Relic was not collected; held=${JSON.stringify(held.held)}`).toBe(true);
    expect(held.held).toContain('sporran_of_holding');
    expect(pageErrors).toEqual([]);
  });
});
