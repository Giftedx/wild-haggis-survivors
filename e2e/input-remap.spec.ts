import { expect, test } from './fixtures';
import { CURRENT_SAVE_VERSION as CURRENT_META_SAVE_VERSION } from '../src/core/SaveManager';

/**
 * A1 M3 T24 — key-remap end-to-end regression.
 *
 * Seeds a custom `keyBindings.dash` primary (KeyQ) into localStorage,
 * boots into Game, presses Q, and polls `Player.isDashing` to confirm
 * the rebind round-tripped through persistence → `SettingsManager` →
 * `InputMapper` → `InputManager.consumeDashPressed` → `Player.tryDash`.
 */

const REMAPPED_SETTINGS = {
  settingsVersion: 1,
  masterVolume: 1,
  sfxVolume: 1,
  musicVolume: 1,
  screenShake: false,
  damageNumbers: true,
  reduceParticles: false,
  uiScale: 1,
  highContrastUi: false,
  motionScale: 1,
  captionsEnabled: false,
  banterFrequency: 'off',
  telemetryOptIn: false,
  skipActIntermissions: true,
  ironmoorMode: false,
  photosensitivityWarningSeen: true,
  keyBindings: {
    moveUp: { primary: 'ArrowUp', secondary: 'KeyW' },
    moveDown: { primary: 'ArrowDown', secondary: 'KeyS' },
    moveLeft: { primary: 'ArrowLeft', secondary: 'KeyA' },
    moveRight: { primary: 'ArrowRight', secondary: 'KeyD' },
    dash: { primary: 'KeyQ' },
    pause: { primary: 'Escape', secondary: 'KeyP' },
  },
} as const;

test.describe('Key remapping E2E', () => {
  test('Dash rebound to Q fires tryDash when Q is pressed', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript(({ ver, profile }) => {
      try {
        localStorage.setItem('whs_game_settings', JSON.stringify(profile));
        const existingRaw = localStorage.getItem('whs_meta_save');
        const existing = (existingRaw
          ? (JSON.parse(existingRaw) as Record<string, unknown>)
          : {}) as Record<string, unknown>;
        localStorage.setItem('whs_meta_save', JSON.stringify({
          ...existing,
          saveVersion: ver,
          hasCompletedTutorial: true,
        }));
        // No AUTO_BATTLE — Player.update skips manual dash input when the
        // auto-battle steering is active; default is off in `e2e/fixtures.ts`.
      } catch {
        /* ignore */
      }
    }, { ver: CURRENT_META_SAVE_VERSION, profile: REMAPPED_SETTINGS });

    await page.goto('./');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    const gameBooted = await page.evaluate(async () => {
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
    expect(gameBooted, 'Game scene failed to activate').toBe(true);
    await page.waitForTimeout(600);

    // Sanity: bindings made it into SettingsManager.
    const persistedBinding = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('whs_game_settings') ?? '{}').keyBindings?.dash?.primary;
      } catch { return null; }
    });
    expect(persistedBinding).toBe('KeyQ');

    // Hold Q down so the next Player.update polls it.
    await page.keyboard.down('q');

    const result = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string }; input?: { keyboard?: { keys?: Array<{ keyCode?: number; isDown?: boolean } | undefined> } } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        player?: { isDashing?: boolean };
        input?: { keyboard?: { keys?: Array<{ keyCode?: number; isDown?: boolean } | undefined> } };
      };
      if (!gs?.player) return { dashed: false, phaserSawKey: null as unknown, reason: 'no player' };
      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        if (gs.player.isDashing) {
          const keys = gs.input?.keyboard?.keys ?? [];
          const q = keys[81];
          return { dashed: true, phaserSawKey: q?.isDown ?? null };
        }
        await new Promise((r) => setTimeout(r, 16));
      }
      const keys = gs.input?.keyboard?.keys ?? [];
      const q = keys[81];
      return {
        dashed: false,
        phaserSawKey: q?.isDown ?? null,
        reason: `isDashing never turned true within 3s; phaser keys[81]=${q ? `{ keyCode:${q.keyCode}, isDown:${q.isDown} }` : 'undefined'}`,
      };
    });
    await page.keyboard.up('q');

    expect(
      result.dashed,
      `Rebound dash did not fire on Q: ${('reason' in result) ? result.reason : ''}`,
    ).toBe(true);

    expect(pageErrors, `Page errors during remap test:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
