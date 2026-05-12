import { expect, test } from './fixtures';

/**
 * T407 parity — DOM-visible focus mirror for AlmanacScene (Highland Almanac).
 *
 * Contract smoke: visually-hidden layer mounts with four tab buttons, one
 * book-panel proxy, and Back. Labels are resolved copy (no bare `ui.` /
 * `achievement.` key leaks).
 *
 * Sister specs: `e2e/deeds-dom-focus.spec.ts`, `e2e/chronicle-dom-focus.spec.ts`.
 */

const ALMANAC_DOM_BUTTON_COUNT = 6;

test.describe('AlmanacScene DOM focus mirror', () => {
  test('exposes four tab buttons + book panel + back with stable focus ids', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver: number) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: ver,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
        }));
        const existingGameplayRaw = localStorage.getItem('whs_save');
        const existingGameplay = existingGameplayRaw
          ? (JSON.parse(existingGameplayRaw) as Record<string, unknown>)
          : null;
        localStorage.setItem('whs_save', JSON.stringify({
          ...(existingGameplay ?? {}),
          schemaVersion: 8,
          discoveryLog: {
            beastiesSeen: {
              tourist: {
                firstSeenAt: { runId: 'run:test', timestamp: 1000 },
                seenCount: 1,
                killCount: 1,
              },
            },
            routesVisited: {},
            findsAcquired: {},
            banterHeard: {},
            almanacVisits: 0,
          },
        }));
      } catch {
        /* ignore */
      }
    }, 9);

    await page.goto('/');
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
      g.scene.start('Almanac', { returnTo: 'MainMenu' });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Almanac')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Almanac scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-almanac-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    expect(
      count,
      `DOM focus layer must expose ${ALMANAC_DOM_BUTTON_COUNT} controls (4 tabs + book + back)`,
    ).toBe(ALMANAC_DOM_BUTTON_COUNT);

    const expectedIds = [
      'almanac-tab-beasties',
      'almanac-tab-weys',
      'almanac-tab-finds',
      'almanac-tab-banter',
      'almanac-book-panel',
      'almanac-back',
    ];
    for (let i = 0; i < count; i++) {
      const focusId = await buttons.nth(i).getAttribute('data-focus-id');
      expect(focusId, `button ${i} missing data-focus-id`).toBe(expectedIds[i]);

      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('achievement.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('ui.'), `button ${i} leaks i18n key`).toBe(false);
    }

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
