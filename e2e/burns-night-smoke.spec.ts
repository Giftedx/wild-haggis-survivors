import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * E1 M2 T15 — Burns Night smoke (clock-mocked).
 *
 * The seasonal framework reads device-local `new Date()` inside the
 * pure `SeasonalEventManager` helper, so mocking the Date constructor
 * with `addInitScript` is enough to force a run into the Burns
 * Night window. The spec then confirms that:
 *
 *   1. Scots-EN parity still loads without errors.
 *   2. MenuScene renders the seasonal banner text at the top.
 *   3. CroftScene renders the seasonal banner AND the Burns-themed
 *      croft props (haggis platter + Address card + bloomed thistle).
 *
 * In-run ceremony stinger + platter spawn live on the audio/physics
 * layer and are unit-tested via the pure helpers; driving 30 s of
 * game time through a headless browser is brittle for a smoke spec.
 */

const BURNS_NIGHT_DATE_ISO = '2027-01-25T12:00:00';

test.describe('E1 Burns Night — clock-mocked smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((iso) => {
      const RealDate = Date;
      const MOCK_TIME = new RealDate(iso).getTime();
      class MockDate extends RealDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(MOCK_TIME);
          } else {
            // Forward through the real constructor so explicit-argument
            // calls (new Date(2027, 0, 25, 12, 0, 0)) keep working.
            super(...(args as ConstructorParameters<typeof Date>));
          }
        }
        static override now(): number { return MOCK_TIME; }
      }
      // Swap the global.
      (globalThis as { Date: typeof Date }).Date = MockDate as unknown as typeof Date;
    }, BURNS_NIGHT_DATE_ISO);
  });

  test('MainMenu shows the Burns Night banner text', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaSaveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: metaSaveVersion,
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

    // Force MenuScene active (the boot splash may linger in headless
    // runs with the mocked Date). Starting 'Menu' directly once the
    // game object is live is the pattern used by croft-smoke.
    const onMenu = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean; start(k: string): void };
      } }).game;
      if (!g) return false;
      g.scene.start('Menu');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Menu')) return true;
        await new Promise((r) => setTimeout(r, 60));
      }
      return false;
    });
    expect(onMenu, 'Menu scene did not activate').toBe(true);

    // Banner fades in over ~400 ms; give it time to land in the
    // display list before inspecting.
    await page.waitForTimeout(200);

    // Banner text lives on a Phaser.Text in Menu's children list.
    const bannerText = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g.scene.getScene('Menu') as {
        children: {
          list: Array<{
            type?: string;
            text?: string;
          }>;
        };
      };
      return scene.children.list
        .filter((o) => o.type === 'Text')
        .map((o) => o.text ?? '')
        .find((s) => s.includes('Burns Night') && s.includes('live')) ?? '';
    });
    expect(bannerText, 'Burns Night banner text not found on Menu').not.toBe('');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('CroftScene renders Burns Night banner + seasonal props', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaSaveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: metaSaveVersion,
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

    const activated = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Croft');
      const deadline = Date.now() + 10_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Croft')) return true;
        await new Promise((r) => setTimeout(r, 60));
      }
      return false;
    });
    expect(activated, 'CroftScene did not activate').toBe(true);

    // Give the seasonal banner + props a moment to render into the
    // display list (banner fades in; props drawn synchronously in
    // create()). The banner itself fades out after ~5 s, so we check
    // well before then.
    await page.waitForTimeout(200);

    const state = await page.evaluate(() => {
      const g = (window as unknown as { game: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g.scene.getScene('Croft') as {
        children: {
          list: Array<{
            type?: string;
            text?: string;
          }>;
        };
        seasonalPropsGfx?: unknown;
      };
      const hasBannerText = scene.children.list
        .some((o) => o.type === 'Text' && typeof o.text === 'string' && o.text.includes('Burns Night'));
      const hasSeasonalPropsGfx = scene.seasonalPropsGfx != null;
      return { hasBannerText, hasSeasonalPropsGfx };
    });

    expect(state.hasBannerText, 'Croft banner text missing').toBe(true);
    expect(state.hasSeasonalPropsGfx, 'CroftScene seasonalPropsGfx is null during Burns Night').toBe(true);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
