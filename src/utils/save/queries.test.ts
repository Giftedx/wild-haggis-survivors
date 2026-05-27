import { describe, expect, it } from 'vitest';
import {
  isCoastalOnlyRun,
  computeGoldReward,
  isLastDeathFresh,
  getPersonalBests,
  getWinRate,
  getAverageSurvivalTime,
  getTrend,
} from './queries';
import { LAST_DEATH_TTL_MS } from './schema';
import type { RunHistoryEntry, RunSummary } from './types';

function run(overrides: Partial<RunHistoryEntry> = {}): RunHistoryEntry {
  return {
    timestamp: 1700000000,
    timeSurvivedSec: 300,
    enemiesKilled: 50,
    level: 5,
    bossKills: 1,
    goldEarned: 10,
    bestCombo: 20,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: [],
    ...overrides,
  };
}

function summary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    timeSurvivedSec: 300,
    enemiesKilled: 50,
    bossGold: 5,
    coinGold: 0,
    coinGoldSpent: 0,
    bestCombo: 10,
    victory: false,
    goldMult: 1,
    ...overrides,
  };
}

describe('isCoastalOnlyRun', () => {
  it('returns false when not a victory', () => {
    expect(isCoastalOnlyRun(false, ['loch'])).toBe(false);
  });

  it('returns false when biomesVisited is undefined', () => {
    expect(isCoastalOnlyRun(true, undefined)).toBe(false);
  });

  it('returns false when biomesVisited is empty', () => {
    expect(isCoastalOnlyRun(true, [])).toBe(false);
  });

  it('returns true for a victory with only coastal biomes', () => {
    expect(isCoastalOnlyRun(true, ['loch', 'pine'])).toBe(true);
  });

  it('returns false when any non-coastal biome is present', () => {
    expect(isCoastalOnlyRun(true, ['loch', 'bog'])).toBe(false);
    expect(isCoastalOnlyRun(true, ['heather'])).toBe(false);
  });

  it('returns true for a single coastal biome victory', () => {
    expect(isCoastalOnlyRun(true, ['loch'])).toBe(true);
    expect(isCoastalOnlyRun(true, ['pine'])).toBe(true);
  });
});

describe('computeGoldReward', () => {
  it('computes zero for a zeroed summary', () => {
    const result = computeGoldReward(summary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 }));
    expect(result).toBe(0);
  });

  it('floors fractional result', () => {
    // 1 * 0.4 + 1 * 0.4 + 0 + 0 = 0.8 * 1 => floor => 0
    const result = computeGoldReward(summary({ timeSurvivedSec: 1, enemiesKilled: 1, bossGold: 0, coinGold: 0 }));
    expect(result).toBe(0);
  });

  it('subtracts coinGoldSpent from coinGold', () => {
    // coinGold 10, coinGoldSpent 6 → net 4; 0 time + 0 kills + 0 boss + 4 net = 4 * 1 = 4
    const result = computeGoldReward(summary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0, coinGold: 10, coinGoldSpent: 6 }));
    expect(result).toBe(4);
  });

  it('clamps negative net coin to zero', () => {
    const result = computeGoldReward(summary({ timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0, coinGold: 2, coinGoldSpent: 10 }));
    expect(result).toBe(0);
  });

  it('applies goldMult', () => {
    // 100 * 0.4 + 0 + 0 + 0 = 40 * 2 = 80
    const result = computeGoldReward(summary({ timeSurvivedSec: 100, enemiesKilled: 0, bossGold: 0, coinGold: 0, goldMult: 2 }));
    expect(result).toBe(80);
  });

  it('handles missing optional fields via normalizeRunSummary defaults', () => {
    const bare: RunSummary = { timeSurvivedSec: 0, enemiesKilled: 0, bossGold: 0 };
    expect(computeGoldReward(bare)).toBe(0);
  });
});

describe('isLastDeathFresh', () => {
  it('returns false when entry is null', () => {
    expect(isLastDeathFresh(null)).toBe(false);
  });

  it('returns false when entry is undefined', () => {
    expect(isLastDeathFresh(undefined)).toBe(false);
  });

  it('returns true when within TTL', () => {
    const now = 1700000000;
    const recent = { ts: now - LAST_DEATH_TTL_MS + 1000 };
    expect(isLastDeathFresh(recent, now)).toBe(true);
  });

  it('returns false when exactly at TTL boundary', () => {
    const now = 1700000000;
    const stale = { ts: now - LAST_DEATH_TTL_MS };
    expect(isLastDeathFresh(stale, now)).toBe(false);
  });

  it('returns false when older than TTL', () => {
    const now = 1700000000;
    const old = { ts: now - LAST_DEATH_TTL_MS - 1 };
    expect(isLastDeathFresh(old, now)).toBe(false);
  });
});

describe('getPersonalBests', () => {
  it('returns zeros for empty history', () => {
    expect(getPersonalBests([])).toEqual({ bestTime: 0, bestKills: 0, bestCombo: 0 });
  });

  it('returns the best values across multiple entries', () => {
    const history = [
      run({ timeSurvivedSec: 100, enemiesKilled: 30, bestCombo: 5 }),
      run({ timeSurvivedSec: 400, enemiesKilled: 10, bestCombo: 25 }),
      run({ timeSurvivedSec: 250, enemiesKilled: 50, bestCombo: 15 }),
    ];
    expect(getPersonalBests(history)).toEqual({ bestTime: 400, bestKills: 50, bestCombo: 25 });
  });

  it('works for a single entry', () => {
    expect(getPersonalBests([run({ timeSurvivedSec: 120, enemiesKilled: 40, bestCombo: 10 })])).toEqual({
      bestTime: 120,
      bestKills: 40,
      bestCombo: 10,
    });
  });
});

describe('getWinRate', () => {
  it('returns 0 for empty history', () => {
    expect(getWinRate([])).toBe(0);
  });

  it('returns 0 when no victories', () => {
    expect(getWinRate([run({ isVictory: false }), run({ isVictory: false })])).toBe(0);
  });

  it('returns 1 when all victories', () => {
    expect(getWinRate([run({ isVictory: true }), run({ isVictory: true })])).toBe(1);
  });

  it('returns correct fraction for mixed history', () => {
    const history = [
      run({ isVictory: true }),
      run({ isVictory: false }),
      run({ isVictory: true }),
      run({ isVictory: false }),
    ];
    expect(getWinRate(history)).toBe(0.5);
  });
});

describe('getAverageSurvivalTime', () => {
  it('returns 0 for empty history', () => {
    expect(getAverageSurvivalTime([])).toBe(0);
  });

  it('returns the time for a single entry', () => {
    expect(getAverageSurvivalTime([run({ timeSurvivedSec: 200 })])).toBe(200);
  });

  it('returns the mean across multiple entries', () => {
    const history = [run({ timeSurvivedSec: 100 }), run({ timeSurvivedSec: 200 }), run({ timeSurvivedSec: 300 })];
    expect(getAverageSurvivalTime(history)).toBe(200);
  });
});

describe('getTrend', () => {
  it('returns steady for fewer than 3 entries', () => {
    expect(getTrend([])).toBe('steady');
    expect(getTrend([run()])).toBe('steady');
    expect(getTrend([run(), run()])).toBe('steady');
  });

  it('returns improving when recent average is >10% above overall', () => {
    // Pad with short runs, recent runs are long
    const history = [
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      // Recent 5: all 500
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
    ];
    expect(getTrend(history)).toBe('improving');
  });

  it('returns declining when recent average is >10% below overall', () => {
    const history = [
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 500 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
      run({ timeSurvivedSec: 100 }),
    ];
    expect(getTrend(history)).toBe('declining');
  });

  it('returns steady when recent average is within 10% of overall', () => {
    const history = Array.from({ length: 6 }, () => run({ timeSurvivedSec: 300 }));
    expect(getTrend(history)).toBe('steady');
  });
});
