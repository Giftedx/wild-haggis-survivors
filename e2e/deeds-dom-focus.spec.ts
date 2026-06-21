import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * T407 parity — DOM-visible focus mirror for DeedsScene (achievements).
 *
 * Contract smoke: visually-hidden layer mounts with one button per visible
 * deed card on the first page (12 on desktop), plus Prev/Next when the
 * catalogue spans multiple pages, plus Back. Labels are resolved copy (no
 * bare `achievement.` / `ui.` key leaks).
 *
 * Sister specs: `e2e/meta-shop-dom-focus.spec.ts`, `e2e/chronicle-dom-focus.spec.ts`.
 */

const DEEDS_CARDS_PER_PAGE_DESKTOP = 12;

test.describe('DeedsScene DOM focus mirror', () => {
  test('exposes deed card buttons + page nav + back on multi-page desktop grid', async ({ page }) => {
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
      g.scene.start('Deeds', { returnTo: 'MainMenu' });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Deeds')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Deeds scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-deeds-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    const expectedMin = DEEDS_CARDS_PER_PAGE_DESKTOP + 2 + 1;
    expect(
      count,
      `DOM focus layer must expose ${DEEDS_CARDS_PER_PAGE_DESKTOP} cards + prev + next + back`,
    ).toBeGreaterThanOrEqual(expectedMin);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('achievement.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('ui.deeds.status_'), `button ${i} leaks raw status key`).toBe(false);
      expect(effective.startsWith('ui.'), `button ${i} leaks i18n key`).toBe(false);
    }

    const lastFocusId = await buttons.nth(count - 1).getAttribute('data-focus-id');
    expect(lastFocusId).toBe('deeds-back');

    const prevId = await buttons.nth(count - 3).getAttribute('data-focus-id');
    const nextId = await buttons.nth(count - 2).getAttribute('data-focus-id');
    expect(prevId).toBe('deeds-page-prev');
    expect(nextId).toBe('deeds-page-next');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
