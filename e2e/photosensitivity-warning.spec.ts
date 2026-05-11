import { expect, test } from './fixtures';

/**
 * A1 M5 — photosensitivity warning splash e2e.
 *
 * Contract:
 *  1. Fresh save (no `whs_game_settings` in localStorage): the BootScene
 *     paints its dawn cinematic then shows the splash. MainMenu must NOT
 *     activate until the player dismisses.
 *  2. Dismissal (Escape key here — accepted alongside Enter/Space/click
 *     so someone hitting the universal "close" key isn't trapped) flips
 *     `photosensitivityWarningSeen` to true in localStorage and MainMenu
 *     activates.
 *  3. Reload after dismissal: MainMenu activates directly, no splash.
 *
 * Phaser renders into a canvas so there's no DOM text to scrape. The
 * splash-blocking-MainMenu fact is the observable signal: we poll
 * `game.scene.isActive('MainMenu')` and compare timings.
 *
 * Boot dawn painting takes roughly 2.8s before the splash mounts:
 *   400ms sky fade → 200ms overlap → 500ms mountains → 600ms dawn →
 *   400ms mascot → 800ms hold → 400ms final fade = ~2.8s.
 * We wait 7s on the fresh-load path, which is comfortably longer but
 * still should never see MainMenu if the splash is correctly blocking.
 */
test.describe('A1 M5 photosensitivity warning splash', () => {
  test('fresh save: splash blocks MainMenu until dismissed; flag persists through reload', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    // The shared `fixtures.ts` seeds `photosensitivityWarningSeen: true`
    // by default so existing specs aren't blocked by the splash. This
    // spec genuinely wants to observe a first-launch, so it runs a
    // later init script that clears the settings blob on the very
    // first navigation only. On `page.reload()` (second navigation in
    // this test), the marker in sessionStorage short-circuits the
    // removal so the production-persisted flag survives the reload.
    //
    // sessionStorage is scoped to the browsing session, persists
    // across reloads, and resets per Playwright context — perfect
    // first-navigation-only marker.
    //
    // Meta save still gets `hasCompletedTutorial: true` so the other
    // first-launch UX (tutorial) doesn't interfere; the splash is
    // independent of the tutorial.
    await page.addInitScript(() => {
      try {
        const metaRaw = localStorage.getItem('whs_meta_save');
        const meta = (metaRaw
          ? (JSON.parse(metaRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...meta,
          saveVersion: 9,
          hasCompletedTutorial: true,
        }));

        if (sessionStorage.getItem('__photoTestFreshLoaded') === '1') {
          // Second (or later) navigation — keep production-persisted
          // settings intact so we can verify the flag actually stuck.
          return;
        }
        sessionStorage.setItem('__photoTestFreshLoaded', '1');
        // Fresh-save posture, but with the *cultural* splash pre-acknowledged
        // so this spec isolates the photosensitivity gate only.
        localStorage.setItem('whs_game_settings', JSON.stringify({
          culturalContentSplashSeen: true,
        }));
      } catch {
        /* ignore */
      }
    });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Let the boot dawn cinematic complete and the warning splash mount.
    // Then confirm MainMenu has NOT activated yet.
    await page.waitForTimeout(4_000); // boot dawn ~2.8s

    const mainMenuBlocked = await page.evaluate(async () => {
      const deadline = Date.now() + 3_000;
      while (Date.now() < deadline) {
        const g = (window as unknown as { game?: {
          scene: { isActive(k: string): boolean };
        } }).game;
        // If the game object isn't published yet, keep waiting.
        if (g && g.scene.isActive('MainMenu')) {
          return { ok: false, reason: 'MainMenu activated before dismissal' };
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      return { ok: true, reason: 'MainMenu stayed blocked while splash should be up' };
    });
    expect(mainMenuBlocked.ok, `${mainMenuBlocked.reason}`).toBe(true);

    // Flag should still be unseen at this point. Absent settings file
    // (null raw), absent field (undefined), or persisted-false all count
    // as "not yet dismissed".
    const flagBeforeDismiss = await page.evaluate(() => {
      const raw = localStorage.getItem('whs_game_settings');
      if (!raw) return null;
      try { return (JSON.parse(raw) as Record<string, unknown>).photosensitivityWarningSeen; }
      catch { return null; }
    });
    expect(
      !flagBeforeDismiss,
      `Expected unseen-or-absent, got ${JSON.stringify(flagBeforeDismiss)}`,
    ).toBe(true);

    // Dismiss via Escape (splash handler accepts Enter/Space/Escape/
    // click; Escape is the most stable in Playwright — no focus
    // quirks with the canvas). The splash persists the flag before
    // firing scene.start, so by the time MainMenu is active, localStorage
    // already has photosensitivityWarningSeen: true.
    await page.keyboard.press('Escape');

    const mainMenuAfterDismiss = await page.evaluate(async () => {
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
    expect(mainMenuAfterDismiss, 'MainMenu should activate after dismiss').toBe(true);

    const flagAfterDismiss = await page.evaluate(() => {
      const raw = localStorage.getItem('whs_game_settings');
      if (!raw) return null;
      try { return (JSON.parse(raw) as Record<string, unknown>).photosensitivityWarningSeen; }
      catch { return null; }
    });
    expect(flagAfterDismiss).toBe(true);

    // Reload: the flag persisted, so no splash this time — MainMenu
    // should activate on its own as soon as the boot painting finishes.
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
    expect(straightToMenu, 'Returning player must not see splash again').toBe(true);

    expect(pageErrors).toEqual([]);
  });
});
