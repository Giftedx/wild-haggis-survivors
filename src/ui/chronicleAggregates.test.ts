import { describe, expect, it } from 'vitest';
import {
  computeMilestones,
  detectMood,
  formatClock,
  formatDurationLong,
  formatRelativeTime,
  lifetimeTotals,
} from './chronicleAggregates';
import type { RunHistoryEntry, SaveData } from '../utils/save';

function entry(overrides: Partial<RunHistoryEntry> = {}): RunHistoryEntry {
  return {
    timestamp: 1_000_000,
    timeSurvivedSec: 120,
    enemiesKilled: 50,
    level: 5,
    bossKills: 1,
    goldEarned: 30,
    bestCombo: 6,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: ['thistle_shot'],
    ...overrides,
  };
}

function save(overrides: Partial<SaveData> = {}): SaveData {
  return {
    schemaVersion: 3,
    gold: 0,
    upgrades: {},
    unlockedVariants: ['classic'],
    selectedVariant: 'classic',
    totalRuns: 0,
    bestTime: 0,
    bestKills: 0,
    totalKills: 0,
    totalGoldEarned: 0,
    bestCombo: 0,
    victories: 0,
    runHistory: [],
    settings: { soundOn: true, musicOn: true },
    ...overrides,
  };
}

describe('lifetimeTotals', () => {
  it('returns authoritative counters and a derived win rate', () => {
    const s = save({ totalRuns: 10, victories: 3, totalKills: 500, totalGoldEarned: 200, bestTime: 300, bestKills: 80, bestCombo: 12,
      runHistory: [entry({ timeSurvivedSec: 60 }), entry({ timeSurvivedSec: 90 })] });
    const t = lifetimeTotals(s);
    expect(t.totalRuns).toBe(10);
    expect(t.victories).toBe(3);
    expect(t.winRate).toBeCloseTo(0.3);
    expect(t.timeOnMoorSec).toBe(150);
    expect(t.bestTimeSec).toBe(300);
  });

  it('zero runs → 0 win rate (no NaN)', () => {
    const t = lifetimeTotals(save());
    expect(t.winRate).toBe(0);
  });
});

describe('computeMilestones', () => {
  it('empty history → null fields and zero streaks', () => {
    const m = computeMilestones([]);
    expect(m.firstVictory).toBeNull();
    expect(m.longestRun).toBeNull();
    expect(m.favoriteVariantKey).toBeNull();
    expect(m.currentWinStreak).toBe(0);
    expect(m.currentLossStreak).toBe(0);
  });

  it('picks longest, most-kills, highest-combo correctly', () => {
    const h = [
      entry({ timeSurvivedSec: 60, enemiesKilled: 20, bestCombo: 4 }),
      entry({ timeSurvivedSec: 180, enemiesKilled: 50, bestCombo: 8 }),
      entry({ timeSurvivedSec: 120, enemiesKilled: 90, bestCombo: 6 }),
    ];
    const m = computeMilestones(h);
    expect(m.longestRun?.timeSurvivedSec).toBe(180);
    expect(m.mostKills?.enemiesKilled).toBe(90);
    expect(m.highestCombo?.bestCombo).toBe(8);
  });

  it('firstVictory returns the earliest victory, not latest', () => {
    const h = [
      entry({ timestamp: 100 }),
      entry({ timestamp: 200, isVictory: true, timeSurvivedSec: 300 }),
      entry({ timestamp: 300, isVictory: true, timeSurvivedSec: 500 }),
    ];
    const m = computeMilestones(h);
    expect(m.firstVictory?.timestamp).toBe(200);
  });

  it('favoriteVariant = most played variant', () => {
    const h = [
      entry({ variantKey: 'classic' }),
      entry({ variantKey: 'moor_runner' }),
      entry({ variantKey: 'moor_runner' }),
      entry({ variantKey: 'moor_runner' }),
      entry({ variantKey: 'classic' }),
    ];
    const m = computeMilestones(h);
    expect(m.favoriteVariantKey).toBe('moor_runner');
    expect(m.favoriteVariantCount).toBe(3);
  });

  it('favoriteWeapon dedupes duplicates within a single run', () => {
    const h = [
      entry({ weaponKeys: ['thistle_shot', 'thistle_shot', 'bagpipes'] }),
      entry({ weaponKeys: ['bagpipes', 'caber_toss'] }),
      entry({ weaponKeys: ['bagpipes'] }),
    ];
    const m = computeMilestones(h);
    expect(m.favoriteWeaponKey).toBe('bagpipes');
    expect(m.favoriteWeaponCount).toBe(3);
  });

  it('counts current trailing win streak', () => {
    const h = [
      entry({ isVictory: false }),
      entry({ isVictory: true }),
      entry({ isVictory: true }),
      entry({ isVictory: true }),
    ];
    const m = computeMilestones(h);
    expect(m.currentWinStreak).toBe(3);
    expect(m.currentLossStreak).toBe(0);
  });

  it('counts current trailing loss streak only when most recent is a loss', () => {
    const h = [
      entry({ isVictory: true }),
      entry({ isVictory: false }),
      entry({ isVictory: false }),
    ];
    const m = computeMilestones(h);
    expect(m.currentWinStreak).toBe(0);
    expect(m.currentLossStreak).toBe(2);
  });
});

describe('detectMood', () => {
  it('empty → empty', () => expect(detectMood([])).toBe('empty'));
  it('single entry → first_run', () => expect(detectMood([entry()])).toBe('first_run'));

  it('victory_streak beats fresh_victory when 2+ wins in a row', () => {
    const h = [entry({ isVictory: false }), entry({ isVictory: true }), entry({ isVictory: true })];
    expect(detectMood(h)).toBe('victory_streak');
  });

  it('loss_streak kicks in at 3+ consecutive losses', () => {
    const h = [entry({ isVictory: true }), entry({ isVictory: false }), entry({ isVictory: false }), entry({ isVictory: false })];
    expect(detectMood(h)).toBe('loss_streak');
  });

  it('fresh_victory when only last run is a win', () => {
    const h = [entry({ isVictory: false }), entry({ isVictory: false }), entry({ isVictory: true })];
    expect(detectMood(h)).toBe('fresh_victory');
  });

  it('improving when recent avg is >10% over overall', () => {
    // Need >5 entries so slice(-5) is a proper subset of overall.
    // Mixed isVictory so loss_streak / fresh_victory don't short-circuit trend.
    const h = [
      entry({ timeSurvivedSec: 40, isVictory: false }),
      entry({ timeSurvivedSec: 40, isVictory: true }),
      entry({ timeSurvivedSec: 40, isVictory: false }),
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
    ];
    expect(detectMood(h)).toBe('improving');
  });

  it('declining when recent avg is <90% of overall', () => {
    const h = [
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
      entry({ timeSurvivedSec: 200, isVictory: true }),
      entry({ timeSurvivedSec: 200, isVictory: false }),
      entry({ timeSurvivedSec: 40, isVictory: true }),
      entry({ timeSurvivedSec: 40, isVictory: false }),
      entry({ timeSurvivedSec: 40, isVictory: false }),
    ];
    // 2 trailing losses — under loss_streak's 3-threshold, so trend wins.
    expect(detectMood(h)).toBe('declining');
  });
});

describe('formatters', () => {
  it('formatClock pads seconds to 2 digits', () => {
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(7)).toBe('0:07');
    expect(formatClock(-5)).toBe('0:00');
  });

  it('formatDurationLong switches to h/m above one hour', () => {
    expect(formatDurationLong(30)).toBe('0m 30s');
    expect(formatDurationLong(125)).toBe('2m 5s');
    expect(formatDurationLong(3700)).toBe('1h 1m');
  });

  it('formatRelativeTime buckets into reasonable labels', () => {
    const now = 10_000_000_000;
    expect(formatRelativeTime(now, now)).toBe('just now');
    expect(formatRelativeTime(now - 5 * 60 * 1000, now)).toBe('5m ago');
    expect(formatRelativeTime(now - 3 * 60 * 60 * 1000, now)).toBe('3h ago');
    expect(formatRelativeTime(now - 2 * 24 * 60 * 60 * 1000, now)).toBe('2d ago');
  });
});
