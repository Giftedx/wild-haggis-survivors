import { describe, expect, it, vi } from 'vitest';
import { RunHistoryRecorder, type RunHistoryHooks } from './RunHistoryRecorder';
import { currentDailyDateKey } from '../../utils/rng';

function buildMocks(overrides: {
  variantKey?: string;
  curseKey?: string;
  bossKills?: number;
  level?: number;
  weaponKeys?: string[];
  isDaily?: boolean;
  runSeed?: number;
  dailyChallenge?: unknown;
  routes?: import('../../data/routes').RoutePick[];
  ironmoor?: boolean;
} = {}) {
  const saveManager = {
    recordRunToHistory: vi.fn(),
    update: vi.fn((fn: (cur: { dailyChallenge?: unknown }) => unknown) =>
      fn({ dailyChallenge: overrides.dailyChallenge }),
    ),
  };

  const hooks: RunHistoryHooks = {
    getSaveManager: () => saveManager as never,
    getXPSystem: () =>
      ({
        getLevel: () => overrides.level ?? 7,
      }) as never,
    getWeaponSystem: () =>
      ({
        getWeapons: () =>
          (overrides.weaponKeys ?? ['thistle_shot', 'claymore']).map((k) => ({ config: { key: k } })),
      }) as never,
    getActiveVariant: () => ({ key: overrides.variantKey ?? 'classic' }) as never,
    getActiveCurseKey: () => (overrides.curseKey ?? null) as never,
    getBossKillCount: () => overrides.bossKills ?? 3,
    getRunRng: () => ({ seed: overrides.runSeed ?? 42 }) as never,
    isDailyRun: () => overrides.isDaily ?? false,
    getRoutePicks: () => overrides.routes ?? [],
    isIronmoor: () => overrides.ironmoor ?? false,
    now: () => 1700000000000,
  };

  return { hooks, saveManager };
}

describe('RunHistoryRecorder', () => {
  describe('buildContext', () => {
    it('includes level, boss kills, variant, weapon keys, runSeed, healing-circle flag, and biomesVisited', () => {
      const { hooks } = buildMocks();
      const ctx = new RunHistoryRecorder(hooks).buildContext();
      expect(ctx).toEqual({
        runSeed: 42,
        level: 7,
        bossKills: 3,
        variantKey: 'classic',
        weaponKeys: ['thistle_shot', 'claymore'],
        // V2 T1 — default true (hook absent = "assume player used healing").
        enteredHealingCircle: true,
        // V2 T2 — default empty (hook absent = "no biomes recorded").
        biomesVisited: [],
      });
    });

    it('V2 T1 — propagates enteredHealingCircle=false when hook returns false (Doric no-heal path)', () => {
      const { hooks } = buildMocks();
      const withHook = { ...hooks, getEnteredHealingCircle: () => false };
      const ctx = new RunHistoryRecorder(withHook).buildContext();
      expect(ctx.enteredHealingCircle).toBe(false);
    });

    it('V2 T1 — propagates enteredHealingCircle=true when hook returns true', () => {
      const { hooks } = buildMocks();
      const withHook = { ...hooks, getEnteredHealingCircle: () => true };
      const ctx = new RunHistoryRecorder(withHook).buildContext();
      expect(ctx.enteredHealingCircle).toBe(true);
    });

    it('V2 T2 — biomesVisited empty when hook is absent', () => {
      const { hooks } = buildMocks();
      const ctx = new RunHistoryRecorder(hooks).buildContext();
      expect(ctx.biomesVisited).toEqual([]);
    });

    it('V2 T2 — biomesVisited snapshot matches hook output', () => {
      const { hooks } = buildMocks();
      const biomes = ['loch', 'pine'];
      const withHook = { ...hooks, getBiomesVisited: () => biomes };
      const ctx = new RunHistoryRecorder(withHook).buildContext();
      expect(ctx.biomesVisited).toEqual(['loch', 'pine']);
      // Snapshot — mutating the source must not poison the context.
      expect(ctx.biomesVisited).not.toBe(biomes);
    });

    it('includes curseKey only when present', () => {
      const { hooks } = buildMocks({ curseKey: 'thin_hide' });
      const ctx = new RunHistoryRecorder(hooks).buildContext();
      expect(ctx.curseKey).toBe('thin_hide');
    });

    it('omits curseKey key when null (not just undefined)', () => {
      const { hooks } = buildMocks();
      const ctx = new RunHistoryRecorder(hooks).buildContext();
      expect('curseKey' in ctx).toBe(false);
    });

    it('includes routes when pickerHistory has entries', () => {
      const routes: import('../../data/routes').RoutePick[] = [
        { slot: 'A', routeKey: 'up_the_brae', atGameTimeSec: 305, defaultedBySetting: false },
        { slot: 'B', routeKey: 'buckie_pitstop', atGameTimeSec: 610, defaultedBySetting: false },
      ];
      const { hooks } = buildMocks({ routes });
      const ctx = new RunHistoryRecorder(hooks).buildContext();
      expect(ctx.routes).toEqual(routes);
      // Snapshot — mutating the source must not poison the context.
      expect(ctx.routes).not.toBe(routes);
    });

    it('omits routes when pickerHistory is empty', () => {
      const { hooks } = buildMocks();
      const ctx = new RunHistoryRecorder(hooks).buildContext();
      expect('routes' in ctx).toBe(false);
    });

    it('includes replay blob when getReplayBlob hook returns one', () => {
      const { hooks } = buildMocks();
      const replay = {
        version: 1 as const,
        build: 'test',
        seed: 42,
        variantKey: 'classic',
        frameCount: 0,
        frames: [],
      };
      const withReplay = { ...hooks, getReplayBlob: () => replay };
      const ctx = new RunHistoryRecorder(withReplay).buildContext();
      expect(ctx.replay).toBe(replay);
    });

    it('omits replay when getReplayBlob hook absent or returns null', () => {
      const { hooks } = buildMocks();
      const noHook = new RunHistoryRecorder(hooks).buildContext();
      expect('replay' in noHook).toBe(false);

      const withNullHook = new RunHistoryRecorder({
        ...hooks,
        getReplayBlob: () => null,
      }).buildContext();
      expect('replay' in withNullHook).toBe(false);
    });
  });

  describe('record', () => {
    const baseSummary = {
      timeSurvivedSec: 900,
      enemiesKilled: 450,
      bestCombo: 55,
      victory: false,
    };

    it('writes a run history entry with all captured fields', () => {
      const { hooks, saveManager } = buildMocks();
      const r = new RunHistoryRecorder(hooks);
      r.record(baseSummary as never, { goldEarned: 120 } as never);
      expect(saveManager.recordRunToHistory).toHaveBeenCalledWith({
        timestamp: 1700000000000,
        timeSurvivedSec: 900,
        enemiesKilled: 450,
        level: 7,
        bossKills: 3,
        goldEarned: 120,
        bestCombo: 55,
        variantKey: 'classic',
        isVictory: false,
        weaponKeys: ['thistle_shot', 'claymore'],
        runSeed: 42,
        isDaily: false,
      });
    });

    it('coerces missing bestCombo to 0 and missing victory to false', () => {
      const { hooks, saveManager } = buildMocks();
      new RunHistoryRecorder(hooks).record(
        { timeSurvivedSec: 10, enemiesKilled: 2 } as never,
        { goldEarned: 0 } as never,
      );
      const call = saveManager.recordRunToHistory.mock.calls[0][0];
      expect(call.bestCombo).toBe(0);
      expect(call.isVictory).toBe(false);
    });

    it('does NOT touch daily record for non-daily runs', () => {
      const { hooks, saveManager } = buildMocks({ isDaily: false });
      new RunHistoryRecorder(hooks).record(baseSummary as never, { goldEarned: 1 } as never);
      expect(saveManager.update).not.toHaveBeenCalled();
    });
  });

  describe('daily challenge record', () => {
    it('starts a fresh record when no prior exists', () => {
      const { hooks, saveManager } = buildMocks({ isDaily: true });
      new RunHistoryRecorder(hooks).record(
        { timeSurvivedSec: 300, enemiesKilled: 120, victory: false } as never,
        { goldEarned: 0 } as never,
      );
      const [reducer] = saveManager.update.mock.calls[0];
      const result = reducer({}) as { dailyChallenge: Record<string, unknown> };
      expect(result.dailyChallenge).toEqual({
        dateKey: currentDailyDateKey(),
        bestTimeSec: 300,
        bestEnemiesKilled: 120,
        attempts: 1,
        completedVictory: false,
      });
    });

    it('merges with today-keyed prior record (max time/kills, attempts++)', () => {
      const todayKey = currentDailyDateKey();
      const prior = {
        dateKey: todayKey,
        bestTimeSec: 400,
        bestEnemiesKilled: 50,
        attempts: 2,
        completedVictory: false,
      };
      const { hooks, saveManager } = buildMocks({
        isDaily: true,
        dailyChallenge: prior,
      });
      new RunHistoryRecorder(hooks).record(
        { timeSurvivedSec: 300, enemiesKilled: 80, victory: true } as never,
        { goldEarned: 0 } as never,
      );
      const [reducer] = saveManager.update.mock.calls[0];
      const result = reducer({ dailyChallenge: prior }) as { dailyChallenge: Record<string, unknown> };
      expect(result.dailyChallenge).toEqual({
        dateKey: todayKey,
        bestTimeSec: 400, // max(400, 300)
        bestEnemiesKilled: 80, // max(50, 80)
        attempts: 3,
        completedVictory: true,
      });
    });

    it('resets when prior record is from a past date', () => {
      const { hooks, saveManager } = buildMocks({
        isDaily: true,
        dailyChallenge: {
          dateKey: '1999-01-01',
          bestTimeSec: 9999,
          bestEnemiesKilled: 9999,
          attempts: 99,
          completedVictory: true,
        },
      });
      new RunHistoryRecorder(hooks).record(
        { timeSurvivedSec: 60, enemiesKilled: 10, victory: false } as never,
        { goldEarned: 0 } as never,
      );
      const [reducer] = saveManager.update.mock.calls[0];
      const result = reducer({}) as { dailyChallenge: Record<string, unknown> };
      expect(result.dailyChallenge.dateKey).toBe(currentDailyDateKey());
      expect(result.dailyChallenge.attempts).toBe(1);
      expect(result.dailyChallenge.completedVictory).toBe(false);
      expect(result.dailyChallenge.bestTimeSec).toBe(60);
    });
  });
});
