import { expect, test } from './fixtures';

/**
 * T407 — DOM-visible focus layer accessibility smoke for SettingsScene.
 *
 * Mirrors the CurseScene smoke shape: boot the scene directly through
 * the global game manager, wait for the per-scene DOM mirror to mount,
 * then assert the contract:
 *   - layer is attached at `[data-whs-dom-focus-layer="whs-settings-focus-layer"]`
 *   - exposes one focusable button per gamepad row (sliders / toggles
 *     / cycles / launch rows — section headers are decorative and
 *     correctly absent)
 *   - every button carries a non-empty accessible name with no leaked
 *     i18n key (`ui.settings…`)
 *   - the slider rows fold their value text into the label so a screen
 *     reader announces both the row name and the current value
 *
 * Pure contract smoke for assistive-tech entry points; the layer is
 * intentionally invisible to sighted users so this is not a visual
 * test.
 */
test.describe('SettingsScene DOM focus mirror', () => {
  test('exposes one focusable DOM button per gamepad row with folded value text', async ({ page }) => {
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
      g.scene.start('Settings');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Settings')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Settings scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-settings-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    const count = await buttons.count();
    // Settings has > 10 rows even on the leanest config (volume sliders,
    // comfort toggles, locale cycle, launch rows). Lower bound covers
    // future header consolidation without locking a brittle exact count.
    expect(count, 'DOM focus layer must expose every Settings row').toBeGreaterThanOrEqual(10);

    for (let i = 0; i < count; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(effective.startsWith('ui.settings'), `button ${i} leaks i18n key`).toBe(false);
    }

    // At least one slider row must fold its value into the label using
    // the canonical "{label} — {value}" separator. Master volume always
    // ships as a slider row, so we assert the percentage shape exists
    // somewhere in the focusable set.
    const labels = await Promise.all(
      Array.from({ length: count }, (_, i) => buttons.nth(i).getAttribute('aria-label')),
    );
    const hasFoldedSlider = labels.some(
      (label) => typeof label === 'string' && /—\s*\d+%/.test(label),
    );
    expect(hasFoldedSlider, 'expected at least one slider row to fold its percentage value into the label').toBe(true);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });

  test('surfaces settings persistence failures while staying on the settings screen', async ({ page }) => {
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
      g.scene.start('Settings');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Settings')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'Settings scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-settings-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    await page.evaluate(() => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function patchedSetItem(key: string, value: string) {
        if (key === 'whs_game_settings') throw new Error('quota full');
        return original.call(this, key, value);
      };
    });

    await layer.locator('button[type="button"]').filter({ hasText: /^Screen shake/ }).dispatchEvent('click');

    const bannerText = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: { scene: { getScene(k: string): unknown } } }).game;
      const scene = g?.scene.getScene('Settings') as { children?: { list?: unknown[] } } | undefined;
      const texts = scene?.children?.list ?? [];
      for (const obj of texts) {
        const candidate = obj as { text?: unknown; visible?: boolean };
        if (candidate.visible === true && typeof candidate.text === 'string' && candidate.text.includes('saving failed')) {
          return candidate.text;
        }
      }
      return '';
    }, null, { timeout: 5_000 });

    expect(await bannerText.jsonValue()).toContain('settings');
    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
