import { expect, test } from './fixtures';

/**
 * T407 parity — DOM-visible focus layer for SporranScene (S1 Phase 1.5).
 *
 * Contract smoke: the visually-hidden mirror mounts, exposes one button
 * per dealt card (7) plus Confirm + Back, every control carries a
 * resolved accessible name (no bare i18n key leaks), native Tab can
 * traverse the mirror, and scene shutdown removes the hidden layer.
 *
 * Sister spec: `e2e/curse-dom-focus.spec.ts`.
 */

const SPORRAN_CARD_SLOTS = 7;

async function activeFocusId(page: { evaluate: <T>(fn: () => T) => Promise<T> }): Promise<string | null> {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    return active?.getAttribute('data-focus-id') ?? null;
  });
}

test.describe('SporranScene DOM focus mirror', () => {
  test('exposes tab-safe card, start, and back controls with cleanup on exit', async ({ page }) => {
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
    const expectedCount = SPORRAN_CARD_SLOTS + 2;
    expect(
      count,
      `DOM focus layer must expose ${SPORRAN_CARD_SLOTS} cards + confirm + back`,
    ).toBe(expectedCount);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('sporran.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('ui.'), `button ${i} leaks i18n key`).toBe(false);
      expect(effective.startsWith('curse.'), `button ${i} leaks i18n key`).toBe(false);
    }

    for (let i = 0; i < SPORRAN_CARD_SLOTS; i++) {
      const id = await buttons.nth(i).getAttribute('data-focus-id');
      expect(id).toBe(`sporran-card-${i}`);
    }

    const confirmId = await buttons.nth(SPORRAN_CARD_SLOTS).getAttribute('data-focus-id');
    expect(confirmId).toBe('sporran-confirm');

    const backId = await buttons.nth(SPORRAN_CARD_SLOTS + 1).getAttribute('data-focus-id');
    expect(backId).toBe('sporran-back');

    await buttons.nth(0).focus();
    expect(await activeFocusId(page)).toBe('sporran-card-0');
    for (let i = 1; i < SPORRAN_CARD_SLOTS; i++) {
      await page.keyboard.press('Tab');
      expect(await activeFocusId(page)).toBe(`sporran-card-${i}`);
    }
    await page.keyboard.press('Tab');
    expect(await activeFocusId(page)).toBe('sporran-back');

    for (let i = 0; i < 3; i++) {
      await buttons.nth(i).focus();
      await page.keyboard.press('Enter');
    }

    await expect(buttons.nth(SPORRAN_CARD_SLOTS)).toBeEnabled();
    for (let i = 3; i < SPORRAN_CARD_SLOTS; i++) {
      await expect(buttons.nth(i)).toBeDisabled();
    }

    await buttons.nth(2).focus();
    expect(await activeFocusId(page)).toBe('sporran-card-2');
    await page.keyboard.press('Tab');
    expect(await activeFocusId(page)).toBe('sporran-confirm');
    await page.keyboard.press('Tab');
    expect(await activeFocusId(page)).toBe('sporran-back');

    await buttons.nth(SPORRAN_CARD_SLOTS + 1).focus();
    await page.keyboard.press('Enter');
    await expect(layer).not.toBeAttached({ timeout: 5_000 });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
