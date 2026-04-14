import { describe, expect, it } from 'vitest';
import { VARIANT_KEYS } from '../data/variants';
import {
  MAX_RUN_HISTORY,
  applyRunSummary,
  coerceSelectedVariant,
  computeGoldReward,
  createDefaultSave,
  evaluateVariantUnlocks,
  migrateSave,
} from './save';

describe('save migration', () => {
  it('returns a fresh default save when the payload is not a plain object', () => {
    const expected = createDefaultSave();
    expect(migrateSave(null)).toEqual(expected);
    expect(migrateSave(undefined)).toEqual(expected);
    expect(migrateSave([])).toEqual(expected);
    expect(migrateSave('oops')).toEqual(expected);
  });

  it('migrates legacy saves without resetting progression', () => {
    const migrated = migrateSave({
      gold: 250,
      upgrades: { strong_legs: 2, thick_hide: 1 },
      totalRuns: 8,
      bestTime: 620,
      bestKills: 760,
      totalKills: 1400,
      totalGoldEarned: 1600,
      bestCombo: 18,
      victories: 1,
      settings: { soundOn: false },
      selectedVariant: 'moor_runner',
      unlockedVariants: ['classic'],
    });

    expect(migrated.schemaVersion).toBe(3);
    expect(migrated.gold).toBe(250);
    expect(migrated.upgrades).toEqual({ strong_legs: 2, thick_hide: 1 });
    expect(migrated.totalRuns).toBe(8);
    expect(migrated.settings.soundOn).toBe(false);
    expect(migrated.settings.musicOn).toBe(true);
    expect(migrated.unlockedVariants).toEqual([
      'classic',
      'moor_runner',
      'iron_belly',
      'glen_forager',
      'surefoot',
    ]);
    expect(migrated.selectedVariant).toBe('moor_runner');
  });

  it('coerces malformed fields and falls back to a valid selected variant', () => {
    const migrated = migrateSave({
      schemaVersion: 2,
      gold: 'not-a-number',
      bestTime: -12,
      bestKills: 300,
      totalGoldEarned: 40,
      victories: 0,
      upgrades: { sharp_thistles: 2.8, drift_control: 'bad' },
      selectedVariant: 'surefoot',
      unlockedVariants: ['classic', 'made_up_variant'],
      settings: { soundOn: 'yes', musicOn: false },
    });

    expect(migrated.gold).toBe(0);
    expect(migrated.bestTime).toBe(0);
    expect(migrated.upgrades).toEqual({ sharp_thistles: 2, drift_control: 0 });
    expect(migrated.unlockedVariants).toEqual(['classic']);
    expect(migrated.selectedVariant).toBe('classic');
    expect(migrated.settings).toEqual({ soundOn: true, musicOn: false });
  });

  it('keeps only the last MAX_RUN_HISTORY runHistory rows after migration', () => {
    const base = createDefaultSave();
    const runHistory = Array.from({ length: MAX_RUN_HISTORY + 3 }, (_, i) => ({
      timestamp: i,
      timeSurvivedSec: i * 10,
      enemiesKilled: i,
      level: 1,
      bossKills: 0,
      goldEarned: 0,
      bestCombo: 0,
      variantKey: 'classic',
      isVictory: false,
      weaponKeys: [] as string[],
    }));
    const migrated = migrateSave({ ...base, runHistory });
    expect(migrated.runHistory).toHaveLength(MAX_RUN_HISTORY);
    expect(migrated.runHistory[0].timeSurvivedSec).toBe(30);
    expect(migrated.runHistory[MAX_RUN_HISTORY - 1].timeSurvivedSec).toBe(220);
  });

  it('coerces runHistory rows: string weaponKeys, curseKey, level floor, boolean victory', () => {
    const migrated = migrateSave({
      ...createDefaultSave(),
      runHistory: [
        {
          timestamp: 1,
          timeSurvivedSec: 60,
          enemiesKilled: 12,
          level: 0,
          bossKills: 0,
          goldEarned: 5,
          bestCombo: 3,
          variantKey: 'moor_runner',
          isVictory: 'maybe' as unknown as boolean,
          weaponKeys: ['thistle_shot', 42, null, 'bagpipes'] as unknown as string[],
          curseKey: '',
        },
        {
          timestamp: 2,
          timeSurvivedSec: 90,
          enemiesKilled: 20,
          level: 2,
          bossKills: 1,
          goldEarned: 10,
          bestCombo: 5,
          variantKey: 'classic',
          isVictory: true,
          weaponKeys: [],
          curseKey: 'gold_rush',
        },
      ],
    });
    expect(migrated.runHistory).toHaveLength(2);
    const [first, second] = migrated.runHistory;
    expect(first.level).toBe(1);
    expect(first.isVictory).toBe(false);
    expect(first.weaponKeys).toEqual(['thistle_shot', 'bagpipes']);
    expect(first.curseKey).toBeUndefined();
    expect(second.curseKey).toBe('gold_rush');
  });

  it('drops runHistory when the field is not an array', () => {
    const migrated = migrateSave({
      ...createDefaultSave(),
      runHistory: { not: 'an array' } as unknown as [],
    });
    expect(migrated.runHistory).toEqual([]);
  });
});

describe('variant unlock evaluation', () => {
  it('detects multiple unlocks earned in one progress snapshot', () => {
    const result = evaluateVariantUnlocks(
      {
        bestTime: 600,
        bestKills: 750,
        totalGoldEarned: 1500,
        victories: 1,
        unlockedVariants: ['classic'],
      },
      ['classic']
    );

    expect(result.unlockedVariants).toEqual([
      'classic',
      'moor_runner',
      'iron_belly',
      'glen_forager',
      'surefoot',
    ]);
    expect(result.newlyUnlockedVariants).toEqual([
      'moor_runner',
      'iron_belly',
      'glen_forager',
      'surefoot',
    ]);
  });
});

describe('run application', () => {
  it('applies reward math, victory count, and unlocks in one pass', () => {
    const baseSave = {
      ...createDefaultSave(),
      bestTime: 590,
      bestKills: 740,
      totalGoldEarned: 1400,
    };

    const result = applyRunSummary(baseSave, {
      timeSurvivedSec: 610,
      enemiesKilled: 800,
      bossGold: 12,
      coinGold: 8,
      bestCombo: 27,
      victory: true,
    });

    expect(computeGoldReward({
      timeSurvivedSec: 610,
      enemiesKilled: 800,
      bossGold: 12,
      coinGold: 8,
      bestCombo: 27,
      victory: true,
    })).toBe(584);
    expect(result.goldEarned).toBe(584);
    expect(result.save.gold).toBe(584);
    expect(result.save.totalRuns).toBe(1);
    expect(result.save.victories).toBe(1);
    expect(result.save.bestTime).toBe(610);
    expect(result.save.bestKills).toBe(800);
    expect(result.save.bestCombo).toBe(27);
    expect(result.newlyUnlockedVariants).toEqual([
      'moor_runner',
      'iron_belly',
      'glen_forager',
      'surefoot',
    ]);
  });

  it('coerces locked or invalid selected variants back to classic', () => {
    expect(coerceSelectedVariant('surefoot', ['classic'])).toBe('classic');
    expect(coerceSelectedVariant('moor_runner', ['classic', 'moor_runner'])).toBe('moor_runner');
    expect(coerceSelectedVariant('made_up_variant', ['classic', 'moor_runner'])).toBe('classic');
  });

  it('coerceSelectedVariant treats non-string values like unknown keys (classic)', () => {
    const unlocked = ['classic', 'moor_runner'] as const;
    expect(coerceSelectedVariant(null, unlocked)).toBe('classic');
    expect(coerceSelectedVariant(undefined, unlocked)).toBe('classic');
    expect(coerceSelectedVariant(123, unlocked)).toBe('classic');
    expect(coerceSelectedVariant({}, unlocked)).toBe('classic');
  });

  it('evaluateVariantUnlocks reports no newlyUnlocked when save already lists every variant', () => {
    const maxProgress = {
      bestTime: 99999,
      bestKills: 99999,
      totalGoldEarned: 9_999_999,
      victories: 99,
    };
    const result = evaluateVariantUnlocks(maxProgress, [...VARIANT_KEYS]);
    expect(result.newlyUnlockedVariants).toEqual([]);
    expect(result.unlockedVariants).toEqual([...VARIANT_KEYS]);
  });
});

describe('gold reward — curse multiplier', () => {
  const base = {
    timeSurvivedSec: 610,
    enemiesKilled: 800,
    bossGold: 12,
    coinGold: 8,
    bestCombo: 27,
    victory: true,
  };

  it('defaults to 1× when no goldMult is provided', () => {
    expect(computeGoldReward(base)).toBe(584);
  });

  it('scales the reward by goldMult (Thin Hide = 1.40×)', () => {
    expect(computeGoldReward({ ...base, goldMult: 1.40 })).toBe(Math.floor(584 * 1.40 / 1));
  });

  it('ignores non-positive or non-finite goldMult (falls back to 1×)', () => {
    expect(computeGoldReward({ ...base, goldMult: 0 })).toBe(584);
    expect(computeGoldReward({ ...base, goldMult: -2 })).toBe(584);
    expect(computeGoldReward({ ...base, goldMult: Number.NaN })).toBe(584);
  });
});

describe('computeGoldReward time normalization', () => {
  const zeros = {
    enemiesKilled: 0,
    bossGold: 0,
    coinGold: 0,
    bestCombo: 0,
    victory: false,
  } as const;

  it('rounds fractional survival seconds into the reward base', () => {
    expect(
      computeGoldReward({
        ...zeros,
        timeSurvivedSec: 299.9,
      })
    ).toBe(120);
  });

  it('treats negative survival time as 0 in the reward base', () => {
    expect(
      computeGoldReward({
        ...zeros,
        timeSurvivedSec: -40,
        enemiesKilled: 100,
      })
    ).toBe(Math.floor(100 * 0.4));
  });
});

describe('applyRunSummary run history context', () => {
  it('writes context fields on the appended entry and skips curseKey when empty', () => {
    const afterFirst = applyRunSummary(
      createDefaultSave(),
      {
        timeSurvivedSec: 72,
        enemiesKilled: 15,
        bossGold: 0,
        coinGold: 0,
        bestCombo: 4,
        victory: true,
      },
      {
        level: 9,
        bossKills: 3,
        variantKey: 'moor_runner',
        weaponKeys: ['thistle_shot', 'bagpipes'],
        curseKey: 'gold_rush',
      }
    );
    const firstEntry = afterFirst.save.runHistory[afterFirst.save.runHistory.length - 1];
    expect(firstEntry.level).toBe(9);
    expect(firstEntry.bossKills).toBe(3);
    expect(firstEntry.variantKey).toBe('moor_runner');
    expect(firstEntry.weaponKeys).toEqual(['thistle_shot', 'bagpipes']);
    expect(firstEntry.curseKey).toBe('gold_rush');

    const afterSecond = applyRunSummary(
      afterFirst.save,
      {
        timeSurvivedSec: 10,
        enemiesKilled: 1,
        bossGold: 0,
        coinGold: 0,
        bestCombo: 0,
        victory: false,
      },
      {
        level: 1,
        bossKills: 0,
        curseKey: '',
        variantKey: 'classic',
        weaponKeys: [],
      }
    );
    const secondEntry = afterSecond.save.runHistory[afterSecond.save.runHistory.length - 1];
    expect(secondEntry.curseKey).toBeUndefined();
  });
});
