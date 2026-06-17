import { describe, expect, it } from 'vitest';
import {
  coerceInteger,
  coerceUpgradeLevels,
  isRecord,
  normalizeRunSummary,
  compactReplayBlobs,
} from './migrations';
import type { RunHistoryEntry } from './types';

// ---------------------------------------------------------------------------
// coerceInteger
// ---------------------------------------------------------------------------

describe('coerceInteger', () => {
  it('returns the value for a valid positive integer', () => {
    expect(coerceInteger(7, 0)).toBe(7);
  });

  it('floors a positive float', () => {
    expect(coerceInteger(3.9, 0)).toBe(3);
  });

  it('clamps negative values to 0', () => {
    expect(coerceInteger(-5, 0)).toBe(0);
  });

  it('returns fallback for NaN', () => {
    expect(coerceInteger(NaN, 42)).toBe(42);
  });

  it('returns fallback for Infinity', () => {
    expect(coerceInteger(Infinity, 1)).toBe(1);
  });

  it('returns fallback for a string', () => {
    expect(coerceInteger('10', 99)).toBe(99);
  });

  it('returns fallback for null', () => {
    expect(coerceInteger(null, 5)).toBe(5);
  });

  it('returns fallback for undefined', () => {
    expect(coerceInteger(undefined, 3)).toBe(3);
  });

  it('returns 0 for 0 input', () => {
    expect(coerceInteger(0, 99)).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// coerceUpgradeLevels
// ---------------------------------------------------------------------------

describe('coerceUpgradeLevels', () => {
  it('clamps a known upgrade above its maxLevel down to maxLevel', () => {
    // thick_hide caps at level 5. A corrupt / hand-edited save must not apply
    // a 9999× stat bonus at run start — the shop UI already guards
    // currentLevel > maxLevel, the apply path must agree.
    const out = coerceUpgradeLevels({ thick_hide: 9999 });
    expect(out.thick_hide).toBe(5);
  });

  it('leaves an in-range known level unchanged', () => {
    const out = coerceUpgradeLevels({ thick_hide: 3 });
    expect(out.thick_hide).toBe(3);
  });

  it('floors negative / fractional levels (existing coerceInteger behaviour)', () => {
    const out = coerceUpgradeLevels({ thick_hide: -3, strong_legs: 2.9 });
    expect(out.thick_hide).toBe(0);
    expect(out.strong_legs).toBe(2);
  });

  it('preserves unknown keys as coerced integers (forward-compat, no silent prune)', () => {
    const out = coerceUpgradeLevels({ future_upgrade: 3 });
    expect(out.future_upgrade).toBe(3);
  });

  it('returns {} for non-record input', () => {
    expect(coerceUpgradeLevels(null)).toEqual({});
    expect(coerceUpgradeLevels(42)).toEqual({});
  });
});

// ---------------------------------------------------------------------------
// isRecord
// ---------------------------------------------------------------------------

describe('isRecord', () => {
  it('returns true for a plain object', () => {
    expect(isRecord({ a: 1 })).toBe(true);
  });

  it('returns true for an empty object', () => {
    expect(isRecord({})).toBe(true);
  });

  it('returns false for null', () => {
    expect(isRecord(null)).toBe(false);
  });

  it('returns false for an array', () => {
    expect(isRecord([])).toBe(false);
  });

  it('returns false for a string', () => {
    expect(isRecord('hello')).toBe(false);
  });

  it('returns false for a number', () => {
    expect(isRecord(42)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isRecord(undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// normalizeRunSummary
// ---------------------------------------------------------------------------

describe('normalizeRunSummary', () => {
  it('rounds timeSurvivedSec (not floors)', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 299.9, enemiesKilled: 0, bossGold: 0 }).timeSurvivedSec).toBe(300);
  });

  it('floors enemies killed', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 7.9, bossGold: 0 }).enemiesKilled).toBe(7);
  });

  it('defaults bestCombo to 0 when absent', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 }).bestCombo).toBe(0);
  });

  it('defaults coinGold to 0 when absent', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 }).coinGold).toBe(0);
  });

  it('defaults coinGoldSpent to 0 when absent', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 }).coinGoldSpent).toBe(0);
  });

  it('defaults victory to false when absent', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 }).victory).toBe(false);
  });

  it('coerces victory to boolean', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0, victory: true }).victory).toBe(true);
  });

  it('defaults goldMult to 1 when absent', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 }).goldMult).toBe(1);
  });

  it('rejects non-positive goldMult and falls back to 1', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0, goldMult: 0 }).goldMult).toBe(1);
    expect(normalizeRunSummary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0, goldMult: -1 }).goldMult).toBe(1);
  });

  it('clamps timeSurvivedSec to 0 for negative input', () => {
    expect(normalizeRunSummary({ timeSurvivedSec: -10, enemiesKilled: 0, bossGold: 0 }).timeSurvivedSec).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// compactReplayBlobs
// ---------------------------------------------------------------------------

function entry(timeSurvivedSec = 100, withReplay = false): RunHistoryEntry {
  return {
    timestamp: Date.now(),
    timeSurvivedSec,
    enemiesKilled: 0,
    level: 1,
    bossKills: 0,
    goldEarned: 0,
    bestCombo: 0,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: [],
    routes: [],
    relics: [],
    nodeOutcomes: [],
    ...(withReplay ? { replay: { v: 1, frames: [] } as never } : {}),
  };
}

const CAP = 5;

describe('compactReplayBlobs', () => {
  it('returns the same reference when at or below cap', () => {
    const arr = Array.from({ length: CAP }, () => entry(100, true));
    expect(compactReplayBlobs(arr)).toBe(arr);
  });

  it('returns same reference for empty array', () => {
    const arr: RunHistoryEntry[] = [];
    expect(compactReplayBlobs(arr)).toBe(arr);
  });

  it('strips replay blobs from oldest entries beyond cap', () => {
    const entries = [
      ...Array.from({ length: CAP }, () => entry(100, true)),
      entry(200, true),
    ];
    const result = compactReplayBlobs(entries);
    expect(result[0].replay).toBeUndefined();
  });

  it('preserves replay blobs in the newest CAP entries', () => {
    const entries = [
      entry(100, true),
      ...Array.from({ length: CAP }, () => entry(200, true)),
    ];
    const result = compactReplayBlobs(entries);
    for (let i = 1; i <= CAP; i++) {
      expect(result[i].replay).toBeDefined();
    }
  });

  it('preserves entries without replay blobs in older positions', () => {
    const entries = [
      entry(1, false),
      ...Array.from({ length: CAP }, () => entry(2, true)),
    ];
    const result = compactReplayBlobs(entries);
    expect(result[0]).toBe(entries[0]);
  });

  it('preserves all non-replay fields on compacted entries', () => {
    const entries = [
      entry(999, true),
      ...Array.from({ length: CAP }, () => entry(1, false)),
    ];
    const result = compactReplayBlobs(entries);
    expect(result[0].timeSurvivedSec).toBe(999);
  });
});
