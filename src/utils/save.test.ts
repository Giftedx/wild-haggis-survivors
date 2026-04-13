import { describe, expect, it } from 'vitest';
import {
  applyRunSummary,
  coerceSelectedVariant,
  computeGoldReward,
  createDefaultSave,
  evaluateVariantUnlocks,
  migrateSave,
} from './save';

describe('save migration', () => {
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
