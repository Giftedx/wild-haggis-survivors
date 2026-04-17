import { expect, test } from './fixtures';

/**
 * Comfort panel E2E — exercises the accessibility profile end-to-end:
 * motionScale = 0, highContrastUi = on, captionsEnabled = on, banter = off,
 * reduceParticles = on. Verifies the Game scene boots, survives the first
 * boss encounter (gordon at 5:00) with zero page errors, and preserves the
 * Comfort settings across the boss window.
 *
 * Pattern mirrors w2-moor-road.spec.ts: seeds localStorage pre-load,
 * bypasses tutorial, flips AUTO_BATTLE to dodge level-up modal stalls,
 * drives DEBUG.skipToMinute + DEBUG.killCurrentBoss, and polls live
 * game state through the scene manager.
 */

const CURRENT_SAVE_VERSION = 9;

const COMFORT_PROFILE = {
  settingsVersion: 1,
  masterVolume: 1,
  sfxVolume: 1,
  musicVolume: 1,
  screenShake: false,
  damageNumbers: true,
  reduceParticles: true,
  uiScale: 1,
  highContrastUi: true,
  motionScale: 0,
  captionsEnabled: true,
  banterFrequency: 'off',
  telemetryOptIn: false,
  skipActIntermissions: true,
  ironmoorMode: false,
  localeKey: 'en',
} as const;

test.describe('Comfort panel smoke', () => {
  test('Comfort profile survives a boss encounter with no page errors', async ({ page }) => {
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
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch {
        /* ignore */
      }
    }, { ver: CURRENT_SAVE_VERSION, profile: COMFORT_PROFILE });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Jump into Game and wait for it to tick.
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
    expect(gameBooted, 'Game scene failed to activate under Comfort profile').toBe(true);

    await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      if (!g) return;
      const gs = g.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: { getGameTimeSec?(): number };
      };
      const start = Date.now();
      while (Date.now() - start < 20_000) {
        if ((gs.spawnSystem?.getGameTimeSec?.() ?? 0) > 2) return;
        await new Promise((r) => setTimeout(r, 100));
      }
    });

    // Skip to minute 6 so the 5:00 gordon warning + 1.5s spawn delay
    // have fully resolved under headless rAF before we start polling.
    const bossOutcome = await page.evaluate(async () => {
      const dbg = (window as unknown as { DEBUG?: {
        skipToMinute(m: number): void;
        killCurrentBoss(): boolean;
      } }).DEBUG;
      if (!dbg) return { killed: false, reason: 'no DEBUG hook' };
      dbg.skipToMinute(6);
      await new Promise((r) => setTimeout(r, 2500));

      const deadline = Date.now() + 20_000;
      while (Date.now() < deadline) {
        if (dbg.killCurrentBoss()) return { killed: true };
        await new Promise((r) => setTimeout(r, 100));
      }
      return { killed: false, reason: 'boss never spawned or died within 20s' };
    });
    expect(bossOutcome.killed, `gordon was not killed under Comfort profile: ${('reason' in bossOutcome) ? bossOutcome.reason : ''}`).toBe(true);

    // Settings must still reflect the Comfort profile — the run should
    // never silently reset motionScale/captions/banter.
    const settingsAfter = await page.evaluate(() => {
      try {
        return JSON.parse(localStorage.getItem('whs_game_settings') ?? '{}');
      } catch {
        return null;
      }
    });
    expect(settingsAfter).toMatchObject({
      motionScale: 0,
      highContrastUi: true,
      captionsEnabled: true,
      banterFrequency: 'off',
      reduceParticles: true,
    });

    expect(pageErrors, `Page errors during Comfort boss encounter:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
