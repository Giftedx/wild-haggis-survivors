import { describe, expect, it, vi } from 'vitest';
import { SaveManager, type IRunState, type StorageLike } from './SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';
import { type FallenCairn } from '../utils/save/fallenCairns';

class ThrowingStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(_key: string, _value: string) { throw new Error('quota exceeded'); }
  removeItem(key: string) { this.m.delete(key); }
}

const defaultV12 = {
  saveVersion: 12 as const,
  totalKills: 0,
  totalKillsSpent: 0,
  unlockedWeapons: [] as string[],
  unlockedUpgrades: [] as string[],
  activeRun: null,
  unlockedAchievements: [] as string[],
  hasCompletedTutorial: false,
  hasSeenDriftTutorial: false,
  hasSeenEliteAffixTip: false,
  hasSeenMoorMomentTip: false,
  hasSeenCeilidhChainTip: false,
  hasSeenStandingStonesTip: false,
  hasSeenAncestralEchoTip: false,
  moorMomentsLifetime: 0,
  runHistory: [] as import('./SaveManager').RunHistoryEntry[],
  dailyChallenge: null as import('./SaveManager').DailyChallengeState | null,
  codexCulledKeys: [] as string[],
  fallenCairns: [] as FallenCairn[],
  oldDroverRevealedCount: 0,
  friendChallenges: [] as import('../utils/save/friendChallenges').FriendChallengeRecord[],
};

/** Aliases kept for clarity in migration tests that seed earlier blobs. */
const defaultV9 = defaultV12;

const sampleRun = (): IRunState => ({
  gameTimeSec: 600,
  playerX: 120,
  playerY: 340,
  playerHealth: 42,
  playerMaxHp: 80,
  currentXp: 777,
  currentLevel: 9,
  acquiredWeapons: [
    { key: 'thistle_shot', level: 3, evolved: false, evolutionKey: '' },
    { key: 'caber_toss', level: 2, evolved: false, evolutionKey: '' },
  ],
  selectedVariantKey: 'classic',
  killCount: 500,
  ownedPassives: ['kilt'],
  evolvedWeaponKeys: [],
  bossKillCount: 2,
  bossGoldEarned: 140,
  coinGoldEarned: 37,
  revivalAvailable: false,
  bestCombo: 28,
  comboCount: 12,
  comboTimerMs: 900,
  dashCharges: 1,
  dashCooldownMs: 900,
  weaponDamage: { thistle_shot: 1200, caber_toss: 450 },
  spawnedBossKeys: ['tour_bus', 'taxman'],
  shieldCooldownMs: 1800,
  heldRelicKeys: ['sporran_of_holding', 'bronze_clasp'],
  ownedRuneIds: ['peat_rune', 'thirst_rune'],
  cairnStackCount: 2,
  cairnSpawnedCount: 2,
  cairnNextSpawnAtSec: 540,
});

describe('SaveManager', () => {
  it('saves and loads persisted meta progression (v10)', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });

    mgr.save({
      ...defaultV9,
      totalKills: 42,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
      unlockedAchievements: ['ach_kills_1000'],
      hasCompletedTutorial: true,
    });
    const loaded = mgr.load();

    expect(loaded.saveVersion).toBe(12);
    expect(loaded.totalKills).toBe(42);
    expect(loaded.unlockedWeapons).toEqual(['thistle_shot']);
    expect(loaded.unlockedUpgrades).toEqual(['speed_tier_1']);
    expect(loaded.activeRun).toBeNull();
    expect(loaded.unlockedAchievements).toEqual(['ach_kills_1000']);
    expect(loaded.hasCompletedTutorial).toBe(true);
  });

  it('recovers from corrupted JSON without throwing', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{ definitely not json');

    const mgr = new SaveManager({ storage, key: 'k' });
    expect(() => mgr.load()).not.toThrow();
    expect(mgr.load()).toEqual(defaultV9);
  });

  it('warns and coerces saves from a newer version', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({
      saveVersion: 99,
      totalKills: 5,
      unlockedAchievements: ['ach_first_victory'],
    }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      const loaded = new SaveManager({ storage, key: 'k' }).load();

      expect(warn).toHaveBeenCalledWith('Save version 99 is newer than supported (12). This client can lose fields.');
      expect(loaded.saveVersion).toBe(12);
      expect(loaded.totalKills).toBe(5);
      expect(loaded.unlockedAchievements).toEqual(['ach_first_victory']);
    } finally {
      warn.mockRestore();
    }
  });

  it('migrates v1 JSON to current with defaults', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 1, totalKills: 5, unlockedWeapons: ['thistle_shot'] }));
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      ...defaultV9,
      totalKills: 5,
      unlockedWeapons: ['thistle_shot'],
    });
  });

  it('migrates v8 JSON without codex field to v10 with empty codex and cairns', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        saveVersion: 8,
        totalKills: 1,
        totalKillsSpent: 0,
        unlockedWeapons: [],
        unlockedUpgrades: [],
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: false,
        hasSeenDriftTutorial: false,
        hasSeenEliteAffixTip: false,
        hasSeenMoorMomentTip: false,
        hasSeenCeilidhChainTip: false,
        hasSeenStandingStonesTip: false,
        hasSeenAncestralEchoTip: false,
        moorMomentsLifetime: 0,
        runHistory: [],
        dailyChallenge: null,
      })
    );
    const mgr = new SaveManager({ storage, key: 'k' });
    const loaded = mgr.load();
    expect(loaded.saveVersion).toBe(12);
    expect(loaded.codexCulledKeys).toEqual([]);
    expect(loaded.fallenCairns).toEqual([]);
    expect(loaded.oldDroverRevealedCount).toBe(0);
  });

  it('migrates v2 JSON to current preserving upgrades', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        saveVersion: 2,
        totalKills: 3,
        unlockedWeapons: [],
        unlockedUpgrades: ['speed_tier_1'],
      })
    );
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      ...defaultV9,
      totalKills: 3,
      unlockedUpgrades: ['speed_tier_1'],
    });
  });

  it('migrates v3 JSON to current preserving activeRun', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        saveVersion: 3,
        totalKills: 2,
        unlockedWeapons: [],
        unlockedUpgrades: [],
        activeRun: null,
      })
    );
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      ...defaultV9,
      totalKills: 2,
    });
  });

  it('migrates v4 JSON to current preserving hasCompletedTutorial when present', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        saveVersion: 4,
        totalKills: 0,
        unlockedWeapons: [],
        unlockedUpgrades: [],
        activeRun: null,
        unlockedAchievements: [],
        hasCompletedTutorial: true,
      })
    );
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load().hasCompletedTutorial).toBe(true);
  });

  it('coerces malformed fields safely', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 4, totalKills: 'nope', unlockedWeapons: [123, 'ok'] }));

    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      ...defaultV9,
      unlockedWeapons: ['ok'],
    });
  });

  it('saveActiveRun persists coerced mid-run snapshot', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.save({ ...defaultV9, totalKills: 1 });
    mgr.saveActiveRun(sampleRun());
    const loaded = mgr.load();
    expect(loaded.activeRun).not.toBeNull();
    expect(loaded.activeRun!.gameTimeSec).toBe(600);
    expect(loaded.activeRun!.currentLevel).toBe(9);
    expect(loaded.activeRun!.acquiredWeapons).toHaveLength(2);
    expect(loaded.activeRun!.bossKillCount).toBe(2);
    expect(loaded.activeRun!.bossGoldEarned).toBe(140);
    expect(loaded.activeRun!.coinGoldEarned).toBe(37);
    expect(loaded.activeRun!.revivalAvailable).toBe(false);
    expect(loaded.activeRun!.bestCombo).toBe(28);
    expect(loaded.activeRun!.comboCount).toBe(12);
    expect(loaded.activeRun!.comboTimerMs).toBe(900);
    expect(loaded.activeRun!.dashCharges).toBe(1);
    expect(loaded.activeRun!.dashCooldownMs).toBe(900);
    expect(loaded.activeRun!.weaponDamage).toEqual({ thistle_shot: 1200, caber_toss: 450 });
    expect(loaded.activeRun!.spawnedBossKeys).toEqual(['tour_bus', 'taxman']);
    expect(loaded.activeRun!.shieldCooldownMs).toBe(1800);
    expect(loaded.activeRun!.heldRelicKeys).toEqual(['sporran_of_holding', 'bronze_clasp']);
    expect(loaded.activeRun!.ownedRuneIds).toEqual(['peat_rune', 'thirst_rune']);
    expect(loaded.activeRun!.cairnStackCount).toBe(2);
    expect(loaded.activeRun!.cairnSpawnedCount).toBe(2);
    expect(loaded.activeRun!.cairnNextSpawnAtSec).toBe(540);
  });

  it('treats malformed spawnedBossKeys as undefined instead of empty list', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        ...defaultV9,
        activeRun: {
          ...sampleRun(),
          spawnedBossKeys: null,
        },
      })
    );
    const mgr = new SaveManager({ storage, key: 'k' });
    const loaded = mgr.load();
    expect(loaded.activeRun).not.toBeNull();
    expect(loaded.activeRun!.spawnedBossKeys).toBeUndefined();
  });

  it('drops malformed optional resume state instead of coercing to exploitable defaults', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        ...defaultV9,
        activeRun: {
          ...sampleRun(),
          revivalAvailable: 'yes please',
          bestCombo: -3,
          comboCount: -1,
          comboTimerMs: 'soon',
          dashCharges: 'full',
          dashCooldownMs: null,
          weaponDamage: { thistle_shot: 1200, bad: -5, nope: 'x' },
          shieldCooldownMs: null,
          heldRelicKeys: [42, 'bronze_clasp', null],
          ownedRuneIds: ['peat_rune', 7, null],
          cairnStackCount: -1,
          cairnSpawnedCount: 'two',
          cairnNextSpawnAtSec: Number.NaN,
        },
      })
    );

    const mgr = new SaveManager({ storage, key: 'k' });
    const loaded = mgr.load();
    expect(loaded.activeRun).not.toBeNull();
    expect(loaded.activeRun!.revivalAvailable).toBeUndefined();
    expect(loaded.activeRun!.bestCombo).toBeUndefined();
    expect(loaded.activeRun!.comboCount).toBeUndefined();
    expect(loaded.activeRun!.comboTimerMs).toBeUndefined();
    expect(loaded.activeRun!.dashCharges).toBeUndefined();
    expect(loaded.activeRun!.dashCooldownMs).toBeUndefined();
    expect(loaded.activeRun!.weaponDamage).toEqual({ thistle_shot: 1200 });
    expect(loaded.activeRun!.shieldCooldownMs).toBeUndefined();
    expect(loaded.activeRun!.heldRelicKeys).toEqual(['bronze_clasp']);
    expect(loaded.activeRun!.ownedRuneIds).toEqual(['peat_rune']);
    expect(loaded.activeRun!.cairnStackCount).toBeUndefined();
    expect(loaded.activeRun!.cairnSpawnedCount).toBeUndefined();
    expect(loaded.activeRun!.cairnNextSpawnAtSec).toBeUndefined();
  });

  it('clearActiveRun removes suspended run', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.saveActiveRun(sampleRun());
    mgr.clearActiveRun();
    expect(mgr.load().activeRun).toBeNull();
  });

  it('swallows storage write failures without throwing', () => {
    const storage = new ThrowingStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(() => mgr.save({ ...defaultV9, totalKills: 10 })).not.toThrow();
    expect(() => mgr.saveActiveRun(sampleRun())).not.toThrow();
    expect(() => mgr.clearActiveRun()).not.toThrow();
  });

  it('persists new achievement IDs and meta upgrade keys correctly', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.save({
      ...defaultV9,
      totalKills: 6000,
      unlockedAchievements: [
        'ach_kills_1000', 'ach_kills_5000', 'ach_survive_5m', 'ach_survive_10m',
        'ach_full_run', 'ach_defeat_taxman', 'ach_first_victory', 'ach_first_evolution',
        'ach_all_bosses',
      ],
      unlockedUpgrades: [
        'speed_tier_1', 'speed_tier_2', 'health_tier_1', 'health_tier_2',
        'damage_tier_1', 'damage_tier_2', 'pickup_tier_1', 'regen_tier_1',
        'crit_tier_1', 'cooldown_tier_1', 'xp_tier_1', 'armor_tier_1', 'dash_tier_1',
      ],
    });

    const loaded = mgr.load();
    expect(loaded.unlockedAchievements).toHaveLength(9);
    expect(loaded.unlockedAchievements).toContain('ach_first_evolution');
    expect(loaded.unlockedAchievements).toContain('ach_all_bosses');
    expect(loaded.unlockedUpgrades).toHaveLength(13);
    expect(loaded.unlockedUpgrades).toContain('dash_tier_1');
    expect(loaded.unlockedUpgrades).toContain('armor_tier_1');
    expect(loaded.totalKills).toBe(6000);
  });
});

describe('SaveManager v9 → v10 migration', () => {
  it('initialises fallenCairns + oldDroverRevealedCount on v9 → v10', () => {
    const v9Blob = {
      saveVersion: 9,
      totalKills: 100,
      totalKillsSpent: 50,
      unlockedWeapons: ['bagpipes'],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: true,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 3,
      runHistory: [],
      dailyChallenge: null,
      codexCulledKeys: ['gordon'],
    };
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    store.set('whs_meta_save', JSON.stringify(v9Blob));
    const loaded = sm.load();
    expect(loaded.saveVersion).toBe(12);
    expect(loaded.fallenCairns).toEqual([]);
    expect(loaded.oldDroverRevealedCount).toBe(0);
    expect(loaded.totalKills).toBe(100);
    expect(loaded.codexCulledKeys).toEqual(['gordon']);
  });

  it('preserves fallenCairns array on v10 → v10 round-trip', () => {
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    const cairn: FallenCairn = {
      x: 1200,
      y: 800,
      cause: 'enemy_contact',
      variantKey: 'classic',
      timeSurvivedMs: 60_000,
      inheritedStat: 'damage',
      savedAt: 1_700_000_000_000,
    };
    const v10Blob = {
      ...sm.load(),
      fallenCairns: [cairn],
      oldDroverRevealedCount: 5,
    };
    sm.save(v10Blob);
    const loaded = sm.load();
    expect(loaded.fallenCairns).toHaveLength(1);
    expect(loaded.fallenCairns[0]).toEqual(cairn);
    expect(loaded.oldDroverRevealedCount).toBe(5);
  });

  it('coerces oldDroverRevealedCount to 0..25', () => {
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    const v10BlobOver = {
      saveVersion: 10,
      totalKills: 0,
      totalKillsSpent: 0,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: false,
      hasSeenDriftTutorial: false,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 0,
      runHistory: [],
      dailyChallenge: null,
      codexCulledKeys: [],
      fallenCairns: [],
      oldDroverRevealedCount: 999,
    };
    store.set('whs_meta_save', JSON.stringify(v10BlobOver));
    const loaded = sm.load();
    expect(loaded.oldDroverRevealedCount).toBe(25);
  });

  it('clamps negative oldDroverRevealedCount to 0', () => {
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    const v10Blob = {
      saveVersion: 10,
      totalKills: 0,
      totalKillsSpent: 0,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: false,
      hasSeenDriftTutorial: false,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 0,
      runHistory: [],
      dailyChallenge: null,
      codexCulledKeys: [],
      fallenCairns: [],
      oldDroverRevealedCount: -5,
    };
    store.set('whs_meta_save', JSON.stringify(v10Blob));
    const loaded = sm.load();
    expect(loaded.oldDroverRevealedCount).toBe(0);
  });
});

describe('SaveManager v10 → v11 migration', () => {
  it('migrates a v10 blob to v11 preserving cairns', () => {
    const v10Cairn = {
      x: 100, y: 200, cause: 'enemy_contact', variantKey: 'classic',
      timeSurvivedMs: 60_000, inheritedStat: 'damage', savedAt: 42,
    };
    const v10Blob = { ...defaultV9, saveVersion: 10, fallenCairns: [v10Cairn] };
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    store.set('whs_meta_save', JSON.stringify(v10Blob));
    const loaded = sm.load();
    expect(loaded.saveVersion).toBe(12);
    expect(loaded.fallenCairns).toHaveLength(1);
    expect(loaded.fallenCairns[0].savedAt).toBe(42);
    expect(loaded.fallenCairns[0].wreathedAt).toBeUndefined();
    expect(loaded.fallenCairns[0].extinguishedAt).toBeUndefined();
  });

  it('round-trips v11 wreathedAt + extinguishedAt fields', () => {
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    const cairnWreathed: FallenCairn = {
      x: 0, y: 0, cause: 'enemy_contact', variantKey: 'classic',
      timeSurvivedMs: 1, inheritedStat: 'damage', savedAt: 1,
      wreathedAt: 9999,
    };
    const cairnExtinguished: FallenCairn = {
      x: 0, y: 0, cause: 'enemy_contact', variantKey: 'classic',
      timeSurvivedMs: 1, inheritedStat: 'damage', savedAt: 2,
      extinguishedAt: 8888,
    };
    const blob = { ...sm.load(), fallenCairns: [cairnWreathed, cairnExtinguished] };
    sm.save(blob);
    const loaded = sm.load();
    expect(loaded.fallenCairns[0].wreathedAt).toBe(9999);
    expect(loaded.fallenCairns[1].extinguishedAt).toBe(8888);
  });
});

describe('SaveManager mark methods', () => {
  it('markCairnsWreathed routes through markWreathed and persists', () => {
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    const cairn: FallenCairn = {
      x: 0, y: 0, cause: 'enemy_contact', variantKey: 'classic',
      timeSurvivedMs: 1, inheritedStat: 'damage', savedAt: 42,
    };
    sm.recordFallenCairn(cairn);
    sm.markCairnsWreathed([42], 12345);
    expect(sm.getFallenCairns()[0].wreathedAt).toBe(12345);
  });

  it('markCairnsExtinguished respects wreath precedence', () => {
    const store = new Map<string, string>();
    const sm = new SaveManager({
      key: 'whs_meta_save',
      storage: {
        getItem: (k) => store.get(k) ?? null,
        setItem: (k, v) => { store.set(k, v); },
        removeItem: (k) => { store.delete(k); },
      },
    });
    const cairn: FallenCairn = {
      x: 0, y: 0, cause: 'enemy_contact', variantKey: 'classic',
      timeSurvivedMs: 1, inheritedStat: 'damage', savedAt: 42,
    };
    sm.recordFallenCairn(cairn);
    sm.markCairnsWreathed([42], 100);
    sm.markCairnsExtinguished([42], 200);
    expect(sm.getFallenCairns()[0].wreathedAt).toBe(100);
    expect(sm.getFallenCairns()[0].extinguishedAt).toBeUndefined();
  });
});
