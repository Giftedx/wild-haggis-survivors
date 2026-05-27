import { describe, expect, it } from 'vitest';
import { SaveManager, MAX_RUN_HISTORY, type RunHistoryEntry } from './SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';
import {
  appendRunHistory,
  getPersonalBests,
  getWinRate,
  getAverageSurvivalTime,
  getTrend,
  MAX_RUN_HISTORY as SAVE_MAX,
  type RunHistoryEntry as SaveRunHistoryEntry,
} from '../utils/save';

function makeEntry(overrides: Partial<RunHistoryEntry> = {}): RunHistoryEntry {
  return {
    timestamp: Date.now(),
    timeSurvivedSec: 120,
    enemiesKilled: 50,
    level: 5,
    bossKills: 1,
    goldEarned: 40,
    bestCombo: 8,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: ['thistle_shot'],
    ...overrides,
  };
}

const v5Save = {
  saveVersion: 5,
  totalKills: 100,
  unlockedWeapons: ['thistle_shot'],
  unlockedUpgrades: [],
  activeRun: null,
  unlockedAchievements: [],
  hasCompletedTutorial: true,
  hasSeenDriftTutorial: false,
};

describe('RunHistory', () => {
  it('migrates v5 → current with empty runHistory', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify(v5Save));
    const mgr = new SaveManager({ storage, key: 'k' });
    const loaded = mgr.load();
    expect(loaded.saveVersion).toBe(12);
    expect(loaded.runHistory).toEqual([]);
    expect(loaded.totalKills).toBe(100);
    expect(loaded.hasCompletedTutorial).toBe(true);
  });

  it('records a run and appends to history', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.recordRunToHistory(makeEntry({ enemiesKilled: 77 }));
    const history = mgr.getRunHistory();
    expect(history).toHaveLength(1);
    expect(history[0].enemiesKilled).toBe(77);
  });

  it('caps history at MAX_RUN_HISTORY entries (FIFO)', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    for (let i = 0; i < MAX_RUN_HISTORY + 5; i++) {
      mgr.recordRunToHistory(makeEntry({ enemiesKilled: i }));
    }
    const history = mgr.getRunHistory();
    expect(history).toHaveLength(MAX_RUN_HISTORY);
    expect(history[0].enemiesKilled).toBe(5);
    expect(history[MAX_RUN_HISTORY - 1].enemiesKilled).toBe(MAX_RUN_HISTORY + 4);
  });

  it('drops malformed entries with missing variantKey', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.recordRunToHistory(makeEntry({ variantKey: '' }));
    expect(mgr.getRunHistory()).toHaveLength(0);
  });

  it('preserves the cosmetic run name on record + load', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.recordRunToHistory(makeEntry({ name: 'Murdo MacFurryhooves' }));
    const history = mgr.getRunHistory();
    expect(history[0].name).toBe('Murdo MacFurryhooves');
  });

  it('coerces corrupted history entries on load', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({
      ...v5Save,
      saveVersion: 8,
      runHistory: [
        { variantKey: 'classic', timeSurvivedSec: 'bad', enemiesKilled: -5 },
        null,
        makeEntry({ enemiesKilled: 42 }),
      ],
    }));
    const mgr = new SaveManager({ storage, key: 'k' });
    const history = mgr.getRunHistory();
    // null entry is dropped; malformed entry is coerced (variantKey present → kept)
    expect(history).toHaveLength(2);
    expect(history[0].timeSurvivedSec).toBe(0);
    expect(history[0].enemiesKilled).toBe(0);
    expect(history[1].enemiesKilled).toBe(42);
  });

  it('computes personal bests correctly', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.recordRunToHistory(makeEntry({ timeSurvivedSec: 100, enemiesKilled: 30, bestCombo: 5, level: 4, goldEarned: 20 }));
    mgr.recordRunToHistory(makeEntry({ timeSurvivedSec: 200, enemiesKilled: 80, bestCombo: 12, level: 8, goldEarned: 60 }));
    mgr.recordRunToHistory(makeEntry({ timeSurvivedSec: 150, enemiesKilled: 60, bestCombo: 3, level: 6, goldEarned: 45 }));
    const bests = mgr.getPersonalBests();
    expect(bests.bestTime).toBe(200);
    expect(bests.bestKills).toBe(80);
    expect(bests.bestCombo).toBe(12);
    expect(bests.bestLevel).toBe(8);
    expect(bests.bestGold).toBe(60);
  });

  it('returns zero bests when history is empty', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    const bests = mgr.getPersonalBests();
    expect(bests.bestTime).toBe(0);
    expect(bests.bestKills).toBe(0);
    expect(bests.bestCombo).toBe(0);
    expect(bests.bestLevel).toBe(0);
    expect(bests.bestGold).toBe(0);
  });

  it('preserves existing runHistory through current save/load cycle', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.recordRunToHistory(makeEntry({ enemiesKilled: 10 }));
    mgr.recordRunToHistory(makeEntry({ enemiesKilled: 20 }));
    const loaded = mgr.load();
    expect(loaded.runHistory).toHaveLength(2);
    expect(loaded.runHistory[0].enemiesKilled).toBe(10);
    expect(loaded.runHistory[1].enemiesKilled).toBe(20);
  });

  it('migrates v1 all the way to current with empty history', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 1, totalKills: 3, unlockedWeapons: [] }));
    const mgr = new SaveManager({ storage, key: 'k' });
    const loaded = mgr.load();
    expect(loaded.saveVersion).toBe(12);
    expect(loaded.runHistory).toEqual([]);
    expect(loaded.totalKills).toBe(3);
  });

  it('tracks victory runs for win rate calculation', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.recordRunToHistory(makeEntry({ isVictory: true }));
    mgr.recordRunToHistory(makeEntry({ isVictory: false }));
    mgr.recordRunToHistory(makeEntry({ isVictory: true }));
    const history = mgr.getRunHistory();
    const victories = history.filter((r) => r.isVictory).length;
    expect(victories).toBe(2);
    expect(history.length).toBe(3);
    // Win rate: 2/3 = 66.67%
    expect(Math.round((victories / history.length) * 100)).toBe(67);
  });
});

describe('save.ts RunHistory utilities', () => {
  function makeSaveEntry(overrides: Partial<SaveRunHistoryEntry> = {}): SaveRunHistoryEntry {
    return {
      timestamp: Date.now(),
      timeSurvivedSec: 120,
      enemiesKilled: 50,
      level: 5,
      bossKills: 1,
      goldEarned: 40,
      bestCombo: 8,
      variantKey: 'classic',
      isVictory: false,
      weaponKeys: ['thistle_shot'],
      ...overrides,
    };
  }

  it('appendRunHistory caps at MAX_RUN_HISTORY', () => {
    const history: SaveRunHistoryEntry[] = [];
    let current = history;
    for (let i = 0; i < SAVE_MAX + 3; i++) {
      current = appendRunHistory(current, makeSaveEntry({ enemiesKilled: i }));
    }
    expect(current).toHaveLength(SAVE_MAX);
    expect(current[0].enemiesKilled).toBe(3);
  });

  it('getPersonalBests finds max values across entries', () => {
    const entries = [
      makeSaveEntry({ timeSurvivedSec: 60, enemiesKilled: 30, bestCombo: 5 }),
      makeSaveEntry({ timeSurvivedSec: 300, enemiesKilled: 10, bestCombo: 20 }),
      makeSaveEntry({ timeSurvivedSec: 200, enemiesKilled: 90, bestCombo: 3 }),
    ];
    const bests = getPersonalBests(entries);
    expect(bests.bestTime).toBe(300);
    expect(bests.bestKills).toBe(90);
    expect(bests.bestCombo).toBe(20);
  });

  it('getPersonalBests returns zeros for empty history', () => {
    const bests = getPersonalBests([]);
    expect(bests.bestTime).toBe(0);
    expect(bests.bestKills).toBe(0);
    expect(bests.bestCombo).toBe(0);
  });

  it('getWinRate handles zero-division', () => {
    expect(getWinRate([])).toBe(0);
  });

  it('getWinRate calculates correctly', () => {
    const entries = [
      makeSaveEntry({ isVictory: true }),
      makeSaveEntry({ isVictory: false }),
      makeSaveEntry({ isVictory: true }),
      makeSaveEntry({ isVictory: true }),
    ];
    expect(getWinRate(entries)).toBe(0.75);
  });

  it('getAverageSurvivalTime handles empty history', () => {
    expect(getAverageSurvivalTime([])).toBe(0);
  });

  it('getAverageSurvivalTime computes mean', () => {
    const entries = [
      makeSaveEntry({ timeSurvivedSec: 100 }),
      makeSaveEntry({ timeSurvivedSec: 200 }),
      makeSaveEntry({ timeSurvivedSec: 300 }),
    ];
    expect(getAverageSurvivalTime(entries)).toBe(200);
  });

  it('getTrend returns steady with fewer than 3 runs', () => {
    expect(getTrend([makeSaveEntry(), makeSaveEntry()])).toBe('steady');
    expect(getTrend([])).toBe('steady');
  });

  it('getTrend detects improvement', () => {
    const entries = [
      makeSaveEntry({ timeSurvivedSec: 60 }),
      makeSaveEntry({ timeSurvivedSec: 70 }),
      makeSaveEntry({ timeSurvivedSec: 80 }),
      makeSaveEntry({ timeSurvivedSec: 200 }),
      makeSaveEntry({ timeSurvivedSec: 250 }),
      makeSaveEntry({ timeSurvivedSec: 300 }),
    ];
    expect(getTrend(entries)).toBe('improving');
  });

  it('getTrend detects decline', () => {
    const entries = [
      makeSaveEntry({ timeSurvivedSec: 300 }),
      makeSaveEntry({ timeSurvivedSec: 280 }),
      makeSaveEntry({ timeSurvivedSec: 260 }),
      makeSaveEntry({ timeSurvivedSec: 50 }),
      makeSaveEntry({ timeSurvivedSec: 40 }),
      makeSaveEntry({ timeSurvivedSec: 30 }),
    ];
    expect(getTrend(entries)).toBe('declining');
  });
});
