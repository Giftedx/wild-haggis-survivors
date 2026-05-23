import { expect, test } from './fixtures';

/**
 * The Moor Remembers V2 — Cailleach Gauntlet E2E smoke.
 *
 * Spec: `docs/superpowers/specs/2026-05-22-moor-remembers-v2-design.md`
 * § 3.1 "e2e/moor-remembers-cailleach-gauntlet.spec.ts".
 *
 * Seeds 7 FallenCairns at world-centre (player spawn) so all 7 touch
 * on the first scheduler tick. Then uses DEBUG.skipToMinute to drive
 * the phase transitions without waiting real minutes of gameplay:
 *
 *   7 touches → armed
 *   skipToMinute(14) → candles_lit
 *   skipToMinute(15) → engaged (cailleach_boss on field)
 *   killCurrentBoss() → resolved / win
 *
 * The win path writes `wreathedAt` on the 7 cairns in meta-save.
 *
 * Chromium-only — FF/WK headless WebGL flakes per the moor-remembers V1
 * spec's observation; single-browser coverage is sufficient for the
 * wiring smoke.
 */

const META_SAVE_VERSION = 11;

test.describe('moor-remembers V2 — Cailleach Gauntlet', () => {
  test.skip(
    ({ browserName }) => browserName !== 'chromium',
    'cross-browser headless WebGL flakes; chromium covers the smoke',
  );

  test('7 cairn touches → arm → candles at 14:00 → boss at 15:00 → win wreathes cairns', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => { pageErrors.push(err.message); });

    // Seed 7 FallenCairns at world-centre (1500, 1500) — the player's
    // spawn position. Each has a distinct savedAt so the scheduler's
    // identity-based "touched at most once" check treats them as 7
    // separate hits. All are within CAIRN_TOUCH_RADIUS_PX (42 px) of
    // the spawn point, so all 7 arm the gauntlet on the first tick.
    const BASE_SAVED_AT = Date.now() - 7 * 86_400_000;
    await page.addInitScript((args: { ver: number; baseSavedAt: number }) => {
      try {
        const cairns = Array.from({ length: 7 }, (_, i) => ({
          x: 1500,
          y: 1500,
          cause: 'enemy_contact',
          variantKey: 'classic',
          timeSurvivedMs: 60_000,
          inheritedStat: 'damage',
          savedAt: args.baseSavedAt + i * 60_000,
        }));
        localStorage.setItem('whs_meta_save', JSON.stringify({
          saveVersion: args.ver,
          totalKills: 0,
          totalKillsSpent: 0,
          unlockedWeapons: [],
          unlockedUpgrades: [],
          activeRun: null,
          unlockedAchievements: [],
          hasCompletedTutorial: true,
          hasSeenDriftTutorial: true,
          hasSeenEliteAffixTip: true,
          hasSeenMoorMomentTip: true,
          hasSeenCeilidhChainTip: true,
          hasSeenStandingStonesTip: true,
          hasSeenAncestralEchoTip: true,
          moorMomentsLifetime: 0,
          runHistory: [],
          dailyChallenge: null,
          codexCulledKeys: [],
          fallenCairns: cairns,
          oldDroverRevealedCount: 0,
        }));
        // Start with a clean gameplay save so no residual state bleeds in.
        localStorage.removeItem('whs_save');
        (window as unknown as { AUTO_BATTLE: boolean }).AUTO_BATTLE = true;
      } catch { /* ignore */ }
    }, { ver: META_SAVE_VERSION, baseSavedAt: BASE_SAVED_AT });

    await page.goto('/');
    const canvas = page.locator('canvas[role="application"]');
    await expect(canvas).toBeVisible({ timeout: 60_000 });
    await canvas.click({ position: { x: 8, y: 8 } });
    await page.bringToFront();
    await canvas.focus();

    // Boot GameScene directly.
    const booted = await page.evaluate(async () => {
      const g = (window as unknown as { game?: {
        scene: { start(k: string, d?: unknown): void; isActive(k: string): boolean };
      } }).game;
      if (!g) return false;
      g.scene.start('Game', { seed: 77777 });
      const deadline = Date.now() + 30_000;
      while (Date.now() < deadline) {
        if (g.scene.isActive('Game')) return true;
        await new Promise((r) => setTimeout(r, 50));
      }
      return false;
    });
    expect(booted, 'GameScene must boot').toBe(true);

    // Phase 1: gauntlet arms when all 7 cairns are touched.
    // Player spawns at world-centre, all 7 cairns are there — armed
    // should fire on the first scheduler tick.
    type PhaseGS = {
      cailleachGauntletScheduler?: {
        getState?(): { phase: string; touchedSavedAts: readonly number[] };
      };
    };

    const armedPhase = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as PhaseGS | undefined;
      const state = gs?.cailleachGauntletScheduler?.getState?.();
      return state?.phase === 'armed' ? state : false;
    }, undefined, { timeout: 15_000 });

    const armedState = await armedPhase.jsonValue() as { phase: string; touchedSavedAts: readonly number[] };
    expect(armedState.phase).toBe('armed');
    expect(armedState.touchedSavedAts).toHaveLength(7);

    type PlayerGS = PhaseGS & {
      player?: { heal(n: number): void; getMaxHpBase(): number };
    };

    // Heal the player to full — enemies at 14+ min are strong enough to kill
    // a fresh save before we get a chance to interact with the gauntlet.
    const healPlayer = async () => {
      await page.evaluate(() => {
        const g = (window as unknown as { game?: {
          scene: { scenes: Array<{ scene: { key: string } }> };
        } }).game;
        const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as PlayerGS | undefined;
        gs?.player?.heal(99_999);
      });
    };

    // Phase 2: advance to 14:00 — candles light at GAUNTLET_CANDLE_TIME_MS.
    await healPlayer();
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToMinute(m: number): void } }).DEBUG;
      dbg?.skipToMinute(14);
    });
    await healPlayer();

    const candlesPhase = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as PhaseGS | undefined;
      const state = gs?.cailleachGauntletScheduler?.getState?.();
      return state?.phase === 'candles_lit' ? true : false;
    }, undefined, { timeout: 8_000 });

    expect(await candlesPhase.jsonValue()).toBe(true);

    // Phase 3: advance to 15:00 — Cailleach boss spawns.
    await healPlayer();
    await page.evaluate(() => {
      const dbg = (window as unknown as { DEBUG?: { skipToMinute(m: number): void } }).DEBUG;
      dbg?.skipToMinute(15);
    });
    await healPlayer();

    const engagedPhase = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as PhaseGS | undefined;
      const state = gs?.cailleachGauntletScheduler?.getState?.();
      return state?.phase === 'engaged' ? true : false;
    }, undefined, { timeout: 8_000 });

    expect(await engagedPhase.jsonValue()).toBe(true);

    // Phase 4: kill the Cailleach boss — win path.
    // Poll specifically for cailleach_boss (not any boss via findActiveBoss)
    // because skipToMinute(15) == RUN_WIN_TIME_SEC may also cause regular
    // bosses (gordon, tour_bus) that missed their scheduled windows to spawn.
    // The win-finale (taxman) is suppressed by timeTravelToSeconds when sec
    // >= RUN_WIN_TIME_SEC, but earlier missed bosses can still appear.
    // The boss materialises 1500ms after the warning (raw wall-clock delay
    // in SpawnSystem.spawnBoss).
    await healPlayer();
    await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): { getChildren(): Array<{ active: boolean; getEnemyKey?(): string }> };
        };
      } | undefined;
      return gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .some((e) => e.active && e.getEnemyKey?.() === 'cailleach_boss') ?? false;
    }, undefined, { timeout: 6_000 });
    await healPlayer();
    const bossKilled = await page.evaluate(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as {
        spawnSystem?: {
          getEnemyGroup?(): { getChildren(): Array<{ active: boolean; getEnemyKey?(): string; takeDamageWithKillEvents?(n: number): void }> };
        };
      } | undefined;
      const cailleach = gs?.spawnSystem?.getEnemyGroup?.().getChildren()
        .find((e) => e.active && e.getEnemyKey?.() === 'cailleach_boss');
      if (!cailleach) return false;
      cailleach.takeDamageWithKillEvents?.(999_999);
      return true;
    });
    expect(bossKilled, 'cailleach_boss must be found and killed').toBe(true);

    // Phase 5: wait for resolved/win outcome and wreathed cairns in meta-save.
    const resolvedPhase = await page.waitForFunction(() => {
      const g = (window as unknown as { game?: {
        scene: { scenes: Array<{ scene: { key: string } }> };
      } }).game;
      const gs = g?.scene.scenes.find((s) => s.scene.key === 'Game') as unknown as PhaseGS | undefined;
      const state = gs?.cailleachGauntletScheduler?.getState?.() as
        | { phase: string; outcome: string | null }
        | undefined;
      return state?.phase === 'resolved' && state?.outcome === 'win' ? true : false;
    }, undefined, { timeout: 8_000 });

    expect(await resolvedPhase.jsonValue(), 'Gauntlet must resolve to win').toBe(true);

    // Win path writes wreathedAt on the 7 cairns in whs_meta_save.
    const wreathedCount = await page.evaluate(() => {
      try {
        const raw = localStorage.getItem('whs_meta_save');
        if (!raw) return 0;
        const meta = JSON.parse(raw) as {
          fallenCairns?: Array<{ wreathedAt?: number }>;
        };
        return (meta.fallenCairns ?? []).filter((c) => typeof c.wreathedAt === 'number').length;
      } catch {
        return 0;
      }
    });

    expect(wreathedCount, 'all 7 gauntlet cairns must be wreathed in meta-save').toBe(7);
    expect(pageErrors, `Uncaught page errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });
});
