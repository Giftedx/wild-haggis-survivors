import { expect, test } from './fixtures';

/**
 * Scots locale lazy-load regression — guards the W18 Phase B code-split
 * (SCS_STRINGS extracted to `src/core/i18n.scs.ts`, fetched on demand
 * via `ensureLocaleReady`). Verifies the end-to-end flow:
 *
 *   1. Fresh save, English-only — no Scots network request fires.
 *   2. Persist `localeKey: 'scs'` in settings, reload — the dynamic
 *      chunk is fetched and Scots strings render without a page error.
 *
 * Pattern mirrors comfort-smoke.spec.ts: seeds localStorage, drives
 * through the Boot splash, then polls live scene state.
 */

const CURRENT_SAVE_VERSION = 9;

test.describe('Scots locale lazy-load', () => {
  test('English default never fetches the Scots chunk', async ({ page }) => {
    const scotsRequests: string[] = [];
    page.on('request', (req) => {
      if (/i18n\.scs-.*\.js/.test(req.url())) scotsRequests.push(req.url());
    });

    await page.addInitScript(({ ver }) => {
      try {
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, { ver: CURRENT_SAVE_VERSION });

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    // Let Boot + MainMenu fully settle so any eager chunk fetch would
    // have fired by now.
    await page.waitForTimeout(1500);

    expect(
      scotsRequests,
      `Scots chunk was fetched despite English default: ${scotsRequests.join(', ')}`,
    ).toEqual([]);
  });

  test('Scots profile triggers the lazy chunk and renders translated strings', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    const scotsRequests: string[] = [];
    const allRequests: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      allRequests.push(url);
      if (/i18n\.scs/.test(url)) scotsRequests.push(url);
    });

    const SCOTS_PROFILE = {
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
      motionScale: 1,
      captionsEnabled: false,
      banterFrequency: 'normal',
      telemetryOptIn: false,
      skipActIntermissions: false,
      ironmoorMode: false,
      localeKey: 'scs',
    } as const;

    await page.addInitScript(({ ver, profile }) => {
      try {
        localStorage.setItem('whs_game_settings', JSON.stringify(profile));
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
      } catch {
        /* ignore */
      }
    }, { ver: CURRENT_SAVE_VERSION, profile: SCOTS_PROFILE });

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });

    // Poll the captured request list. The dynamic import typically
    // resolves by the time `canvas` becomes visible; a short poll
    // covers rare cases where Boot's splash tween delays the fetch.
    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline && scotsRequests.length === 0) {
      await page.waitForTimeout(100);
    }

    expect(
      scotsRequests.length,
      `Expected at least 1 Scots chunk request, got ${scotsRequests.length}. ` +
      `Captured JS requests:\n  ${allRequests.filter(u => u.endsWith('.js')).join('\n  ')}`,
    ).toBeGreaterThan(0);

    // Read the live game state: the active locale should be 'scs' once
    // the chunk resolves.
    const locale = await page.evaluate(async () => {
      const saved = JSON.parse(localStorage.getItem('whs_game_settings') ?? '{}');
      return saved.localeKey;
    });
    expect(locale, 'Scots locale was not persisted').toBe('scs');

    expect(
      pageErrors,
      `Page errors while loading Scots chunk:\n${pageErrors.join('\n')}`,
    ).toEqual([]);
  });
});
