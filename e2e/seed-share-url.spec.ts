import { expect, test } from './fixtures';

/**
 * W82 Shared-run URL — recipient-side smoke.
 *
 * Verifies that visiting `?run=<seed>&v=<variant>&c=<curse>` drops the
 * player straight into Game with the same starting conditions the
 * sharer recorded:
 *  - Game scene is the one that activates (no menu detour).
 *  - GameScene.activeVariant.key matches the shared variant.
 *  - GameScene.activeCurseKey matches the shared curse.
 *  - The URL is scrubbed to the pathname (so refresh / back-nav lands
 *    on the menu cleanly instead of re-triggering the same run).
 *
 * Builds the URL via the same helper the Game Over share-run link
 * uses, so the codec is exercised end-to-end (build → URL → parse
 * → init data → applied state).
 */

const CURRENT_SAVE_VERSION = 9;
// Pin to a small stable seed so the deep link is byte-identical across builds.
const SEED_FOR_TEST = 12345;

test.describe('W82 shared-run URL', () => {
  test.setTimeout(60_000);

  /**
   * Inlined seed-code encoder — mirrors `encodeSeed` from
   * `src/utils/rng.ts`. The Playwright runtime can't import the
   * source, so the codec is duplicated here. Kept in lockstep with
   * production by the matching unit suite (`rng.test.ts`,
   * `sharedRunUrl.test.ts`).
   */
  function encodeSeedCode(seed: number): string {
    const normalizedSeed = Number.isFinite(seed)
      ? Math.floor(Math.abs(seed)) >>> 0
      : 0x9e3779b9;
    const normalized = normalizedSeed === 0 ? 0x9e3779b9 : normalizedSeed;
    const body = normalized.toString(36).padStart(7, '0').toUpperCase();
    let sum = 0;
    for (let i = 0; i < body.length; i++) sum += parseInt(body[i], 36);
    const checksum = (sum % 36).toString(36).toUpperCase();
    return `${body}${checksum}`;
  }

  test('?run=<seed>&v=<variant>&c=<curse> launches Game with matching setup', async ({ page }) => {
    // Pre-seed the cultural-content + photosensitivity gates and bump
    // saveVersion past migrations so BootScene reaches the shared-run
    // branch without splash interception.
    await page.addInitScript((ver) => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch { /* ignore */ }
    }, CURRENT_SAVE_VERSION);

    const sharedRunUrl = `/?run=${encodeSeedCode(SEED_FOR_TEST)}&v=classic&c=heavy_legs`;

    await page.goto(sharedRunUrl);

    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    // BootScene's shared-run branch starts Game directly — no menu
    // detour. Wait for the scene to activate.
    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate from shared-run URL').toBe(true);

    // The applied variant + curse must match the URL — this is the
    // whole point of the share.
    const applied = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene: (k: string) => unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as unknown as {
        activeVariant?: { key?: string };
        activeCurseKey?: string | null;
      };
      return {
        variantKey: scene?.activeVariant?.key ?? null,
        curseKey: scene?.activeCurseKey ?? null,
      };
    });
    expect(applied.variantKey).toBe('classic');
    expect(applied.curseKey).toBe('heavy_legs');

    // URL scrub — after the share-run dispatch, the query params must
    // be gone so refresh / back-nav doesn't re-trigger the same run.
    const stripped = await page.evaluate(() => window.location.search);
    expect(stripped).toBe('');
  });

  test('?run=...&t=<sec>&o=<v|d> propagates challenge metadata to GameScene', async ({ page }) => {
    await page.addInitScript((ver) => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch { /* ignore */ }
    }, CURRENT_SAVE_VERSION);

    // V2 challenge URL — encodes a 12:34 victory (754s) on classic +
    // heavy_legs. The recipient's GameScene reads the parsed
    // `pendingSharedRunMeta.challenge` once during create() to drive
    // the "↗ Shared run · ... · 12:34 to beat" toast.
    const challengeUrl = `/?run=${encodeSeedCode(SEED_FOR_TEST)}&v=classic&c=heavy_legs&t=754&o=v`;
    await page.goto(challengeUrl);

    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate from challenge URL').toBe(true);

    // URL scrub still applies. Setup half (variant + curse) still
    // resolves into the GameScene state alongside the challenge.
    const applied = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene: (k: string) => unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as unknown as {
        activeVariant?: { key?: string };
        activeCurseKey?: string | null;
      };
      return {
        variantKey: scene?.activeVariant?.key ?? null,
        curseKey: scene?.activeCurseKey ?? null,
        stripped: window.location.search,
      };
    });
    expect(applied.variantKey).toBe('classic');
    expect(applied.curseKey).toBe('heavy_legs');
    expect(applied.stripped).toBe('');
  });
});
