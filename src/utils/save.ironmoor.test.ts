import { describe, it, expect } from 'vitest';
import {
  migrateSave,
  createDefaultSave,
  SAVE_SCHEMA_VERSION,
  wipeIronmoorHistory,
  type RunHistoryEntry,
  type SaveData,
} from './save';

function row(partial: Partial<RunHistoryEntry> & { ironmoor?: boolean }): RunHistoryEntry {
  return {
    timestamp: 1_000,
    timeSurvivedSec: 120,
    enemiesKilled: 50,
    level: 10,
    bossKills: 1,
    goldEarned: 25,
    bestCombo: 5,
    variantKey: 'default',
    isVictory: false,
    weaponKeys: [],
    ...partial,
  };
}

/**
 * W66 Ironmoor — separate leaderboard field. Mirrors the bestEndlessSeconds
 * pattern: back-compat default of 0, coerced through migrateSave.
 */
describe('bestIronmoorSeconds save field', () => {
  it('defaults to 0 on a fresh save', () => {
    const save = createDefaultSave();
    expect(save.bestIronmoorSeconds ?? 0).toBe(0);
  });

  it('is preserved through migrateSave', () => {
    const input = { ...createDefaultSave(), bestIronmoorSeconds: 842 };
    const migrated = migrateSave(input);
    expect(migrated.bestIronmoorSeconds).toBe(842);
  });

  it('defaults to 0 when absent on a legacy save payload', () => {
    const legacy: Record<string, unknown> = {
      schemaVersion: SAVE_SCHEMA_VERSION,
      gold: 100,
      upgrades: {},
      unlockedVariants: ['default'],
      selectedVariant: 'default',
      totalRuns: 1,
      bestTime: 60,
      bestKills: 50,
      totalKills: 50,
      totalGoldEarned: 100,
      bestCombo: 0,
      victories: 0,
      runHistory: [],
      settings: { soundOn: true, musicOn: true },
    };
    const migrated = migrateSave(legacy);
    expect(migrated.bestIronmoorSeconds).toBe(0);
  });

  it('coerces non-numeric values to 0', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      bestIronmoorSeconds: 'garbage' as unknown as number,
    };
    expect(migrateSave(input).bestIronmoorSeconds).toBe(0);
  });

  it('floors fractions and clamps negatives', () => {
    expect(migrateSave({ ...createDefaultSave(), bestIronmoorSeconds: 12.9 }).bestIronmoorSeconds).toBe(12);
    expect(migrateSave({ ...createDefaultSave(), bestIronmoorSeconds: -3 }).bestIronmoorSeconds).toBe(0);
  });

  it('treats non-finite values as 0', () => {
    expect(
      migrateSave({ ...createDefaultSave(), bestIronmoorSeconds: Number.POSITIVE_INFINITY }).bestIronmoorSeconds,
    ).toBe(0);
    expect(migrateSave({ ...createDefaultSave(), bestIronmoorSeconds: Number.NaN }).bestIronmoorSeconds).toBe(0);
  });
});

describe('wipeIronmoorHistory', () => {
  const base = (history: RunHistoryEntry[]): SaveData => ({
    ...createDefaultSave(),
    runHistory: history,
  });

  it('returns the same reference when no ironmoor rows exist', () => {
    const save = base([row({ ironmoor: false }), row({ ironmoor: undefined })]);
    const next = wipeIronmoorHistory(save);
    expect(next).toBe(save);
    expect(next.runHistory).toHaveLength(2);
  });

  it('returns a new object when at least one ironmoor row is wiped', () => {
    const save = base([
      row({ ironmoor: false, timeSurvivedSec: 100 }),
      row({ ironmoor: true, timeSurvivedSec: 300 }),
    ]);
    const next = wipeIronmoorHistory(save);
    expect(next).not.toBe(save);
    expect(next.runHistory).toHaveLength(1);
    expect(next.runHistory[0]?.timeSurvivedSec).toBe(100);
  });

  it('wipes ALL ironmoor rows in one call', () => {
    const save = base([
      row({ ironmoor: true }),
      row({ ironmoor: true }),
      row({ ironmoor: false }),
      row({ ironmoor: true }),
    ]);
    const next = wipeIronmoorHistory(save);
    expect(next.runHistory.every((e) => !e.ironmoor)).toBe(true);
    expect(next.runHistory).toHaveLength(1);
  });

  it('preserves bestIronmoorSeconds — the separate leaderboard survives permadeath', () => {
    const save: SaveData = {
      ...base([row({ ironmoor: true })]),
      bestIronmoorSeconds: 500,
    };
    const next = wipeIronmoorHistory(save);
    expect(next.bestIronmoorSeconds).toBe(500);
    expect(next.runHistory).toHaveLength(0);
  });

  it('preserves non-history fields — gold, upgrades, unlocked variants unchanged', () => {
    const save: SaveData = {
      ...base([row({ ironmoor: true })]),
      gold: 9999,
      upgrades: { foo: 3 },
      unlockedVariants: ['default', 'moor_runner'] as SaveData['unlockedVariants'],
    };
    const next = wipeIronmoorHistory(save);
    expect(next.gold).toBe(9999);
    expect(next.upgrades).toEqual({ foo: 3 });
    expect(next.unlockedVariants).toEqual(['default', 'moor_runner']);
  });

  it('handles empty history', () => {
    const save = base([]);
    const next = wipeIronmoorHistory(save);
    expect(next).toBe(save);
    expect(next.runHistory).toEqual([]);
  });
});
