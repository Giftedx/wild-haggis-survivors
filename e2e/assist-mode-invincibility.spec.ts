import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/**
 * Assist Mode invincibility hidden-toggle smoke.
 *
 * Unit coverage proves PlayerHitResolver reads the hidden setting. This
 * production-preview smoke proves the direct-save setting has teeth in a
 * running GameScene while the Settings UI remains intentionally hidden.
 */

const CURRENT_META_SAVE_VERSION = 9;
const CURRENT_SETTINGS_VERSION = 1;

type AssistModeCase = {
  name: string;
  assistMode: boolean;
  assistModeInvincibility: boolean;
  expectDamage: boolean;
};

const CASES: AssistModeCase[] = [
  {
    name: 'master off: persisted invincibility sub-toggle does not block contact damage',
    assistMode: false,
    assistModeInvincibility: true,
    expectDamage: true,
  },
  {
    name: 'master on: invincibility blocks contact damage in a running scene',
    assistMode: true,
    assistModeInvincibility: true,
    expectDamage: false,
  },
];

async function bootGame(page: Page): Promise<void> {
  await page.goto('./');
  const canvas = page.locator('canvas[role="application"]');
  await expect(canvas).toBeVisible({ timeout: 60_000 });
  await canvas.click({ position: { x: 8, y: 8 } });
  await page.bringToFront();
  await canvas.focus();

  const booted = await page.evaluate(async () => {
    const g = (window as unknown as { game?: {
      scene: { start(k: string, d?: unknown): void; isActive(k: string): boolean };
    } }).game;
    if (!g) return false;
    g.scene.start('Game', { seed: 24680 });
    const deadline = Date.now() + 30_000;
    while (Date.now() < deadline) {
      if (g.scene.isActive('Game')) return true;
      await new Promise((r) => setTimeout(r, 50));
    }
    return false;
  });
  expect(booted, 'GameScene must boot').toBe(true);

  await page.waitForFunction(() => {
    const g = (window as unknown as { game?: {
      scene: { getScene(k: string): unknown };
    } }).game;
    const gs = g?.scene.getScene('Game') as {
      timeManager?: { isGameplayPaused(): boolean };
    } | undefined;
    return gs?.timeManager?.isGameplayPaused?.() === false;
  }, undefined, { timeout: 10_000 });
}

async function collideTouristWithPlayer(page: Page): Promise<{
  hpBefore: number;
  hpAfter: number;
  spawned: boolean;
}> {
  return page.evaluate(async () => {
    const g = (window as unknown as { game?: {
      scene: { getScene(k: string): unknown };
    } }).game;
    const gs = g?.scene.getScene('Game') as {
      player?: {
        x: number;
        y: number;
        getHp(): number;
        heal(n: number): void;
      };
      spawnSystem?: {
        forceSpawn(enemyKey: string): ({
          active: boolean;
          x: number;
          y: number;
          setPosition(x: number, y: number): unknown;
        } | null);
      };
    } | undefined;

    const player = gs?.player;
    const spawnSystem = gs?.spawnSystem;
    if (!player || !spawnSystem) return { hpBefore: -1, hpAfter: -1, spawned: false };

    player.heal(99_999);
    const hpBefore = player.getHp();
    const enemy = spawnSystem.forceSpawn('tourist');
    if (!enemy) return { hpBefore, hpAfter: player.getHp(), spawned: false };

    enemy.setPosition(player.x, player.y);

    const deadline = Date.now() + 2_000;
    while (Date.now() < deadline) {
      const hp = player.getHp();
      if (hp !== hpBefore) return { hpBefore, hpAfter: hp, spawned: true };
      await new Promise((r) => setTimeout(r, 16));
    }
    return { hpBefore, hpAfter: player.getHp(), spawned: true };
  });
}

test.describe('Assist Mode invincibility hidden toggle', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  for (const c of CASES) {
    test(c.name, async ({ page }) => {
      const pageErrors: string[] = [];
      page.on('pageerror', (err) => { pageErrors.push(err.message); });

      await page.addInitScript(({ saveVersion, settingsVersion, assistMode, assistModeInvincibility }) => {
        try {
          localStorage.setItem('whs_meta_save', JSON.stringify({
            saveVersion,
            hasCompletedTutorial: true,
          }));
          localStorage.setItem('whs_game_settings', JSON.stringify({
            settingsVersion,
            photosensitivityWarningSeen: true,
            culturalContentSplashSeen: true,
            assistMode,
            assistModeInvincibility,
          }));
          localStorage.removeItem('whs_save');
        } catch { /* ignore */ }
      }, {
        saveVersion: CURRENT_META_SAVE_VERSION,
        settingsVersion: CURRENT_SETTINGS_VERSION,
        assistMode: c.assistMode,
        assistModeInvincibility: c.assistModeInvincibility,
      });

      await bootGame(page);
      const result = await collideTouristWithPlayer(page);

      expect(result.spawned, 'forceSpawn("tourist") must produce a contact enemy').toBe(true);
      if (c.expectDamage) {
        expect(result.hpAfter, `contact should damage: ${JSON.stringify(result)}`).toBeLessThan(result.hpBefore);
      } else {
        expect(result.hpAfter, `Assist invincibility should preserve HP: ${JSON.stringify(result)}`).toBe(result.hpBefore);
      }
      expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
    });
  }
});
