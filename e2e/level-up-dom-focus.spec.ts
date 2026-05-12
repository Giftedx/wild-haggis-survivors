import { expect, test } from './fixtures';

/**
 * T407 parity — DOM-visible focus layer for level-up (`UpgradeCardsUI`).
 *
 * Drives `GameScene.upgradeUI.show()` with three real weapon-card defs so
 * textures + i18n resolve as in production, then asserts the visually-hidden
 * mirror mounts with stable `data-focus-id` values.
 *
 * Scene-side T407 also mounts `GamepadMenuNav` + `bindHubMenuKeyboardNav`
 * in lockstep with the DOM layer — exercised indirectly via the same
 * `show()` path (no separate assertion here).
 *
 * Sister specs: `e2e/shop-dom-focus.spec.ts`, `e2e/meta-shop-dom-focus.spec.ts`.
 */

const THREE_CARDS = [
  {
    id: 'add_bagpipe_blast',
    name: 'upgradeCard.add_bagpipe_blast.name',
    description: 'upgradeCard.add_bagpipe_blast.description',
    rarity: 'uncommon',
    icon: 'wicon_bagpipe_blast',
    effect: { type: 'add_weapon', weaponKey: 'bagpipe_blast' },
  },
  {
    id: 'add_caber_toss',
    name: 'upgradeCard.add_caber_toss.name',
    description: 'upgradeCard.add_caber_toss.description',
    rarity: 'uncommon',
    icon: 'wicon_caber_toss',
    effect: { type: 'add_weapon', weaponKey: 'caber_toss' },
  },
  {
    id: 'add_scotch_mist',
    name: 'upgradeCard.add_scotch_mist.name',
    description: 'upgradeCard.add_scotch_mist.description',
    rarity: 'uncommon',
    icon: 'wicon_scotch_mist',
    effect: { type: 'add_weapon', weaponKey: 'scotch_mist' },
  },
];

test.describe('Level-up UpgradeCardsUI DOM focus mirror', () => {
  test('mounts whs-levelup-focus-layer with one button per card', async ({ page }) => {
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

    const gameReady = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 42_001 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(gameReady, 'Game scene failed to activate').toBe(true);

    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 15_000 });

    await page.evaluate((cards) => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const game = g?.scene.getScene('Game') as {
        upgradeUI?: { show(c: unknown[], level: number, o?: { hideReroll?: boolean }): void };
      } | undefined;
      game?.upgradeUI?.show(cards as never[], 2, { hideReroll: true });
    }, THREE_CARDS);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-levelup-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    await expect(buttons).toHaveCount(3);

    for (let i = 0; i < 3; i++) {
      const id = await buttons.nth(i).getAttribute('data-focus-id');
      expect(id).toBe(`levelup-card-${i}`);
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} empty label`).toBeGreaterThan(0);
      expect(effective.startsWith('upgradeCard.'), `button ${i} leaks i18n key`).toBe(false);
    }

    await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const game = g?.scene.getScene('Game') as { upgradeUI?: { hide(): void } } | undefined;
      game?.upgradeUI?.hide();
    });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
