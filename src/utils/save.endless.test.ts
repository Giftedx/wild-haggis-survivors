import { describe, it, expect } from 'vitest';
import { migrateSave, createDefaultSave, SAVE_SCHEMA_VERSION } from './save';

describe('bestEndlessSeconds save field', () => {
  it('defaults to 0 on a fresh save', () => {
    const save = createDefaultSave();
    expect(save.bestEndlessSeconds ?? 0).toBe(0);
  });

  it('is preserved through migrateSave', () => {
    const input = { ...createDefaultSave(), bestEndlessSeconds: 423 };
    const migrated = migrateSave(input);
    expect(migrated.bestEndlessSeconds).toBe(423);
  });

  it('defaults to 0 when absent on a legacy save payload', () => {
    // Simulate an older save that was written before this field existed.
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
    expect(migrated.bestEndlessSeconds).toBe(0);
  });

  it('coerces non-numeric endless values to 0', () => {
    const input: Record<string, unknown> = {
      ...createDefaultSave(),
      bestEndlessSeconds: 'garbage' as unknown as number,
    };
    const migrated = migrateSave(input);
    expect(migrated.bestEndlessSeconds).toBe(0);
  });
});
