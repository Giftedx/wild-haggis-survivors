import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * T407 parity — DOM-visible focus layer for ShopScene (permanent upgrades).
 *
 * Contract smoke: the visually-hidden mirror mounts, exposes one button per
 * visible upgrade row (8 per page) plus Prev, Next, and Back, and labels are
 * resolved copy (no bare `ui.` / `permanentUpgrade.` key leaks).
 *
 * Sister specs: `e2e/curse-dom-focus.spec.ts`, `e2e/sporran-dom-focus.spec.ts`.
 */

const UPGRADES_PER_PAGE = 8;

test.describe('ShopScene DOM focus mirror', () => {
  test('exposes one focusable DOM button per upgrade row + pagination + back', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaSaveVersion) => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw && raw.length > 0
          ? (JSON.parse(raw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: metaSaveVersion,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const sceneStarted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Shop', { returnTo: 'MainMenu' });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Shop')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Shop scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-shop-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    const expectedMin = UPGRADES_PER_PAGE + 3;
    expect(
      count,
      `DOM focus layer must expose ${UPGRADES_PER_PAGE} rows + prev + next + back`,
    ).toBeGreaterThanOrEqual(expectedMin);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('ui.shop.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('permanentUpgrade.'), `button ${i} leaks i18n key`).toBe(false);
    }

    const lastFocusId = await buttons.nth(count - 1).getAttribute('data-focus-id');
    expect(lastFocusId).toBe('shop-back');

    const prevId = await buttons.nth(count - 3).getAttribute('data-focus-id');
    const nextId = await buttons.nth(count - 2).getAttribute('data-focus-id');
    expect(prevId).toBe('shop-page-prev');
    expect(nextId).toBe('shop-page-next');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
