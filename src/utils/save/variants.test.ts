import { describe, expect, it } from 'vitest';
import { evaluateVariantUnlocks, coerceSelectedVariant, progressSnapshotFromSave } from './variants';
import { DEFAULT_VARIANT_KEY } from '../../data/variants';
import type { VariantProgressSnapshot } from '../../data/variants';
import type { SaveData } from './types';

function zeroProgress(overrides: Partial<VariantProgressSnapshot> = {}): VariantProgressSnapshot {
  return {
    bestTime: 0,
    bestKills: 0,
    totalGoldEarned: 0,
    victories: 0,
    cursedVictories: 0,
    runsWithoutHealing: 0,
    runsInCoastalOnly: 0,
    runsWithAllEvolutions: 0,
    burnsNightFullEvoRuns: 0,
    ...overrides,
  };
}

describe('evaluateVariantUnlocks', () => {
  it('always includes classic (the default) even with no progress', () => {
    const { unlockedVariants } = evaluateVariantUnlocks(zeroProgress());
    expect(unlockedVariants).toContain(DEFAULT_VARIANT_KEY);
  });

  it('carries previouslyUnlocked keys through', () => {
    const { unlockedVariants } = evaluateVariantUnlocks(zeroProgress(), ['moor_runner']);
    expect(unlockedVariants).toContain('moor_runner');
  });

  it('newlyUnlockedVariants excludes keys already in previouslyUnlocked', () => {
    const { newlyUnlockedVariants } = evaluateVariantUnlocks(zeroProgress(), ['classic']);
    expect(newlyUnlockedVariants).not.toContain('classic');
  });

  it('classic is never in newlyUnlockedVariants when included in previouslyUnlocked', () => {
    const { newlyUnlockedVariants } = evaluateVariantUnlocks(zeroProgress(), ['classic']);
    expect(newlyUnlockedVariants).not.toContain('classic');
  });

  it('returns empty newlyUnlockedVariants when nothing new qualifies', () => {
    // With zero progress only classic qualifies; if classic is already unlocked, nothing is new
    const { newlyUnlockedVariants } = evaluateVariantUnlocks(zeroProgress(), ['classic']);
    expect(newlyUnlockedVariants).toHaveLength(0);
  });

  it('unlocks moor_runner when bestTime meets its threshold', () => {
    // moor_runner unlocks at bestTime ≥ 600 (10 minutes)
    const { unlockedVariants, newlyUnlockedVariants } = evaluateVariantUnlocks(
      zeroProgress({ bestTime: 600 }),
      [],
    );
    expect(unlockedVariants).toContain('moor_runner');
    expect(newlyUnlockedVariants).toContain('moor_runner');
  });

  it('does not unlock moor_runner below its threshold', () => {
    const { unlockedVariants } = evaluateVariantUnlocks(zeroProgress({ bestTime: 599 }), []);
    expect(unlockedVariants).not.toContain('moor_runner');
  });

  it('unlocks pipe_breath when victories reach its threshold', () => {
    // pipe_breath unlocks at victories ≥ 3
    const { unlockedVariants } = evaluateVariantUnlocks(zeroProgress({ victories: 3 }), []);
    expect(unlockedVariants).toContain('pipe_breath');
  });

  it('result contains no duplicate keys', () => {
    const { unlockedVariants } = evaluateVariantUnlocks(zeroProgress({ bestTime: 9999, victories: 99, totalGoldEarned: 99999 }), ['classic']);
    const unique = new Set(unlockedVariants);
    expect(unlockedVariants).toHaveLength(unique.size);
  });
});

describe('coerceSelectedVariant', () => {
  it('returns the variant when it is unlocked', () => {
    const result = coerceSelectedVariant('classic', ['classic', 'moor_runner']);
    expect(result).toBe('classic');
  });

  it('returns classic when the selected variant is not unlocked', () => {
    const result = coerceSelectedVariant('moor_runner', ['classic']);
    expect(result).toBe(DEFAULT_VARIANT_KEY);
  });

  it('returns classic for a non-string input', () => {
    expect(coerceSelectedVariant(null, ['classic'])).toBe(DEFAULT_VARIANT_KEY);
    expect(coerceSelectedVariant(42, ['classic'])).toBe(DEFAULT_VARIANT_KEY);
    expect(coerceSelectedVariant(undefined, ['classic'])).toBe(DEFAULT_VARIANT_KEY);
  });

  it('returns classic for an unknown variant key string', () => {
    const result = coerceSelectedVariant('not_a_variant', ['classic']);
    expect(result).toBe(DEFAULT_VARIANT_KEY);
  });

  it('preserves a non-classic selection when it is unlocked', () => {
    const result = coerceSelectedVariant('glaswegian', ['classic', 'glaswegian', 'moor_runner']);
    expect(result).toBe('glaswegian');
  });
});

describe('progressSnapshotFromSave', () => {
  function fakeSave(overrides: Partial<SaveData> = {}): SaveData {
    return {
      schemaVersion: 23,
      gold: 0,
      totalGoldEarned: 500,
      bestTime: 400,
      bestKills: 80,
      victories: 3,
      cursedVictoriesCompleted: 1,
      runsWithoutHealingCircleCompleted: 2,
      runsInCoastalOnlyCompleted: 1,
      runsWithAllEvolutionsCompleted: 0,
      burnsNightFullEvoRunsCompleted: 0,
      unlockedVariants: ['classic'],
      // Minimum required fields to satisfy SaveData shape
      runHistory: [],
      metaUpgrades: {},
      settings: { soundOn: true, musicOn: true },
      selectedVariant: 'classic',
      selectedCurse: null,
      discoveryLog: {} as never,
      livingWorldUnlocks: { unlockedCompanions: [], selectedCompanion: null },
      lastDeath: undefined,
      featuredChallenges: [],
      friendChallenges: [],
      tartanUnlocks: [],
      selectedTartan: null,
      activeRunes: [],
      ...overrides,
    } as unknown as SaveData;
  }

  it('maps bestTime and bestKills correctly', () => {
    const snap = progressSnapshotFromSave(fakeSave({ bestTime: 999, bestKills: 123 }));
    expect(snap.bestTime).toBe(999);
    expect(snap.bestKills).toBe(123);
  });

  it('maps cursedVictoriesCompleted → cursedVictories', () => {
    const snap = progressSnapshotFromSave(fakeSave({ cursedVictoriesCompleted: 7 }));
    expect(snap.cursedVictories).toBe(7);
  });

  it('maps runsWithoutHealingCircleCompleted → runsWithoutHealing', () => {
    const snap = progressSnapshotFromSave(fakeSave({ runsWithoutHealingCircleCompleted: 4 }));
    expect(snap.runsWithoutHealing).toBe(4);
  });

  it('maps runsInCoastalOnlyCompleted → runsInCoastalOnly', () => {
    const snap = progressSnapshotFromSave(fakeSave({ runsInCoastalOnlyCompleted: 2 }));
    expect(snap.runsInCoastalOnly).toBe(2);
  });

  it('maps totalGoldEarned and victories', () => {
    const snap = progressSnapshotFromSave(fakeSave({ totalGoldEarned: 8000, victories: 12 }));
    expect(snap.totalGoldEarned).toBe(8000);
    expect(snap.victories).toBe(12);
  });

  it('maps unlockedVariants', () => {
    const snap = progressSnapshotFromSave(fakeSave({ unlockedVariants: ['classic', 'moor_runner'] }));
    expect(snap.unlockedVariants).toEqual(['classic', 'moor_runner']);
  });
});
