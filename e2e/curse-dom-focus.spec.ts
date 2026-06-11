import { expect, test } from './fixtures';

/**
 * T407 — DOM-visible focus layer accessibility smoke for CurseScene.
 *
 * Verifies the visually-hidden DOM layer (`createDomFocusLayer`) is in the
 * document, exposes one focusable button per Phaser tile (4 curses + clean
 * run + back), and that each button carries the curse name + gold-bonus
 * chip in its accessible label so screen readers describe the trade-off.
 *
 * This is a contract smoke for assistive-tech entry points, not a visual
 * test — the layer is intentionally invisible to sighted users.
 */
test.describe('CurseScene DOM focus mirror', () => {
  test('exposes one focusable DOM button per curse tile + clean run + back', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(() => {
      try {
        // Skip the FTUE so the menu route into Curse stays simple.
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

    // Boot the Curse scene directly via the global game manager so the
    // smoke does not depend on menu navigation discoverability.
    const sceneStarted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Curse');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Curse')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Curse scene failed to activate').toBe(true);

    // Wait for the DOM focus mirror to mount.
    const layer = page.locator('[data-whs-dom-focus-layer="whs-curse-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    // The mirror should expose at least 4 curses + 1 clean run + 1 back.
    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    expect(count, 'DOM focus layer must expose all 6 navigable actions').toBeGreaterThanOrEqual(6);

    // Every button must carry a non-empty aria-label (or text) — empty
    // labels would let unresolved keys leak to assistive tech.
    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('ui.curseScene'), `button ${i} leaks i18n key`).toBe(false);
    }

    // First curse button label must include the gold-bonus chip text so
    // screen-reader users hear the trade-off, not just the curse name.
    const firstLabel = await buttons.first().getAttribute('aria-label') ?? '';
    expect(firstLabel).toMatch(/\d+%/);

    // The trailing button is Back — should match data-focus-id.
    const lastFocusId = await buttons.nth(count - 1).getAttribute('data-focus-id');
    expect(lastFocusId).toBe('curse-back');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
