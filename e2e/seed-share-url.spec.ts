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
// Same 26-bit seed mask the codec uses. Pin to a value that survives
// round-trip exactly so the deep link is byte-identical across builds.
const SEED_FOR_TEST = 12345 & 0x03ffffff;

test.describe('W82 shared-run URL', () => {
  test.setTimeout(60_000);

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

    // Build the deep-link URL via the same codec the production share
    // link uses. Mirrors `encodeSeed` from `src/utils/rng.ts` — base36,
    // 6-char body + 1-char checksum (sum-of-digits mod 36, NOT a
    // char-code hash; that's the trap a previous draft fell into).
    // The Playwright runtime can't import the source, so we inline the
    // codec here. Keep this in lockstep with the production codec; the
    // matching unit suites (`rng.test.ts`, `sharedRunUrl.test.ts`)
    // catch any drift.
    function encodeSeedCode(seed: number): string {
      const SEED_PAYLOAD_BITS = 26;
      const SEED_MASK = (1 << SEED_PAYLOAD_BITS) - 1;
      const body = (seed & SEED_MASK).toString(36).padStart(6, '0').toUpperCase();
      let sum = 0;
      for (let i = 0; i < body.length; i++) sum += parseInt(body[i], 36);
      const checksum = (sum % 36).toString(36).toUpperCase();
      return `${body}${checksum}`;
    }
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
});
