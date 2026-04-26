/**
 * A1 PEAT prep — reproducible boots with Reduce Flashing OFF vs ON.
 * Human PEAT import still required; this spec proves settings load into
 * SettingsManager (`__WHS_COMFORT_PROBE`), not only localStorage round-trip.
 */
import { expect, test } from '@playwright/test';

test.describe('PEAT prep: reduceFlashing OFF/ON boot pair', () => {
  test.setTimeout(90_000);

  async function seedSettings(page: { addInitScript: (fn: (r: boolean) => void, r: boolean) => Promise<void> }, reduceFlashing: boolean) {
    await page.addInitScript((r) => {
      try {
        const raw = localStorage.getItem('whs_game_settings');
        const o = (raw ? JSON.parse(raw) : {}) as Record<string, unknown>;
        localStorage.setItem('whs_game_settings', JSON.stringify({
          ...o,
          settingsVersion: 1,
          photosensitivityWarningSeen: true,
          reduceFlashing: r,
        }));
      } catch { /* ignore */ }
    }, reduceFlashing);
  }

  for (const reduceFlashing of [false, true]) {
    test(`boots with reduceFlashing=${reduceFlashing}`, async ({ page }) => {
      await seedSettings(page, reduceFlashing);
      await page.goto('/');
      const canvas = page.locator('canvas[role="application"]');
      await expect(canvas).toBeVisible({ timeout: 60_000 });
      const rf = await page.evaluate(() => {
        try {
          const raw = localStorage.getItem('whs_game_settings');
          const o = raw ? JSON.parse(raw) as { reduceFlashing?: boolean } : {};
          return o.reduceFlashing === true;
        } catch {
          return false;
        }
      });
      expect(rf).toBe(reduceFlashing);
      const probed = await page.evaluate(() => {
        const fn = (window as unknown as { __WHS_COMFORT_PROBE?: () => { reduceFlashing: boolean } })
          .__WHS_COMFORT_PROBE;
        return fn?.() ?? { reduceFlashing: null as boolean | null };
      });
      expect(probed.reduceFlashing).toBe(reduceFlashing);
    });
  }
});
