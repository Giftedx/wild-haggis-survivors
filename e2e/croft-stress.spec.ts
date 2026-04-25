import { expect, test } from './fixtures';

/**
 * T405 — CroftScene reuse stress test.
 *
 * The croft-smoke spec covers one Croft → Curse → Croft round-trip.
 * This spec stresses the same scene-reuse path with five consecutive
 * entries and asserts:
 *
 *   1. Each entry activates the scene cleanly (no scene-state stall).
 *   2. The display-list size after every entry matches the first entry's
 *      count — proves the reset block in `CroftScene.create()` keeps up
 *      with the live draw, no listener / GameObject growth across cycles.
 *   3. No uncaught page errors fire across the five cycles.
 *
 * Pairs with the small CroftScene reset-block tightening that nulls the
 * `ambient` field on every create() (belt + braces with the shutdown
 * handler). If a future refactor leaks a sprite or a scrollable group,
 * the count comparison surfaces the regression at the next CI run.
 */

const CURRENT_SAVE_VERSION = 13;

test.describe('T405 CroftScene reuse stress', () => {
  test('five Croft entries hold the display-list size steady', async ({ page }) => {
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

    const cycle = async (): Promise<{ ok: boolean; listSize: number }> =>
      page.evaluate(async () => {
        const g = (window as unknown as { game?: {
          scene: {
            start(k: string): void;
            isActive(k: string): boolean;
            getScene(k: string): unknown;
          };
        } }).game;
        if (!g) return { ok: false, listSize: -1 };
        g.scene.start('Croft');
        const deadline = Date.now() + 5_000;
        while (Date.now() < deadline) {
          if (g.scene.isActive('Croft')) break;
          await new Promise((r) => setTimeout(r, 32));
        }
        if (!g.scene.isActive('Croft')) return { ok: false, listSize: -1 };
        // Settle a frame so the deferred draw calls (mantelpiece /
        // photo wall / drove / seasonal banner) all land before the
        // count is read. Without this beat the first read can sample
        // mid-creation and report a smaller size than later entries.
        await new Promise((r) => setTimeout(r, 80));
        const scene = g.scene.getScene('Croft') as { children: { list: unknown[] } };
        const listSize = scene.children.list.length;
        // Bounce out via the Curse picker — same path the user takes
        // with the "Start Run" button. The Curse scene is cheap to
        // boot and reaching it triggers Croft's shutdown handler.
        const reachable = g.scene as unknown as {
          start(k: string): void;
          isActive(k: string): boolean;
        };
        reachable.start('Curse');
        const exitDeadline = Date.now() + 5_000;
        while (Date.now() < exitDeadline) {
          if (reachable.isActive('Curse')) break;
          await new Promise((r) => setTimeout(r, 32));
        }
        return { ok: reachable.isActive('Curse'), listSize };
      });

    const sizes: number[] = [];
    for (let i = 0; i < 5; i++) {
      const { ok, listSize } = await cycle();
      expect(ok, `cycle ${i + 1} did not transition out via Curse`).toBe(true);
      sizes.push(listSize);
    }

    // Every cycle's display-list size must match the first. A consistent
    // increase per cycle would mean the reset block is letting some
    // GameObject persist (the bug class CLAUDE.md's scene-reuse note
    // exists to prevent).
    expect(sizes[0], 'first cycle list size > 0').toBeGreaterThan(0);
    for (let i = 1; i < sizes.length; i++) {
      expect(
        sizes[i],
        `cycle ${i + 1} display list size ${sizes[i]} drifted from baseline ${sizes[0]} (deltas=${sizes.map((s) => s - sizes[0]).join(',')})`,
      ).toBe(sizes[0]);
    }

    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
