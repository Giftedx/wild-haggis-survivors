import { expect, test } from './fixtures';

/**
 * T407 parity — DOM-visible focus layer for SporranScene (S1 Phase 1.5).
 *
 * Contract smoke: the visually-hidden mirror mounts, exposes one button
 * per dealt card (7) plus Confirm + Back, and every control carries a
 * resolved accessible name (no bare i18n key leaks).
 *
 * Sister spec: `e2e/curse-dom-focus.spec.ts`.
 */

const SPORRAN_CARD_SLOTS = 7;

test.describe('SporranScene DOM focus mirror', () => {
  test('exposes one focusable DOM button per card + confirm + back', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw && raw.length > 0
          ? (JSON.parse(raw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: 9,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
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

    const sceneStarted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Sporran');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Sporran')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Sporran scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-sporran-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    const expectedMin = SPORRAN_CARD_SLOTS + 2;
    expect(
      count,
      `DOM focus layer must expose ${SPORRAN_CARD_SLOTS} cards + confirm + back`,
    ).toBeGreaterThanOrEqual(expectedMin);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('sporran.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('ui.'), `button ${i} leaks i18n key`).toBe(false);
    }

    const confirmId = await buttons.nth(SPORRAN_CARD_SLOTS).getAttribute('data-focus-id');
    expect(confirmId).toBe('sporran-confirm');

    const backId = await buttons.nth(SPORRAN_CARD_SLOTS + 1).getAttribute('data-focus-id');
    expect(backId).toBe('sporran-back');

    const firstId = await buttons.first().getAttribute('data-focus-id');
    expect(firstId).toBe('sporran-card-0');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
