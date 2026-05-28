import { expect, test } from './fixtures';

/**
 * T407 — DOM-visible focus mirror for NodePromptUI (Moor Road shrine /
 * trader / bargain prompts).
 *
 * Opens a synthetic prompt via GameScene.nodePromptUI.show (same pattern as
 * ui-audit-extra) and asserts the hidden layer mounts with stable
 * data-focus-id values, four rows (three options + Leave), resolved copy,
 * and a disabled option that remains in the DOM with disabled state.
 */

const CURRENT_SAVE_VERSION = 9;
const TIME_TOKEN = 'NODE_PROMPT_DOM_E2E';

test.describe('NodePromptUI DOM focus mirror', () => {
  test('mounts whs-node-prompt-focus-layer with option + Leave buttons', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((ver) => {
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
    }, CURRENT_SAVE_VERSION);

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const gameActive = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game');
      const start = Date.now();
      while (Date.now() - start < 30_000) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 100));
      }
      return false;
    });
    expect(gameActive, 'Game scene failed to activate').toBe(true);

    await page.waitForTimeout(600);

    await page.evaluate(({ token }) => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { request?: (key: string, opts: unknown) => void; release?: (key: string) => void };
        nodePromptUI?: { show?: (opts: unknown) => void };
      } | undefined;
      if (!gs?.nodePromptUI?.show) throw new Error('nodePromptUI missing');
      gs.timeManager?.request?.(token, { pausePhysics: true, timeScale: 0 });
      gs.nodePromptUI.show({
        title: 'DOM focus smoke',
        body: 'Pick an option or leave.',
        options: [
          { key: 'heal', label: 'Take the oatcake blessing', subLabel: '+2 hearts' },
          { key: 'buy', label: 'Buy a relic', subLabel: '120 gold' },
          { key: 'disabled', label: 'Locked choice', subLabel: 'Needs 4 HP', disabled: true },
        ],
        allowSkip: true,
        onResolve: () => {
          gs.timeManager?.release?.(token);
        },
      });
    }, { token: TIME_TOKEN });

    const layer = page.locator('[data-whs-dom-focus-layer="whs-node-prompt-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    await expect(buttons).toHaveCount(4);

    const expectedIds = [
      'node-prompt-heal',
      'node-prompt-buy',
      'node-prompt-disabled',
      'node-prompt-leave',
    ];
    for (let i = 0; i < 4; i++) {
      expect(await buttons.nth(i).getAttribute('data-focus-id')).toBe(expectedIds[i]);
    }

    expect(await buttons.nth(2).isDisabled()).toBe(true);

    for (let i = 0; i < 4; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('nodes.'), `button ${i} leaks nodes.* key`).toBe(false);
    }

    await page.evaluate(({ token }) => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        nodePromptUI?: { close?: () => void };
        timeManager?: { release?: (key: string) => void };
      } | undefined;
      gs?.nodePromptUI?.close?.();
      gs?.timeManager?.release?.(token);
    }, { token: TIME_TOKEN });

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
