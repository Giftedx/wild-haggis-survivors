import { expect, test } from './fixtures';

/**
 * Sgian Dubh (DESIGN_IDEAS §5) arc-sweep weapon wiring smoke.
 *
 * Unit tests cover weapon math and helper logic, but this smoke checks the
 * Phaser-bound glue: once the weapon is equipped in a live run with real
 * enemies present, does it ever fire (observable as its cooldown being
 * stamped from 0 → >0)?
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('sgian dubh (DESIGN_IDEAS §5)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('equipped sgian_dubh stamps cooldown when enemies are present', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    await page.addInitScript((saveVersion) => {
      try {
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion,
          hasCompletedTutorial: true,
        }));
        localStorage.removeItem('whs_save');
      } catch { /* ignore */ }
    }, CURRENT_META_SAVE_VERSION);

    await page.goto('/');
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
      g.scene.start('Game', { seed: 12345 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    // Wait for COUNTDOWN to clear — WeaponSystem ticks in the gameplay loop.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        timeManager?: { isGameplayPaused(): boolean };
      } | undefined;
      return gs?.timeManager?.isGameplayPaused?.() === false;
    }, undefined, { timeout: 10_000 });

    // Equip sgian_dubh.
    const added = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        weaponSystem?: { addWeapon(k: string): boolean; getWeapons(): unknown[] };
      } | undefined;
      if (!scene?.weaponSystem) return false;
      scene.weaponSystem.addWeapon('sgian_dubh');
      const ws = scene.weaponSystem.getWeapons() as Array<{ config?: { key?: string } }>;
      return ws.some((w) => w.config?.key === 'sgian_dubh');
    });
    expect(added, 'sgian_dubh must be in active weapons').toBe(true);

    // Ensure the run has enemies — fast-forward a little into the timeline.
    await page.evaluate(() => {
      (window as unknown as { DEBUG?: { skipToGameSecond?(s: number): void } })
        .DEBUG?.skipToGameSecond?.(30);
    });

    // Wait for at least one active enemy to exist.
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const gs = g?.scene.getScene('Game') as {
        spawnSystem?: { getEnemyGroup?(): { getChildren(): Array<{ active: boolean }> } };
      } | undefined;
      const kids = gs?.spawnSystem?.getEnemyGroup?.().getChildren?.() ?? [];
      return kids.some((k) => k.active === true);
    }, undefined, { timeout: 10_000 });

    // Poll for cooldown stamp — when sgian fires, cooldownRemaining flips to >0.
    const stamped = await page.evaluate(async () => {
      const readCooldown = (): number => {
        const g = (window as unknown as { game?: {
          scene: { getScene(k: string): unknown };
        } }).game;
        const scene = g?.scene.getScene('Game') as {
          weaponSystem?: { getWeapons(): unknown[] };
        } | undefined;
        const weapons = (scene?.weaponSystem?.getWeapons?.() ?? []) as Array<{
          config?: { key?: string };
          cooldownRemaining?: number;
        }>;
        const w = weapons.find((x) => x.config?.key === 'sgian_dubh');
        return w?.cooldownRemaining ?? 0;
      };

      const deadline = Date.now() + 3000;
      while (Date.now() < deadline) {
        const cd = readCooldown();
        if (cd > 0) return cd;
        await new Promise((r) => setTimeout(r, 16));
      }
      return 0;
    });
    expect(stamped, 'sgian_dubh cooldown must stamp within 3s once enemies exist').toBeGreaterThan(0);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});

