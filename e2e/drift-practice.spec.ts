import { expect, test } from './fixtures';

const CURRENT_META_SAVE_VERSION = 9;

test.describe('post-FTUE drift practice', () => {
  test('shows the marker on the first eligible run and persists skip', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion,
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: false,
        }));
        localStorage.removeItem('whs_save');
      } catch {
        /* ignore */
      }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: {
          start(k: string, data?: unknown): void;
          isActive(k: string): boolean;
        };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        children?: { list?: Array<{ name?: string }> };
      } | undefined;
      const names = scene?.children?.list?.map((o) => o.name) ?? [];
      return names.includes('drift-practice-banner')
        && names.includes('drift-practice-marker');
    }, undefined, { timeout: 12_000 });

    await page.keyboard.press('Enter');

    await page.waitForFunction(() => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        if (!raw) return false;
        return JSON.parse(raw).hasSeenDriftTutorial === true;
      } catch {
        return false;
      }
    }, undefined, { timeout: 5_000 });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
