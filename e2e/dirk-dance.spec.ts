import { expect, test } from './fixtures';

/**
 * Dirk Dance (Highland Horrors B6) arc-sweep weapon wiring smoke.
 *
 * Unit tests cover the arc math + three-beat combo timing, but this smoke
 * checks the Phaser-bound glue: once `dirk_dance` is equipped in a live run
 * with real enemies present, does it ever fire (observable as its cooldown
 * being stamped from 0 → >0)?
 *
 * Sister of `e2e/shinty-stick.spec.ts` / `e2e/sgian-dubh.spec.ts` — same
 * shape; only the weapon key + cooldown differ. Dirk Dance base cooldown
 * is 950ms (see `src/data/weapons.ts`), so 3s of polling covers the first
 * fire comfortably even at heavy frame jitter.
 *
 * Chromium-only — FF/WK headless WebGL flakes per memory.
 */

const CURRENT_META_SAVE_VERSION = 9;

test.describe('dirk dance (Highland Horrors B6)', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('equipped dirk_dance stamps cooldown when enemies are present', async ({ page }) => {
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

    // Equip dirk_dance.
    const added = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { getScene(k: string): unknown };
      } }).game;
      const scene = g?.scene.getScene('Game') as {
        weaponSystem?: { addWeapon(k: string): boolean; getWeapons(): unknown[] };
      } | undefined;
      if (!scene?.weaponSystem) return false;
      scene.weaponSystem.addWeapon('dirk_dance');
      const ws = scene.weaponSystem.getWeapons() as Array<{ config?: { key?: string } }>;
      return ws.some((w) => w.config?.key === 'dirk_dance');
    });
    expect(added, 'dirk_dance must be in active weapons').toBe(true);

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

    // Poll for cooldown stamp — when dirk_dance fires, cooldownRemaining
    // flips to >0. Base cooldown is 950ms; 3s window covers it.
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
        const w = weapons.find((x) => x.config?.key === 'dirk_dance');
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
    expect(stamped, 'dirk_dance cooldown must stamp within 3s once enemies exist').toBeGreaterThan(0);

    expect(pageErrors, `Uncaught page errors: ${pageErrors.join('\n')}`).toEqual([]);
  });
});
