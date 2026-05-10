import { expect, test } from './fixtures';

/**
 * S1 Phase 1 — Sporran Deck pre-run picker smoke. Boots SporranScene
 * directly (sister to almanac-navigation / curse-dom-focus), asserts 7
 * tiles, presses 1/2/3, then Enter. Card ids vary per run (Date.now
 * shuffle is intentionally cosmetic), so the spec asserts COUNT.
 */
const SAVE_VER = 9;
type GameWin = { game?: { scene: {
  start(k: string): void; isActive(k: string): boolean; getScene(k: string): unknown;
} } };

test.describe('sporran deck pre-run picker (DESIGN_IDEAS §1)', () => {
  test('renders 7 tiles and confirm routes to Game', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((v) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: v, hasCompletedTutorial: true, hasSeenDriftTutorial: true,
        }));
      } catch { /* ignore */ }
    }, SAVE_VER);

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const sporranActive = await page.evaluate(async () => {
      const g = (window as unknown as GameWin).game;
      if (!g) return false;
      g.scene.start('Sporran');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Sporran')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sporranActive, 'Sporran scene failed to activate').toBe(true);

    const tiles = await page.evaluate(() => {
      const s = (window as unknown as GameWin).game!.scene.getScene('Sporran') as {
        drawnHand?: unknown[]; tileEntries?: unknown[];
      };
      return {
        hand: Array.isArray(s.drawnHand) ? s.drawnHand.length : -1,
        tiles: Array.isArray(s.tileEntries) ? s.tileEntries.length : -1,
      };
    });
    expect(tiles.hand, 'drawnHand should hold 7 cards').toBe(7);
    expect(tiles.tiles, 'tileEntries should hold 7 picker tiles').toBe(7);

    // Digit 1/2/3 pick first three tiles; Enter at full picks routes to Game.
    // Hold each press across a Phaser frame — `press()` can fire keydown→
    // keyup inside one frame, missing the picker's edge debounce.
    const tap = async (k: string) => {
      await page.keyboard.down(k);
      await page.waitForTimeout(80);
      await page.keyboard.up(k);
      await page.waitForTimeout(60);
    };
    await tap('1');
    await tap('2');
    await tap('3');

    const picked = await page.evaluate(() => {
      const s = (window as unknown as GameWin).game!.scene.getScene('Sporran') as {
        pickedIndices?: Set<number>;
      };
      return s.pickedIndices instanceof Set ? s.pickedIndices.size : -1;
    });
    expect(picked, 'three digit presses should bank three picks').toBe(3);

    await tap('Enter');

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as GameWin).game!;
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate after confirm').toBe(true);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
