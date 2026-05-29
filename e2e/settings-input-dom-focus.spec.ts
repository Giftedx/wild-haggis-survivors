import { expect, test } from './fixtures';

/**
 * T407 — DOM-visible focus layer accessibility smoke for the
 * SettingsInputScene keybind capture sub-scene (adoption #5).
 *
 * Boots the scene directly via the global game manager (mirrors the
 * other four T407 specs). Asserts:
 *   - layer is attached at `[data-whs-dom-focus-layer="whs-settings-input-focus-layer"]`
 *   - exposes one focusable button per rebind slot row plus terminal
 *     Reset + Back actions
 *   - every button carries a non-empty accessible name with no leaked
 *     `ui.inputRebind` i18n key
 *   - at least one slot row folds the action + slot + kind + binding
 *     into the canonical "Move up — primary keyboard — Up" shape
 *   - clicking a slot enters capture mode: the layer rebuilds with a
 *     single capture-prompt action and the prompt text appears
 *   - pressing ESC cancels the capture and restores the full row stack
 *
 * Pure contract smoke — the visually hidden mirror is invisible to
 * sighted users so this is not a visual test. Capture activation goes
 * through the DOM button click path which the layer exposes; the real
 * key-press resolver is covered by `applyKeyRebind` unit tests.
 *
 * Scene-side T407 also wires `GamepadMenuNav` + `bindHubMenuKeyboardNav`
 * in lockstep with the same action ordering (ghost focus rings + D-pad /
 * arrow navigation) — not asserted here; covered by the Phaser scene
 * wiring + `settingsInputDomFocusActions` unit tests.
 */
test.describe('SettingsInputScene DOM focus mirror', () => {
  test('exposes per-slot rows and reflects capture-mode entry/cancel', async ({ page }) => {
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
      g.scene.start('SettingsInput');
      const deadline = Date.now() + 15_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('SettingsInput')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(sceneStarted, 'SettingsInput scene failed to activate').toBe(true);

    const layer = page.locator('[data-whs-dom-focus-layer="whs-settings-input-focus-layer"]');
    await expect(layer).toBeAttached({ timeout: 5_000 });

    const buttons = layer.locator('button[type="button"]');
    // 10 ACTION_KEYS × 2 keyboard chips (primary + secondary, the secondary
    // chip renders even when unbound) = 20; dash + pause each add 2 gamepad
    // chips = 4; plus terminal Reset + Back = 2 → 26 total. Bump this when
    // ACTION_KEYS grows — the 2026-05 active-skill keys (stanceToggle /
    // shintyParry / whiskyBreath / driftMastery) added the most recent +8.
    await expect(buttons).toHaveCount(26);

    const ids = await Promise.all(
      Array.from({ length: 26 }, (_, i) => buttons.nth(i).getAttribute('data-focus-id')),
    );
    expect(ids[0]).toBe('settings-input-moveUp-primary-keyboard');
    expect(ids[ids.length - 2]).toBe('settings-input-reset');
    expect(ids[ids.length - 1]).toBe('settings-input-back');

    for (let i = 0; i < 26; i++) {
      const ariaLabel = await buttons.nth(i).getAttribute('aria-label');
      const text = await buttons.nth(i).textContent();
      const effective = (ariaLabel ?? text ?? '').trim();
      expect(effective.length, `button ${i} has empty accessible name`).toBeGreaterThan(0);
      expect(
        effective.startsWith('ui.inputRebind'),
        `button ${i} leaks i18n key`,
      ).toBe(false);
    }

    // Spot-check the canonical fold shape on the first slot row. The
    // default keybinding for moveUp/primary is ArrowUp, which
    // `formatKeyCode` renders as "Up".
    const firstLabel = (await buttons.first().getAttribute('aria-label')) ?? '';
    expect(firstLabel).toBe('Move up — primary keyboard — Up');

    const visibleHint = await page.evaluate(() => {
      const scene = (window as unknown as {
        game?: { scene: { getScene(k: string): unknown } };
      }).game?.scene.getScene('SettingsInput') as {
        children?: { list?: Array<{ text?: unknown }> };
      } | undefined;
      return scene?.children?.list
        ?.map((child) => (typeof child.text === 'string' ? child.text : ''))
        .find((text) => text.includes('Drift Mastery')) ?? '';
    });
    // ui.inputRebind.skill_hint points players at the active-skill rows + the
    // dash-strike gesture. Substrings below hold in both EN and Scots copy
    // (src/core/i18n/ui.ts + i18n.scs/ui.ts).
    expect(visibleHint).toContain('Stance');
    expect(visibleHint).toContain('parry');
    expect(visibleHint).toContain('Whisky Breath');
    expect(visibleHint).toContain('Drift Mastery');
    expect(visibleHint).toContain('dash-strikes');

    // Activate the first slot via DOM click — this should enter capture
    // mode and rebuild the layer with a single capture-prompt action.
    // The layer is visually hidden (clip-path inset, fixed 1×1 px) so
    // Playwright's pointer-route can't reach it through the canvas;
    // dispatch the click directly on the element to mirror an assistive
    // tech activation.
    await buttons.first().evaluate((el) => (el as HTMLButtonElement).click());

    // Wait for the layer to re-render with capture-mode actions. The
    // scene calls `scene.restart()` internally so the layer is destroyed
    // and re-created; expect the single-action shape after the rebuild.
    await expect(buttons).toHaveCount(1, { timeout: 5_000 });
    const captureId = await buttons.first().getAttribute('data-focus-id');
    expect(captureId).toBe('settings-input-capture');
    const captureLabel = (await buttons.first().getAttribute('aria-label')) ?? '';
    expect(captureLabel).toContain('Move up');
    expect(captureLabel.toLowerCase()).toContain('escape');

    // ESC cancels the capture — the scene's keyboard handler intercepts
    // it and restarts the scene, restoring the full row stack. Focus the
    // canvas first so Phaser's keyboard plugin receives the keydown.
    await canvas.focus();
    await page.keyboard.press('Escape');
    await expect(buttons).toHaveCount(26, { timeout: 5_000 });
    const restoredFirstLabel = (await buttons.first().getAttribute('aria-label')) ?? '';
    expect(restoredFirstLabel).toBe('Move up — primary keyboard — Up');

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
