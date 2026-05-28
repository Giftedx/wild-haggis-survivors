import { expect, test } from './fixtures';

/**
 * T407 — DOM-visible focus layer accessibility smoke for GameOverScene.
 *
 * Boot the scene directly via the global game manager with a synthetic
 * `GameOverPayload`. Assert the contract:
 *   - layer is attached at `[data-whs-dom-focus-layer="whs-game-over-focus-layer"]`
 *   - container is `role="dialog"` (the post-run scrim is genuinely modal)
 *   - exposes the three primary post-run actions in order:
 *       gameover-play-again, gameover-gold-shop, gameover-tae-gran
 *   - every button carries a non-empty accessible name with no leaked
 *     `ui.gameOver` key
 *
 * Synthetic payload is the smallest shape the scene's `create()` will
 * accept — additional fields (deathCause, ironmoor, postBellSec, runSeed,
 * relicLabels, …) are deliberately omitted so the smoke proves the
 * mirror's own contract rather than the scene's optional render branches.
 */
test.describe('GameOverScene DOM focus mirror', () => {
  test('exposes the three post-run action buttons in a modal dialog', async ({ page }) => {
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
      // Smallest payload the scene will accept — omits the optional
      // chips/links so the synthetic boot stays focused on the DOM mirror
      // contract. Save stub is opaque to the scene; only goldEarned and
      // newlyUnlockedVariants are read off `runResult` directly.
      g.scene.start('GameOver', {
        mode: 'death',
        isVictory: false,
        summary: {
          timeSurvivedSec: 90,
          enemiesKilled: 50,
          bossGold: 0,
          coinGold: 0,
          bestCombo: 5,
        },
        runResult: {
          save: {},
          goldEarned: 36,
          newlyUnlockedVariants: [],
        },
        xpLevel: 5,
        bossKillCount: 0,
        ownedPassiveCount: 0,
        weaponCount: 1,
        evolvedCount: 0,
        buildSummary: '',
        variantLabel: 'Classic',
        variantKey: 'classic',
        weaponDamage: {},
      });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'GameOver scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-game-over-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const role = await layer.getAttribute('role');
    expect(role, 'GameOver overlay is genuinely modal — DOM mirror role must be dialog').toBe('dialog');

    // Accessible name should resolve through `t()` (death/victory title),
    // never leak the i18n key. Description carries the run digest.
    const ariaLabel = await layer.getAttribute('aria-label');
    expect((ariaLabel ?? '').length).toBeGreaterThan(0);
    expect((ariaLabel ?? '').startsWith('ui.gameOver'), 'aria-label leaks i18n key').toBe(false);

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    expect(count, 'DOM focus layer must expose all three post-run actions').toBe(3);

    const ids = await Promise.all(
      Array.from({ length: count }, (_, i) => buttons.nth(i).getAttribute('data-focus-id')),
    );
    expect(ids).toEqual([
      'gameover-play-again',
      'gameover-gold-shop',
      'gameover-tae-gran',
    ]);

    for (let i = 0; i < count; i++) {
      const label = (await buttons.nth(i).getAttribute('aria-label')) ?? '';
      expect(label.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(label.startsWith('ui.gameOver'), `button ${i} leaks i18n key`).toBe(false);
    }

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('marks locked shop access disabled in the DOM mirror', async ({ page }) => {
    await page.addInitScript(() => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        const existing = raw && raw.length > 0
          ? (JSON.parse(raw) as Record<string, unknown>)
          : {};
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
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
      g.scene.start('GameOver', {
        mode: 'death',
        isVictory: false,
        noShopAccess: true,
        summary: {
          timeSurvivedSec: 90,
          enemiesKilled: 50,
          bossGold: 0,
          coinGold: 0,
          bestCombo: 5,
        },
        runResult: {
          save: {},
          goldEarned: 36,
          newlyUnlockedVariants: [],
        },
        xpLevel: 5,
        bossKillCount: 0,
        ownedPassiveCount: 0,
        weaponCount: 1,
        evolvedCount: 0,
        buildSummary: '',
        variantLabel: 'Classic',
        variantKey: 'classic',
        weaponDamage: {},
      });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('GameOver')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'GameOver scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-game-over-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const shop = layer.locator('button[data-focus-id="gameover-gold-shop"]');
    await expect(shop).toBeAttached();
    await expect(shop).toHaveAttribute('aria-label', 'NAE SHOP');
    await expect(shop).toBeDisabled();
    await expect(shop).toHaveAttribute('tabindex', '-1');
  });
});
