import { expect, test } from './fixtures';

/**
 * T407 parity — DOM-visible focus layer for MetaShopScene (Lasting Boons).
 *
 * Contract smoke: visually-hidden mirror mounts, exposes one button per
 * visible meta row (5 per page) plus pagination when multi-page, plus Back.
 * Labels must be resolved player copy (no `metaItem.` / `ui.` key leaks).
 *
 * Sister specs: `e2e/shop-dom-focus.spec.ts`, `e2e/curse-dom-focus.spec.ts`.
 */

const META_ROWS_PER_PAGE = 5;

test.describe('MetaShopScene DOM focus mirror', () => {
  test('exposes row buttons + page nav + back on multi-page meta catalogue', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(() => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: 9,
          totalKills: 5000,
          totalKillsSpent: 0,
          unlockedWeapons: [],
          unlockedUpgrades: [],
          unlockedAchievements: [
            'ach_survive_10m',
            'ach_survive_5m',
            'ach_kills_1000',
            'ach_defeat_taxman',
            'ach_first_victory',
          ],
          activeRun: null,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
          hasSeenEliteAffixTip: true,
          hasSeenMoorMomentTip: true,
          hasSeenCeilidhChainTip: true,
          hasSeenStandingStonesTip: true,
          hasSeenAncestralEchoTip: true,
          moorMomentsLifetime: 0,
          runHistory: [],
          dailyChallenge: null,
          codexCulledKeys: [],
        }));
      } catch {
        /* ignore */
      }
    });

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
      g.scene.start('MetaShop');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('MetaShop')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'MetaShop scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-meta-shop-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    const expectedMin = META_ROWS_PER_PAGE + 2 + 1;
    expect(
      count,
      `DOM focus layer must expose ${META_ROWS_PER_PAGE} rows + prev + next + back`,
    ).toBeGreaterThanOrEqual(expectedMin);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('metaItem.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('ui.'), `button ${i} leaks i18n key`).toBe(false);
    }

    const lastFocusId = await buttons.nth(count - 1).getAttribute('data-focus-id');
    expect(lastFocusId).toBe('meta-shop-back');

    const prevId = await buttons.nth(count - 3).getAttribute('data-focus-id');
    const nextId = await buttons.nth(count - 2).getAttribute('data-focus-id');
    expect(prevId).toBe('meta-shop-page-prev');
    expect(nextId).toBe('meta-shop-page-next');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
