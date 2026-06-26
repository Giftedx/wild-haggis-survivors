import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * 2026-05-10 — cultural-content first-launch splash e2e.
 *
 * Sister spec to `photosensitivity-warning.spec.ts`. The cultural-content
 * notice is the second of two splashes that gate fresh-save MainMenu
 * activation: photosensitivity dismisses → cultural splash mounts →
 * dismissal flips `culturalContentSplashSeen: true` → MainMenu activates.
 *
 * Contract:
 *  1. Fresh save (settings absent / both flags false): photosensitivity
 *     dismisses, cultural splash blocks MainMenu until dismissed.
 *  2. Dismissal flips `culturalContentSplashSeen` to true and unblocks
 *     MainMenu.
 *  3. Reload: returning player goes straight to MainMenu.
 *
 * Phaser renders to canvas; observability is `game.scene.isActive('MainMenu')`.
 * The shared fixture seeds both flags as true; this spec clears them on
 * the first navigation and uses a sessionStorage marker so a `page.reload()`
 * preserves the production-persisted flag.
 */
test.describe('cultural-content splash (2026-05-10)', () => {
  test('fresh save: cultural splash blocks MainMenu until dismissed; flag persists through reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaSaveVersion) => {
      try {
        const metaRaw = localStorage.getItem('whs_meta_save');
        const meta = (metaRaw
          ? (JSON.parse(metaRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...meta,
          saveVersion: metaSaveVersion,
          hasCompletedTutorial: true,
        }));

        if (sessionStorage.getItem('__culturalTestFreshLoaded') === '1') {
          // Second navigation — keep production-persisted flag intact.
          return;
        }
        sessionStorage.setItem('__culturalTestFreshLoaded', '1');
        // Fresh-save posture: clear settings entirely so both splashes
        // mount in their natural order on this first navigation.
        localStorage.removeItem('whs_game_settings');
      } catch {
        /* ignore */
      }
    }, CURRENT_META_SAVE_VERSION);

    // Neutralize the phantom gamepad that headless Firefox exposes through
    // `navigator.getGamepads()`: it reports `connected: true` with spurious
    // `buttons[0]` presses that autonomously drive Phaser's gamepad input
    // (the splash dismiss `tickPad`, plus MainMenu/Settings navigation).
    //
    // On a fresh save the two first-launch splashes chain — dismissing the
    // photosensitivity warning SYNCHRONOUSLY mounts the cultural notice
    // (BootScene.maybeShowPhotosensitivityWarningThenStart). Each splash's
    // gamepad `tickPad` dismisses on a rising edge but starts `prevPadA`
    // false, so a phantom button held across two consecutive frames reads as
    // a fresh rising edge for the just-mounted cultural splash too. Both get
    // dismissed with no keyboard input — flipping `culturalContentSplashSeen`
    // true and racing the game to MainMenu before the test presses Escape,
    // which tripped the "cultural still blocked" assertion (firefox-only,
    // load-sensitive). Returning [] keeps Phaser's `pad1` undefined so only
    // the keyboard path — the behaviour under test — drives the splashes; no
    // cross-browser coverage is lost (real gamepad coverage lives in
    // gamepad.spec.ts).
    await page.addInitScript(() => {
      try {
        navigator.getGamepads = () => [];
      } catch {
        /* read-only in some engines — best-effort */
      }
    });

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Step 1 — dismiss the photosensitivity splash so the cultural
    // splash takes the stage. Both accept Escape; we wait briefly for
    // the photosensitivity splash to mount (after the boot dawn fades),
    // then press Escape twice — once to dismiss photo, then we re-poll
    // and dismiss cultural separately so timing assertions are precise.
    await page.waitForTimeout(4_000); // generous; boot dawn ~2.8s
    await page.keyboard.press('Escape');

    // Step 2 — confirm photosensitivity flag is set + cultural is NOT,
    // and MainMenu is still blocked (cultural splash now mounted).
    const interimState = await page.evaluate(async () => {
      const deadline = Date.now() + 4_000;
      while (Date.now() < deadline) {
        const raw = localStorage.getItem('whs_game_settings');
        if (raw) {
          try {
            const o = JSON.parse(raw) as Record<string, unknown>;
            if (o.photosensitivityWarningSeen === true) {
              return {
                photo: true,
                cultural: o.culturalContentSplashSeen === true,
              };
            }
          } catch { /* ignore */ }
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return { photo: false, cultural: false };
    });
    expect(interimState.photo, 'photosensitivityWarningSeen should be true after first Escape').toBe(true);
    expect(interimState.cultural, 'culturalContentSplashSeen should still be false (cultural splash mounted, awaiting dismissal)').toBe(false);

    const mainMenuBlocked = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      if (!g) return { ok: false, reason: 'no game object' };
      const deadline = Date.now() + 3_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MainMenu')) {
          return { ok: false, reason: 'MainMenu activated before cultural dismiss' };
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return { ok: true, reason: 'MainMenu still blocked while cultural splash up' };
    });
    expect(mainMenuBlocked.ok, `${mainMenuBlocked.reason}`).toBe(true);

    // Step 3 — dismiss cultural splash, MainMenu activates, flag persists.
    await page.keyboard.press('Escape');

    const mainMenuAfter = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      const deadline = Date.now() + 5_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MainMenu')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(mainMenuAfter, 'MainMenu should activate after cultural dismiss').toBe(true);

    const culturalFlagAfter = await page.evaluate(() => {
      const raw = localStorage.getItem('whs_game_settings');
      if (!raw) return null;
      try { return (JSON.parse(raw) as Record<string, unknown>).culturalContentSplashSeen; }
      catch { return null; }
    });
    expect(culturalFlagAfter).toBe(true);

    // Step 4 — reload, returning player goes straight to MainMenu.
    await page.reload();
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    const straightToMenu = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MainMenu')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(straightToMenu, 'Returning player must not see either splash again').toBe(true);

    expect(pageErrors).toEqual([]);
  });
});
