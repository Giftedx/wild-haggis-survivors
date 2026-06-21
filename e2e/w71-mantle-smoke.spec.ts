import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * W71 Phase 2 — heather-mantle smoke. Boots into Game, drives kills past
 * the tier thresholds (50, 250), asserts the Player overlay sprite
 * transitions: tier 0 (hidden) → tier 1 (collar) → tier 2 (collar + cape).
 * Also verifies the baked atlas contains the mantle texture keys for the
 * classic variant.
 */

interface MantleSnapshot {
  tier: number;
  overlayVisible: boolean;
  overlayAlpha: number;
  overlayTexture: string;
}

test.describe('W71 mantle smoke', () => {
  test('mantle overlay crosses tier thresholds at 50 and 250 kills', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(({ ver }) => {
      const existingRaw = localStorage.getItem('whs_meta_save');
      const existing = (existingRaw
        ? (JSON.parse(existingRaw) as Record<string, unknown>)
        : {}) as Record<string, unknown>;
      localStorage.setItem('whs_meta_save', JSON.stringify({
        ...existing,
        saveVersion: ver,
        hasCompletedTutorial: true,
      }));
      (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
    }, { ver: CURRENT_META_SAVE_VERSION });

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await canvas.focus();

    // Boot into Game directly.
    const booted = await page.evaluate(async () => {
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
    expect(booted, 'GameScene must boot').toBe(true);

    // Verify the mantle textures were baked.
    const texturesExist = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        textures: { exists(k: string): boolean };
      } }).game;
      return {
        tier1: g.textures.exists('mantle_classic_1'),
        tier2: g.textures.exists('mantle_classic_2'),
      };
    });
    expect(texturesExist.tier1, 'mantle_classic_1 texture baked').toBe(true);
    expect(texturesExist.tier2, 'mantle_classic_2 texture baked').toBe(true);

    // Helper to snapshot mantle state via GameScene access.
    // Bumps kill count by calling incrementKillCount the requested number
    // of times, waits for the reveal tween to complete, and returns the
    // current overlay state.
    const snapshot = async (bumpKillsTo: number, waitMs: number): Promise<MantleSnapshot> => {
      return page.evaluate(
        async (args) => {
          const g = (window as unknown as { game: {
            scene: { scenes: Array<{ scene: { key: string } }> };
          } }).game;
          const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
            runScore?: { killCount: number; incrementKillCount(): void };
            player?: {
              getMantleTier(): number;
              mantleOverlay?: {
                visible: boolean;
                alpha: number;
                texture: { key: string };
              };
            };
          };
          const rs = gs.runScore;
          const p = gs.player;
          if (!rs || !p) return { tier: -1, overlayVisible: false, overlayAlpha: 0, overlayTexture: '' };
          while (rs.killCount < args.target) rs.incrementKillCount();
          await new Promise((r) => setTimeout(r, args.waitMs));
          const overlay = (p as unknown as { mantleOverlay: {
            visible: boolean; alpha: number; texture: { key: string };
          } | null }).mantleOverlay;
          return {
            tier: p.getMantleTier(),
            overlayVisible: overlay?.visible ?? false,
            overlayAlpha: overlay?.alpha ?? 0,
            overlayTexture: overlay?.texture.key ?? '',
          };
        },
        { target: bumpKillsTo, waitMs },
      );
    };

    // ── Checkpoint 0: fresh run, no kills, mantle hidden ──
    const t0 = await snapshot(0, 100);
    expect(t0.tier, 'tier 0 at 0 kills').toBe(0);
    expect(t0.overlayVisible, 'overlay hidden at 0 kills').toBe(false);
    expect(t0.overlayAlpha, 'overlay alpha 0 at 0 kills').toBe(0);

    // ── Checkpoint 1: below tier-1 threshold ──
    const t1 = await snapshot(49, 100);
    expect(t1.tier, 'still tier 0 at 49 kills').toBe(0);
    expect(t1.overlayVisible, 'still hidden at 49 kills').toBe(false);

    // ── Checkpoint 2: tier-1 reveal ──
    // Wait 500ms so the 300ms alpha tween completes.
    const t2 = await snapshot(50, 500);
    expect(t2.tier, 'tier 1 at 50 kills').toBe(1);
    expect(t2.overlayVisible, 'overlay visible at tier 1').toBe(true);
    expect(t2.overlayTexture, 'tier 1 texture swapped').toBe('mantle_classic_1');
    expect(t2.overlayAlpha, 'tier 1 alpha tweened to 1').toBeGreaterThan(0.9);

    // ── Checkpoint 3: mid-tier-1 still stable ──
    const t3 = await snapshot(249, 100);
    expect(t3.tier, 'still tier 1 at 249 kills').toBe(1);
    expect(t3.overlayTexture, 'tier 1 texture held').toBe('mantle_classic_1');

    // ── Checkpoint 4: tier-2 reveal ──
    const t4 = await snapshot(250, 500);
    expect(t4.tier, 'tier 2 at 250 kills').toBe(2);
    expect(t4.overlayVisible, 'overlay visible at tier 2').toBe(true);
    expect(t4.overlayTexture, 'tier 2 texture swapped').toBe('mantle_classic_2');
    expect(t4.overlayAlpha, 'tier 2 alpha tweened to 1').toBeGreaterThan(0.9);

    // ── Checkpoint 5: no regression at very high kill count ──
    const t5 = await snapshot(1000, 100);
    expect(t5.tier, 'still tier 2 at 1000 kills').toBe(2);
    expect(t5.overlayTexture, 'tier 2 texture held').toBe('mantle_classic_2');

    // Spec §3.8 a11y path: we trust the unit test for instant-mode bypass —
    // e2e verifies the reveal happens at all with the tween. motionScale
    // captured at wire-time is covered by integration composition.

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
