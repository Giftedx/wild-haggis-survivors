import { describe, it, expect } from 'vitest';
import { migrateSave, createDefaultSave, SAVE_SCHEMA_VERSION } from './save';

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
