import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VARIANT_KEYS } from '../data/variants';
import {
  MAX_RUN_HISTORY,
  SAVE_SCHEMA_VERSION,
  applyRunSummary,
  bumpAncestralEchoesTouched,
  bumpCeilidhPulsesLifetime,
  bumpReliquaryCurioPick,
  bumpStandingStonePick,
  consumeLastDeath,
  recordIronmoorBest,
  recordLastDeath,
  recordPostBellBest,
  wipeIronmoorHistoryInPlace,
  coerceSelectedVariant,
  computeGoldReward,
  createDefaultSave,
  evaluateVariantUnlocks,
  loadSave,
  migrateSave,
  writeSave,
} from './save';
import type { RoutePick } from '../data/routes';

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

    expect(migrated.schemaVersion).toBe(6);
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

describe('save schema v3 → v4 (W2 routes)', () => {
  it('SAVE_SCHEMA_VERSION is 6', () => {
    expect(SAVE_SCHEMA_VERSION).toBe(6);
  });

  it('migrates v3 save: adds routes:[] to each RunHistoryEntry, no data loss', () => {
    const v3: unknown = {
      schemaVersion: 3,
      gold: 123,
      upgrades: { thick_hide: 2 },
      unlockedVariants: ['classic'],
      selectedVariant: 'classic',
      totalRuns: 5,
      bestTime: 300,
      bestKills: 120,
      totalKills: 600,
      totalGoldEarned: 450,
      bestCombo: 42,
      victories: 1,
      bestEndlessSeconds: 0,
      runHistory: [{
        timestamp: 1700000000000,
        timeSurvivedSec: 300,
        enemiesKilled: 120,
        level: 7,
        bossKills: 2,
        goldEarned: 50,
        bestCombo: 42,
        variantKey: 'classic',
        isVictory: true,
        weaponKeys: ['thistle_shot'],
      }],
      settings: { soundOn: true, musicOn: true },
    };
    const migrated = migrateSave(v3);
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.gold).toBe(123);
    expect(migrated.runHistory).toHaveLength(1);
    expect(migrated.runHistory[0].routes).toEqual([]);
    expect(migrated.runHistory[0].timeSurvivedSec).toBe(300);
    // v5 added `replay?` — v3 entries never carried one, stays absent.
    expect(migrated.runHistory[0].replay).toBeUndefined();
  });

  it('preserves routes on a v4 save round-trip', () => {
    const save = createDefaultSave();
    const route: RoutePick = {
      slot: 'A',
      routeKey: 'up_the_brae',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    };
    save.runHistory = [{
      timestamp: 1700000000000,
      timeSurvivedSec: 300,
      enemiesKilled: 120,
      level: 7,
      bossKills: 2,
      goldEarned: 50,
      bestCombo: 42,
      variantKey: 'classic',
      isVictory: true,
      weaponKeys: ['thistle_shot'],
      routes: [route],
    }];
    const migrated = migrateSave(save);
    expect(migrated.runHistory[0].routes).toEqual([route]);
  });

  it('applyRunSummary writes routes from RunHistoryContext', () => {
    const save = createDefaultSave();
    const picks: RoutePick[] = [{
      slot: 'A',
      routeKey: 'round_the_loch',
      atGameTimeSec: 305,
      defaultedBySetting: false,
    }];
    const result = applyRunSummary(
      save,
      { timeSurvivedSec: 900, enemiesKilled: 300, bossGold: 100, victory: true },
      { level: 10, bossKills: 3, variantKey: 'classic', weaponKeys: ['thistle_shot'], routes: picks },
    );
    expect(result.save.runHistory[0].routes).toEqual(picks);
  });
});

describe('save schema v4 → v5 (T1 replay blob)', () => {
  const replayBlob = {
    version: 1 as const,
    build: 'test-build',
    seed: 0xDEADBEEF,
    variantKey: 'classic',
    frameCount: 2,
    frames: [
      { dtMs: 16, dx: 0, dy: 0, dash: false, menu: false },
      { dtMs: 16, dx: 1, dy: 0, dash: true, menu: false },
    ],
  };

  it('migrates v4 save to v5 without touching run history', () => {
    const v4: unknown = {
      schemaVersion: 4,
      gold: 99,
      upgrades: {},
      unlockedVariants: ['classic'],
      selectedVariant: 'classic',
      totalRuns: 3,
      bestTime: 400,
      bestKills: 80,
      totalKills: 200,
      totalGoldEarned: 150,
      bestCombo: 12,
      victories: 1,
      runHistory: [{
        timestamp: 1700000000000,
        timeSurvivedSec: 400,
        enemiesKilled: 80,
        level: 5,
        bossKills: 1,
        goldEarned: 25,
        bestCombo: 12,
        variantKey: 'classic',
        isVictory: true,
        weaponKeys: ['thistle_shot'],
        routes: [],
      }],
      settings: { soundOn: true, musicOn: true },
    };
    const migrated = migrateSave(v4);
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.runHistory).toHaveLength(1);
    expect(migrated.runHistory[0].replay).toBeUndefined();
    expect(migrated.runHistory[0].timeSurvivedSec).toBe(400);
  });

  it('preserves a well-formed replay blob on v5 round-trip', () => {
    const save = createDefaultSave();
    save.runHistory = [{
      timestamp: 1700000000000,
      timeSurvivedSec: 120,
      enemiesKilled: 40,
      level: 3,
      bossKills: 0,
      goldEarned: 20,
      bestCombo: 8,
      variantKey: 'classic',
      isVictory: false,
      weaponKeys: ['thistle_shot'],
      routes: [],
      replay: replayBlob,
    }];
    const migrated = migrateSave(save);
    expect(migrated.runHistory[0].replay).toEqual(replayBlob);
  });

  it('drops a malformed replay blob without killing the entry', () => {
    const save = createDefaultSave();
    save.runHistory = [{
      timestamp: 1700000000000,
      timeSurvivedSec: 120,
      enemiesKilled: 40,
      level: 3,
      bossKills: 0,
      goldEarned: 20,
      bestCombo: 8,
      variantKey: 'classic',
      isVictory: false,
      weaponKeys: ['thistle_shot'],
      routes: [],
      // @ts-expect-error — deliberately malformed
      replay: { version: 99, build: 'x' },
    }];
    const migrated = migrateSave(save);
    expect(migrated.runHistory[0].replay).toBeUndefined();
    expect(migrated.runHistory[0].timeSurvivedSec).toBe(120);
  });

  it('applyRunSummary writes replay from RunHistoryContext', () => {
    const save = createDefaultSave();
    const result = applyRunSummary(
      save,
      { timeSurvivedSec: 120, enemiesKilled: 40, bossGold: 5, victory: false },
      {
        level: 3,
        bossKills: 0,
        variantKey: 'classic',
        weaponKeys: ['thistle_shot'],
        replay: replayBlob,
      },
    );
    expect(result.save.runHistory[0].replay).toEqual(replayBlob);
  });

  it('applyRunSummary omits replay when the context does not pass one', () => {
    const save = createDefaultSave();
    const result = applyRunSummary(
      save,
      { timeSurvivedSec: 30, enemiesKilled: 10, bossGold: 0, victory: false },
      { level: 2, bossKills: 0, variantKey: 'classic', weaponKeys: [] },
    );
    expect(result.save.runHistory[0].replay).toBeUndefined();
  });
});

describe('save schema v5 → v6 (T1 Phase 3 ReplayBlobAny widening)', () => {
  const replayBlobV1 = {
    version: 1 as const,
    build: 'test-build',
    seed: 1,
    variantKey: 'classic',
    frameCount: 1,
    frames: [{ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false }],
  };
  const replayBlobV2 = {
    version: 2 as const,
    build: 'test-build',
    seed: 2,
    variantKey: 'classic',
    frameCount: 1,
    frames: [{ dtMs: 16, dx: 0, dy: 0, dash: false, menu: false }],
    curseKey: 'heavy_legs',
    routes: [
      {
        slot: 'A' as const,
        routeKey: 'up_the_brae' as const,
        atGameTimeSec: 180,
        defaultedBySetting: false,
      },
    ],
  };

  it('migrates a v5 save to v6 without data loss', () => {
    const v5: unknown = {
      schemaVersion: 5,
      gold: 77,
      upgrades: {},
      unlockedVariants: ['classic'],
      selectedVariant: 'classic',
      totalRuns: 2,
      bestTime: 200,
      bestKills: 45,
      totalKills: 90,
      totalGoldEarned: 120,
      bestCombo: 9,
      victories: 0,
      runHistory: [{
        timestamp: 1700000000000,
        timeSurvivedSec: 200,
        enemiesKilled: 45,
        level: 4,
        bossKills: 1,
        goldEarned: 20,
        bestCombo: 9,
        variantKey: 'classic',
        isVictory: false,
        weaponKeys: ['thistle_shot'],
        routes: [],
        replay: replayBlobV1,
      }],
      settings: { soundOn: true, musicOn: true },
    };
    const migrated = migrateSave(v5);
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.gold).toBe(77);
    expect(migrated.runHistory).toHaveLength(1);
    expect(migrated.runHistory[0].replay).toEqual(replayBlobV1);
  });

  it('persists a v2 replay blob through write/load', () => {
    const save = createDefaultSave();
    save.runHistory = [{
      timestamp: 1700000000000,
      timeSurvivedSec: 300,
      enemiesKilled: 100,
      level: 6,
      bossKills: 2,
      goldEarned: 35,
      bestCombo: 14,
      variantKey: 'classic',
      isVictory: true,
      weaponKeys: ['thistle_shot'],
      routes: [],
      replay: replayBlobV2,
    }];
    const migrated = migrateSave(save);
    expect(migrated.runHistory[0].replay).toEqual(replayBlobV2);
    // After a full write/load cycle (save test utilities stub localStorage in
    // parent suites — replicate here for isolation).
    expect(migrated.runHistory[0].replay?.version).toBe(2);
  });

  it('applyRunSummary writes a v2 replay blob from RunHistoryContext', () => {
    const save = createDefaultSave();
    const result = applyRunSummary(
      save,
      { timeSurvivedSec: 300, enemiesKilled: 100, bossGold: 10, victory: true },
      {
        level: 6,
        bossKills: 2,
        variantKey: 'classic',
        weaponKeys: ['thistle_shot'],
        replay: replayBlobV2,
      },
    );
    expect(result.save.runHistory[0].replay).toEqual(replayBlobV2);
  });
});

describe('cursedVictoriesCompleted migration', () => {
  it('defaults to 0 on fresh save', () => {
    const loaded = migrateSave({});
    expect(loaded.cursedVictoriesCompleted).toBe(0);
  });

  it('preserves a saved counter value', () => {
    const loaded = migrateSave({ cursedVictoriesCompleted: 2 });
    expect(loaded.cursedVictoriesCompleted).toBe(2);
  });

  it('coerces invalid values to 0', () => {
    const loaded = migrateSave({ cursedVictoriesCompleted: 'no' });
    expect(loaded.cursedVictoriesCompleted).toBe(0);
  });

  it('seeds retroactively from runHistory on first load', () => {
    const loaded = migrateSave({
      runHistory: [
        { isVictory: true, curseKey: 'heavy_legs', variantKey: 'classic', timestamp: 1, timeSurvivedSec: 900, enemiesKilled: 200, level: 5, bossKills: 1, goldEarned: 30, bestCombo: 5, weaponKeys: [] },
        { isVictory: false, curseKey: 'heavy_legs', variantKey: 'classic', timestamp: 2, timeSurvivedSec: 60, enemiesKilled: 10, level: 1, bossKills: 0, goldEarned: 5, bestCombo: 1, weaponKeys: [] },
        { isVictory: true, variantKey: 'classic', timestamp: 3, timeSurvivedSec: 900, enemiesKilled: 200, level: 5, bossKills: 1, goldEarned: 30, bestCombo: 5, weaponKeys: [] },
        { isVictory: true, curseKey: 'iron_grip', variantKey: 'classic', timestamp: 4, timeSurvivedSec: 900, enemiesKilled: 200, level: 5, bossKills: 1, goldEarned: 30, bestCombo: 5, weaponKeys: [] },
      ],
    });
    expect(loaded.cursedVictoriesCompleted).toBe(2);
  });

  it('does not re-seed when cursedVictoriesCompleted is already present', () => {
    const loaded = migrateSave({
      cursedVictoriesCompleted: 5,
      runHistory: [
        { isVictory: true, curseKey: 'heavy_legs', variantKey: 'classic', timestamp: 1, timeSurvivedSec: 900, enemiesKilled: 200, level: 5, bossKills: 1, goldEarned: 30, bestCombo: 5, weaponKeys: [] },
      ],
    });
    // Counter was present (5) so no retroactive seed — stays at 5
    expect(loaded.cursedVictoriesCompleted).toBe(5);
  });
});

describe('lifetime-counter bumps', () => {
  let originalLocalStorage: Storage | undefined;

  beforeEach(() => {
    originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;
    const mem = new Map<string, string>();
    (globalThis as { localStorage: Storage }).localStorage = {
      getItem: (k: string) => mem.get(k) ?? null,
      setItem: (k: string, v: string) => { mem.set(k, v); },
      removeItem: (k: string) => { mem.delete(k); },
      clear: () => { mem.clear(); },
      key: () => null,
      get length() { return mem.size; },
    } as Storage;
  });

  afterEach(() => {
    if (originalLocalStorage === undefined) {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    } else {
      (globalThis as { localStorage: Storage }).localStorage = originalLocalStorage;
    }
  });

  it('bumpStandingStonePick starts a new counter from 0', () => {
    bumpStandingStonePick('mending');
    expect(loadSave().standingStonesPicked).toEqual({ mending: 1 });
  });

  it('bumpStandingStonePick increments existing counters', () => {
    writeSave({ ...createDefaultSave(), standingStonesPicked: { fire: 4 } });
    bumpStandingStonePick('fire');
    bumpStandingStonePick('fire');
    expect(loadSave().standingStonesPicked).toEqual({ fire: 6 });
  });

  it('bumpStandingStonePick keeps unrelated boons untouched', () => {
    writeSave({ ...createDefaultSave(), standingStonesPicked: { mending: 2, haste: 1 } });
    bumpStandingStonePick('fire');
    expect(loadSave().standingStonesPicked).toEqual({ mending: 2, haste: 1, fire: 1 });
  });

  it('bumpReliquaryCurioPick starts a new counter from 0', () => {
    bumpReliquaryCurioPick('echoing_reed');
    expect(loadSave().reliquaryCuriosPicked).toEqual({ echoing_reed: 1 });
  });

  it('bumpReliquaryCurioPick increments existing counters', () => {
    writeSave({ ...createDefaultSave(), reliquaryCuriosPicked: { flint_charm: 2 } });
    bumpReliquaryCurioPick('flint_charm');
    bumpReliquaryCurioPick('flint_charm');
    expect(loadSave().reliquaryCuriosPicked).toEqual({ flint_charm: 4 });
  });

  it('bumpReliquaryCurioPick keeps unrelated curios untouched', () => {
    writeSave({ ...createDefaultSave(), reliquaryCuriosPicked: { cairn_moss: 3, echoing_reed: 1 } });
    bumpReliquaryCurioPick('flint_charm');
    expect(loadSave().reliquaryCuriosPicked).toEqual({ cairn_moss: 3, echoing_reed: 1, flint_charm: 1 });
  });

  it('bumpAncestralEchoesTouched starts a new counter from 0', () => {
    bumpAncestralEchoesTouched();
    expect(loadSave().ancestralEchoesTouched).toBe(1);
  });

  it('bumpAncestralEchoesTouched increments existing counters', () => {
    writeSave({ ...createDefaultSave(), ancestralEchoesTouched: 5 });
    bumpAncestralEchoesTouched();
    bumpAncestralEchoesTouched();
    expect(loadSave().ancestralEchoesTouched).toBe(7);
  });

  it('bumpCeilidhPulsesLifetime starts a new counter from 0', () => {
    bumpCeilidhPulsesLifetime();
    expect(loadSave().ceilidhPulsesLifetime).toBe(1);
  });

  it('bumpCeilidhPulsesLifetime increments existing counters', () => {
    writeSave({ ...createDefaultSave(), ceilidhPulsesLifetime: 14 });
    bumpCeilidhPulsesLifetime();
    expect(loadSave().ceilidhPulsesLifetime).toBe(15);
  });

  it('recordPostBellBest writes a new record when secPast > current', () => {
    writeSave({ ...createDefaultSave(), bestEndlessSeconds: 30 });
    recordPostBellBest(45);
    expect(loadSave().bestEndlessSeconds).toBe(45);
  });

  it('recordPostBellBest is a no-op when secPast <= current', () => {
    writeSave({ ...createDefaultSave(), bestEndlessSeconds: 60 });
    recordPostBellBest(45);
    expect(loadSave().bestEndlessSeconds).toBe(60);
    recordPostBellBest(60);
    expect(loadSave().bestEndlessSeconds).toBe(60);
  });

  it('recordPostBellBest is a no-op for secPast <= 0', () => {
    writeSave({ ...createDefaultSave(), bestEndlessSeconds: 30 });
    recordPostBellBest(0);
    recordPostBellBest(-5);
    expect(loadSave().bestEndlessSeconds).toBe(30);
  });

  it('recordPostBellBest writes 1 from a fresh save', () => {
    recordPostBellBest(1);
    expect(loadSave().bestEndlessSeconds).toBe(1);
  });

  it('recordLastDeath persists rounded coordinates + timestamp', () => {
    recordLastDeath(123.4, 456.9, 1_000_000);
    expect(loadSave().lastDeath).toEqual({ x: 123, y: 457, ts: 1_000_000 });
  });

  it('recordLastDeath floors fractional now()', () => {
    recordLastDeath(0, 0, 7.99);
    expect(loadSave().lastDeath?.ts).toBe(7);
  });

  it('recordLastDeath overwrites a prior record', () => {
    recordLastDeath(10, 20, 100);
    recordLastDeath(30, 40, 200);
    expect(loadSave().lastDeath).toEqual({ x: 30, y: 40, ts: 200 });
  });

  it('recordIronmoorBest writes the first record from a fresh save', () => {
    recordIronmoorBest(900);
    expect(loadSave().bestIronmoorSeconds).toBe(900);
  });

  it('recordIronmoorBest only writes a faster time (lower is better)', () => {
    writeSave({ ...createDefaultSave(), bestIronmoorSeconds: 800 });
    recordIronmoorBest(900);
    expect(loadSave().bestIronmoorSeconds).toBe(800);
    recordIronmoorBest(700);
    expect(loadSave().bestIronmoorSeconds).toBe(700);
  });

  it('recordIronmoorBest no-ops for non-positive time', () => {
    writeSave({ ...createDefaultSave(), bestIronmoorSeconds: 800 });
    recordIronmoorBest(0);
    recordIronmoorBest(-5);
    expect(loadSave().bestIronmoorSeconds).toBe(800);
  });

  it('wipeIronmoorHistoryInPlace returns false when nothing is wiped', () => {
    writeSave(createDefaultSave());
    expect(wipeIronmoorHistoryInPlace()).toBe(false);
  });

  it('wipeIronmoorHistoryInPlace removes ironmoor rows and returns true', () => {
    const seedSave = createDefaultSave();
    writeSave({
      ...seedSave,
      runHistory: [
        { timestamp: 1, isVictory: true, timeSurvivedSec: 900, enemiesKilled: 200,
          weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
          ironmoor: true } as never,
        { timestamp: 2, isVictory: false, timeSurvivedSec: 60, enemiesKilled: 10,
          weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 1, goldEarned: 5,
          } as never,
      ],
    });
    expect(wipeIronmoorHistoryInPlace()).toBe(true);
    expect(loadSave().runHistory).toHaveLength(1);
    expect(loadSave().runHistory[0]?.ironmoor).toBeUndefined();
  });

  it('consumeLastDeath clears the persisted death record', () => {
    writeSave({
      ...createDefaultSave(),
      lastDeath: { x: 100, y: 200, ts: 1_000_000 },
    });
    consumeLastDeath();
    expect(loadSave().lastDeath).toBeUndefined();
  });

  it('consumeLastDeath is a no-op when no record exists', () => {
    writeSave(createDefaultSave());
    expect(() => consumeLastDeath()).not.toThrow();
    expect(loadSave().lastDeath).toBeUndefined();
  });

  it('wipeIronmoorHistoryInPlace preserves bestIronmoorSeconds (separate leaderboard)', () => {
    writeSave({
      ...createDefaultSave(),
      bestIronmoorSeconds: 700,
      runHistory: [
        { timestamp: 1, isVictory: true, timeSurvivedSec: 700, enemiesKilled: 200,
          weaponKeys: ['thistle_shot'], variantKey: 'classic', bestCombo: 5, goldEarned: 50,
          ironmoor: true } as never,
      ],
    });
    wipeIronmoorHistoryInPlace();
    expect(loadSave().bestIronmoorSeconds).toBe(700);
  });
});

describe('RunHistoryEntry name backfill', () => {
  it('preserves saved names', () => {
    const loaded = migrateSave({
      runHistory: [
        { isVictory: true, seed: 'a', timeSurvivedSec: 100, enemiesKilled: 50, variantKey: 'classic', timestamp: 1, level: 1, bossKills: 0, goldEarned: 0, bestCombo: 0, weaponKeys: [], name: 'Moira of the Moor' },
      ],
    });
    expect(loaded.runHistory?.[0]?.name).toBe('Moira of the Moor');
  });

  it('backfills missing names deterministically from seed', () => {
    const entry = { isVictory: false, seed: 'seed-xyz', timeSurvivedSec: 60, enemiesKilled: 20, variantKey: 'classic', timestamp: 1, level: 1, bossKills: 0, goldEarned: 0, bestCombo: 0, weaponKeys: [] };
    const a = migrateSave({ runHistory: [entry] });
    const b = migrateSave({ runHistory: [entry] });
    expect(a.runHistory?.[0]?.name).toBeTruthy();
    expect(a.runHistory?.[0]?.name).toBe(b.runHistory?.[0]?.name);
  });

  it('backfill tolerates entries without a seed', () => {
    const loaded = migrateSave({
      runHistory: [
        { isVictory: false, timeSurvivedSec: 90, enemiesKilled: 40, variantKey: 'classic', timestamp: 1, level: 1, bossKills: 0, goldEarned: 0, bestCombo: 0, weaponKeys: [] },
      ],
    });
    expect(loaded.runHistory?.[0]?.name).toBeTruthy();
  });

  it('backfills different entries with different names (almost always)', () => {
    const loaded = migrateSave({
      runHistory: [
        { isVictory: false, seed: 'seed-a', timeSurvivedSec: 60, enemiesKilled: 20, variantKey: 'classic', timestamp: 1, level: 1, bossKills: 0, goldEarned: 0, bestCombo: 0, weaponKeys: [] },
        { isVictory: false, seed: 'seed-b', timeSurvivedSec: 120, enemiesKilled: 35, variantKey: 'classic', timestamp: 2, level: 1, bossKills: 0, goldEarned: 0, bestCombo: 0, weaponKeys: [] },
        { isVictory: true, seed: 'seed-c', timeSurvivedSec: 400, enemiesKilled: 200, variantKey: 'classic', timestamp: 3, level: 1, bossKills: 0, goldEarned: 0, bestCombo: 0, weaponKeys: [] },
      ],
    });
    const names = loaded.runHistory?.map((r) => r.name) ?? [];
    expect(names.every((n) => n && n.length > 0)).toBe(true);
  });
});
