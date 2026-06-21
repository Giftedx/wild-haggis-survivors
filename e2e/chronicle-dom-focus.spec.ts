import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * T407 parity — DOM-visible focus mirror for ChronicleScene (Herd Chronicle).
 *
 * Contract smoke: visually-hidden layer mounts with Almanac link + one
 * button per visible run row + pagination when multi-page + Back. Labels
 * are resolved copy (no bare `ui.` key leaks).
 *
 * Sister specs: `e2e/meta-shop-dom-focus.spec.ts`, `e2e/shop-dom-focus.spec.ts`.
 */

const CHRONICLE_ROWS_PER_PAGE = 4;

test.describe('ChronicleScene DOM focus mirror', () => {
  test('exposes almanac + run rows + page nav + back when history spans multiple pages', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((metaSaveVersion) => {
      try {
        // Literal 5 — `addInitScript` bodies run in the browser without the
        // spec file's module scope (CHRONICLE_ROWS_PER_PAGE would be undefined).
        const runHistory = [];
        for (let i = 0; i < 5; i++) {
          runHistory.push({
            timestamp: 1_700_000_000_000 + i * 60_000,
            timeSurvivedSec: 120 + i,
            enemiesKilled: 40 + i,
            level: 5,
            bossKills: 0,
            goldEarned: 12,
            bestCombo: 4,
            variantKey: 'classic',
            isVictory: i % 2 === 0,
            weaponKeys: ['thistle_shot'],
            runSeed: 9_000_000 + i,
          });
        }
        // v3-shaped payload — exercises the full migration chain the way
        // Vitest fixtures do, so Chronicle's `loadSave()` round-trips into
        // a populated `runHistory` (a bare v23 partial merge was getting
        // replaced by boot defaults in CI).
        localStorage.removeItem('whs_save');
        localStorage.setItem('whs_save', JSON.stringify({
          schemaVersion: 3,
          gold: 0,
          upgrades: {},
          unlockedVariants: ['classic'],
          selectedVariant: 'classic',
          totalRuns: 5,
          bestTime: 300,
          bestKills: 50,
          totalKills: 250,
          totalGoldEarned: 0,
          bestCombo: 5,
          victories: 2,
          bestEndlessSeconds: 0,
          runHistory,
          settings: { soundOn: true, musicOn: true },
        }));
        const metaRaw = localStorage.getItem('whs_meta_save');
        const meta = metaRaw && metaRaw.length > 0
          ? (JSON.parse(metaRaw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...meta,
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
      g.scene.start('Chronicle', { returnTo: 'MainMenu' });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Chronicle')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Chronicle scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-chronicle-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    const expectedMin = CHRONICLE_ROWS_PER_PAGE + 2 + 1 + 1;
    expect(
      count,
      `DOM focus layer must expose almanac + ${CHRONICLE_ROWS_PER_PAGE} rows + prev + next + back`,
    ).toBeGreaterThanOrEqual(expectedMin);

    const firstId = await buttons.nth(0).getAttribute('data-focus-id');
    expect(firstId).toBe('chronicle-almanac');

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('ui.'), `button ${i} leaks i18n key`).toBe(false);
    }

    const lastFocusId = await buttons.nth(count - 1).getAttribute('data-focus-id');
    expect(lastFocusId).toBe('chronicle-back');

    const prevId = await buttons.nth(count - 3).getAttribute('data-focus-id');
    const nextId = await buttons.nth(count - 2).getAttribute('data-focus-id');
    expect(prevId).toBe('chronicle-page-prev');
    expect(nextId).toBe('chronicle-page-next');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('empty run history still mounts almanac + back', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(() => {
      try {
        localStorage.removeItem('whs_save');
        localStorage.setItem('whs_save', JSON.stringify({
          schemaVersion: 3,
          gold: 0,
          upgrades: {},
          unlockedVariants: ['classic'],
          selectedVariant: 'classic',
          totalRuns: 0,
          bestTime: 0,
          bestKills: 0,
          totalKills: 0,
          totalGoldEarned: 0,
          bestCombo: 0,
          victories: 0,
          bestEndlessSeconds: 0,
          runHistory: [],
          settings: { soundOn: true, musicOn: true },
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
      g.scene.start('Chronicle', { returnTo: 'MainMenu' });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Chronicle')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Chronicle scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-chronicle-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    expect(count).toBe(2);
    expect(await buttons.nth(0).getAttribute('data-focus-id')).toBe('chronicle-almanac');
    expect(await buttons.nth(1).getAttribute('data-focus-id')).toBe('chronicle-back');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
