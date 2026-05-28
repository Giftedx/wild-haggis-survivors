import { expect, test } from './fixtures';

/**
 * `?sporran=1` URL auto-route smoke. Boots to `/?sporran=1` and asserts
 * SporranScene becomes the active scene — proves the BootScene wiring
 * (predicate → dynamic import → scene.add → scene.start) end-to-end.
 * Sister to `e2e/sporran-deck.spec.ts` which boots SporranScene via
 * `scene.start('Sporran')` from window-injected JS; this spec exercises
 * the URL-routing surface specifically (DESIGN_IDEAS §1 Sporran Deck
 * v2 follow-up; W82 share-URL viral sister).
 */
type GameWin = {
  game?: {
    scene: {
      isActive(k: string): boolean;
      getScene(k: string): { drawnHand?: unknown[]; tileEntries?: unknown[] } | undefined;
    };
  };
};
const SAVE_VER = 9;

test.describe('?sporran=1 URL auto-route (DESIGN_IDEAS §1)', () => {
  test('boots to SporranScene, skipping menu', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((v) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: v, hasCompletedTutorial: true, hasSeenDriftTutorial: true,
        }));
      } catch { /* ignore */ }
    }, SAVE_VER);

    await page.goto('./?sporran=1');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    // Wait for Sporran to take over from Boot. Predicate boots fast but
    // the dynamic import + scene add takes a few hundred ms post-canvas.
    const sporranActive = await page.evaluate(async () => {
      const g = (window as unknown as GameWin).game;
      if (!g) return false;
      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Sporran')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sporranActive, 'Sporran scene failed to auto-activate from ?sporran=1').toBe(true);

    // Picker rendered the 7-card hand — proves create() ran, not just init.
    const hand = await page.evaluate(() => {
      const s = (window as unknown as GameWin).game!.scene.getScene('Sporran');
      return Array.isArray(s?.drawnHand) ? s!.drawnHand!.length : -1;
    });
    expect(hand, 'SporranScene.drawnHand should hold 7 cards').toBe(7);

    // URL hygiene — sporran param was scrubbed via history.replaceState,
    // so a refresh / back-nav lands on a clean URL (same contract as the
    // W82 shared-run path).
    const search = await page.evaluate(() => window.location.search);
    expect(search, '?sporran=1 should be scrubbed after auto-route').toBe('');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
