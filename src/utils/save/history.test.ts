import { describe, expect, it } from 'vitest';
import { applyRunSummary, appendRunHistory, wipeIronmoorHistory } from './history';
import { MAX_RUN_HISTORY } from './schema';
import type { RunSummary, RunHistoryContext, RunHistoryEntry, SaveData } from './types';

function minimalSave(overrides: Partial<SaveData> = {}): SaveData {
  return {
    schemaVersion: 23,
    runHistory: [],
    unlockedVariants: ['classic'],
    ...overrides,
  } as unknown as SaveData;
}

function summary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    timeSurvivedSec: 120,
    enemiesKilled: 50,
    bossGold: 10,
    ...overrides,
  };
}

function context(overrides: Partial<RunHistoryContext> = {}): RunHistoryContext {
  return {
    level: 5,
    bossKills: 1,
    variantKey: 'classic',
    weaponKeys: ['thistle_shot'],
    ...overrides,
  };
}

function historyEntry(overrides: Partial<RunHistoryEntry> = {}): RunHistoryEntry {
  return {
    timestamp: Date.now(),
    timeSurvivedSec: 100,
    enemiesKilled: 20,
    level: 3,
    bossKills: 0,
    goldEarned: 5,
    bestCombo: 0,
    variantKey: 'classic',
    isVictory: false,
    weaponKeys: [],
    routes: [],
    relics: [],
    nodeOutcomes: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// applyRunSummary — gold accumulation
// ---------------------------------------------------------------------------

describe('applyRunSummary — gold', () => {
  it('adds bossGold to save gold', () => {
    const result = applyRunSummary(minimalSave({ gold: 0 }), summary({ bossGold: 15 }));
    expect(result.save.gold).toBeGreaterThan(0);
  });

  it('returns goldEarned matching the summary reward', () => {
    const result = applyRunSummary(minimalSave(), summary({ bossGold: 20 }));
    expect(result.goldEarned).toBe(result.save.totalGoldEarned - 0);
  });

  it('accumulates totalGoldEarned', () => {
    const save = minimalSave({ totalGoldEarned: 100 } as Partial<SaveData>);
    const result = applyRunSummary(save, summary({ bossGold: 10 }));
    expect(result.save.totalGoldEarned).toBeGreaterThan(100);
  });

  it('coinGoldSpent reduces reward relative to coinGold', () => {
    const r1 = applyRunSummary(minimalSave(), summary({ bossGold: 20, coinGold: 30 }));
    const r2 = applyRunSummary(minimalSave(), summary({ bossGold: 20, coinGold: 30, coinGoldSpent: 10 }));
    expect(r2.goldEarned).toBeLessThan(r1.goldEarned);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — lifetime counters
// ---------------------------------------------------------------------------

describe('applyRunSummary — lifetime counters', () => {
  it('increments totalRuns by 1', () => {
    const result = applyRunSummary(minimalSave(), summary());
    expect(result.save.totalRuns).toBe(1);
  });

  it('updates bestTime when new time is higher', () => {
    const save = minimalSave({ bestTime: 100 } as Partial<SaveData>);
    const result = applyRunSummary(save, summary({ timeSurvivedSec: 200 }));
    expect(result.save.bestTime).toBe(200);
  });

  it('keeps bestTime when existing record is higher', () => {
    const save = minimalSave({ bestTime: 500 } as Partial<SaveData>);
    const result = applyRunSummary(save, summary({ timeSurvivedSec: 200 }));
    expect(result.save.bestTime).toBe(500);
  });

  it('updates bestKills when new count is higher', () => {
    const save = minimalSave({ bestKills: 10 } as Partial<SaveData>);
    const result = applyRunSummary(save, summary({ enemiesKilled: 99 }));
    expect(result.save.bestKills).toBe(99);
  });

  it('keeps bestKills when existing record is higher', () => {
    const save = minimalSave({ bestKills: 200 } as Partial<SaveData>);
    const result = applyRunSummary(save, summary({ enemiesKilled: 50 }));
    expect(result.save.bestKills).toBe(200);
  });

  it('accumulates totalKills', () => {
    const save = minimalSave({ totalKills: 300 } as Partial<SaveData>);
    const result = applyRunSummary(save, summary({ enemiesKilled: 50 }));
    expect(result.save.totalKills).toBe(350);
  });

  it('updates bestCombo when summary bestCombo is higher', () => {
    const result = applyRunSummary(minimalSave(), summary({ bestCombo: 42 }));
    expect(result.save.bestCombo).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — victory counter
// ---------------------------------------------------------------------------

describe('applyRunSummary — victory counter', () => {
  it('increments victories on victory', () => {
    const result = applyRunSummary(minimalSave(), summary({ victory: true }));
    expect(result.save.victories).toBe(1);
  });

  it('does NOT increment victories on death', () => {
    const result = applyRunSummary(minimalSave(), summary({ victory: false }));
    expect(result.save.victories).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — cursed victory
// ---------------------------------------------------------------------------

describe('applyRunSummary — cursedVictoriesCompleted', () => {
  it('increments on victory + curseKey', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ curseKey: 'heavy_legs' }),
    );
    expect(result.save.cursedVictoriesCompleted).toBe(1);
  });

  it('does NOT increment on death + curseKey', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: false }),
      context({ curseKey: 'heavy_legs' }),
    );
    expect(result.save.cursedVictoriesCompleted).toBe(0);
  });

  it('does NOT increment on victory without curseKey', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ curseKey: undefined }),
    );
    expect(result.save.cursedVictoriesCompleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — no-heal victory
// ---------------------------------------------------------------------------

describe('applyRunSummary — runsWithoutHealingCircleCompleted', () => {
  it('increments on victory + enteredHealingCircle=false', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ enteredHealingCircle: false }),
    );
    expect(result.save.runsWithoutHealingCircleCompleted).toBe(1);
  });

  it('does NOT increment on victory + enteredHealingCircle=true', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ enteredHealingCircle: true }),
    );
    expect(result.save.runsWithoutHealingCircleCompleted).toBe(0);
  });

  it('does NOT increment when enteredHealingCircle is undefined (safety default)', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ enteredHealingCircle: undefined }),
    );
    expect(result.save.runsWithoutHealingCircleCompleted).toBe(0);
  });

  it('does NOT increment on death + enteredHealingCircle=false', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: false }),
      context({ enteredHealingCircle: false }),
    );
    expect(result.save.runsWithoutHealingCircleCompleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — coastal-only victory
// ---------------------------------------------------------------------------

describe('applyRunSummary — runsInCoastalOnlyCompleted', () => {
  it('increments on victory + all biomes coastal (loch/pine)', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ biomesVisited: ['loch', 'pine'] }),
    );
    expect(result.save.runsInCoastalOnlyCompleted).toBe(1);
  });

  it('does NOT increment when non-coastal biome visited', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ biomesVisited: ['loch', 'heather'] }),
    );
    expect(result.save.runsInCoastalOnlyCompleted).toBe(0);
  });

  it('does NOT increment on death + coastal biomes', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: false }),
      context({ biomesVisited: ['loch'] }),
    );
    expect(result.save.runsInCoastalOnlyCompleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — full-evolution victory
// ---------------------------------------------------------------------------

describe('applyRunSummary — runsWithAllEvolutionsCompleted', () => {
  it('increments on victory + evolvedWeaponCount >= 10', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ evolvedWeaponCount: 10 }),
    );
    expect(result.save.runsWithAllEvolutionsCompleted).toBe(1);
  });

  it('does NOT increment when evolvedWeaponCount below threshold', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ evolvedWeaponCount: 9 }),
    );
    expect(result.save.runsWithAllEvolutionsCompleted).toBe(0);
  });

  it('does NOT increment on death + full evo count', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: false }),
      context({ evolvedWeaponCount: 10 }),
    );
    expect(result.save.runsWithAllEvolutionsCompleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — Burns Night full-evo victory
// ---------------------------------------------------------------------------

describe('applyRunSummary — burnsNightFullEvoRunsCompleted', () => {
  it('increments on victory + burns_night + full evo', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ evolvedWeaponCount: 10, seasonalEventKey: 'burns_night' }),
    );
    expect(result.save.burnsNightFullEvoRunsCompleted).toBe(1);
  });

  it('does NOT increment on full evo + non-burns seasonal event', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ evolvedWeaponCount: 10, seasonalEventKey: 'samhain' }),
    );
    expect(result.save.burnsNightFullEvoRunsCompleted).toBe(0);
  });

  it('does NOT increment on burns_night without full evo', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary({ victory: true }),
      context({ evolvedWeaponCount: 9, seasonalEventKey: 'burns_night' }),
    );
    expect(result.save.burnsNightFullEvoRunsCompleted).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — runHistory and context fields
// ---------------------------------------------------------------------------

describe('applyRunSummary — runHistory', () => {
  it('appends one entry to runHistory', () => {
    const result = applyRunSummary(minimalSave(), summary());
    expect(result.save.runHistory).toHaveLength(1);
  });

  it('history entry carries variantKey from context', () => {
    const result = applyRunSummary(minimalSave(), summary(), context({ variantKey: 'moor_runner' }));
    expect(result.save.runHistory[0].variantKey).toBe('moor_runner');
  });

  it('history entry carries weaponKeys from context', () => {
    const result = applyRunSummary(
      minimalSave(),
      summary(),
      context({ weaponKeys: ['thistle_shot', 'claymore'] }),
    );
    expect(result.save.runHistory[0].weaponKeys).toEqual(['thistle_shot', 'claymore']);
  });

  it('history entry carries curseKey when provided', () => {
    const result = applyRunSummary(minimalSave(), summary(), context({ curseKey: 'thin_hide' }));
    expect(result.save.runHistory[0].curseKey).toBe('thin_hide');
  });

  it('history entry omits curseKey when absent', () => {
    const result = applyRunSummary(minimalSave(), summary(), context({ curseKey: undefined }));
    expect(result.save.runHistory[0].curseKey).toBeUndefined();
  });

  it('history entry reflects victory flag', () => {
    const r1 = applyRunSummary(minimalSave(), summary({ victory: true }));
    const r2 = applyRunSummary(minimalSave(), summary({ victory: false }));
    expect(r1.save.runHistory[0].isVictory).toBe(true);
    expect(r2.save.runHistory[0].isVictory).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyRunSummary — variant unlocks
// ---------------------------------------------------------------------------

describe('applyRunSummary — variant unlocks', () => {
  it('returns empty newlyUnlockedVariants when nothing unlocks', () => {
    const result = applyRunSummary(
      minimalSave({ unlockedVariants: ['classic'] }),
      summary(),
    );
    expect(result.newlyUnlockedVariants).toHaveLength(0);
  });

  it('reports newly unlocked variant when threshold met', () => {
    // moor_runner unlocks at bestTime >= 600
    const result = applyRunSummary(
      minimalSave({ unlockedVariants: ['classic'] }),
      summary({ timeSurvivedSec: 600 }),
    );
    expect(result.newlyUnlockedVariants).toContain('moor_runner');
  });
});

// ---------------------------------------------------------------------------
// appendRunHistory
// ---------------------------------------------------------------------------

describe('appendRunHistory', () => {
  it('appends entry to empty history', () => {
    const result = appendRunHistory([], historyEntry());
    expect(result).toHaveLength(1);
  });

  it('caps at MAX_RUN_HISTORY', () => {
    const full = Array.from({ length: MAX_RUN_HISTORY }, () => historyEntry());
    const result = appendRunHistory(full, historyEntry());
    expect(result).toHaveLength(MAX_RUN_HISTORY);
  });

  it('shifts oldest entry when at capacity', () => {
    const entries = Array.from({ length: MAX_RUN_HISTORY }, (_, i) =>
      historyEntry({ timeSurvivedSec: i }),
    );
    const newest = historyEntry({ timeSurvivedSec: 999 });
    const result = appendRunHistory(entries, newest);
    expect(result[result.length - 1].timeSurvivedSec).toBe(999);
    expect(result[0].timeSurvivedSec).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// wipeIronmoorHistory
// ---------------------------------------------------------------------------

describe('wipeIronmoorHistory', () => {
  it('removes entries flagged ironmoor: true', () => {
    const save = minimalSave({ runHistory: [historyEntry({ ironmoor: true }), historyEntry()] } as Partial<SaveData>);
    const result = wipeIronmoorHistory(save);
    expect(result.runHistory).toHaveLength(1);
    expect(result.runHistory[0].ironmoor).toBeUndefined();
  });

  it('returns the same object reference when no ironmoor entries', () => {
    const save = minimalSave({ runHistory: [historyEntry()] } as Partial<SaveData>);
    const result = wipeIronmoorHistory(save);
    expect(result).toBe(save);
  });

  it('returns empty runHistory when all entries are ironmoor', () => {
    const save = minimalSave({
      runHistory: [historyEntry({ ironmoor: true }), historyEntry({ ironmoor: true })],
    } as Partial<SaveData>);
    expect(wipeIronmoorHistory(save).runHistory).toHaveLength(0);
  });

  it('preserves non-ironmoor entries when wiping', () => {
    const keep = historyEntry({ timeSurvivedSec: 300 });
    const save = minimalSave({
      runHistory: [historyEntry({ ironmoor: true }), keep],
    } as Partial<SaveData>);
    const result = wipeIronmoorHistory(save);
    expect(result.runHistory[0].timeSurvivedSec).toBe(300);
  });
});
