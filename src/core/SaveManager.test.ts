import { describe, expect, it } from 'vitest';
import { SaveManager, type IRunState, type StorageLike } from './SaveManager';
import { MemoryStorage } from '../test/MemoryStorage';

class ThrowingStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(_key: string, _value: string) { throw new Error('quota exceeded'); }
  removeItem(key: string) { this.m.delete(key); }
}

const defaultV7 = {
  saveVersion: 7 as const,
  totalKills: 0,
  totalKillsSpent: 0,
  unlockedWeapons: [] as string[],
  unlockedUpgrades: [] as string[],
  activeRun: null,
  unlockedAchievements: [] as string[],
  hasCompletedTutorial: false,
  hasSeenDriftTutorial: false,
  runHistory: [] as import('./SaveManager').RunHistoryEntry[],
};

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
});

describe('SaveManager', () => {
  it('saves and loads persisted meta progression (v7)', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });

    mgr.save({
      ...defaultV7,
      totalKills: 42,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
      unlockedAchievements: ['ach_kills_1000'],
      hasCompletedTutorial: true,
    });
    const loaded = mgr.load();

    expect(loaded.saveVersion).toBe(7);
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
    expect(mgr.load()).toEqual(defaultV7);
  });

  it('migrates v1 JSON to v7 with defaults', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 1, totalKills: 5, unlockedWeapons: ['thistle_shot'] }));
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      ...defaultV7,
      totalKills: 5,
      unlockedWeapons: ['thistle_shot'],
    });
  });

  it('migrates v2 JSON to v7 preserving upgrades', () => {
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
      ...defaultV7,
      totalKills: 3,
      unlockedUpgrades: ['speed_tier_1'],
    });
  });

  it('migrates v3 JSON to v7 preserving activeRun', () => {
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
      ...defaultV7,
      totalKills: 2,
    });
  });

  it('migrates v4 JSON to v7 preserving hasCompletedTutorial when present', () => {
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
      ...defaultV7,
      unlockedWeapons: ['ok'],
    });
  });

  it('saveActiveRun persists coerced mid-run snapshot', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.save({ ...defaultV7, totalKills: 1 });
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
  });

  it('treats malformed spawnedBossKeys as undefined instead of empty list', () => {
    const storage = new MemoryStorage();
    storage.setItem(
      'k',
      JSON.stringify({
        ...defaultV7,
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
        ...defaultV7,
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
    expect(() => mgr.save({ ...defaultV7, totalKills: 10 })).not.toThrow();
    expect(() => mgr.saveActiveRun(sampleRun())).not.toThrow();
    expect(() => mgr.clearActiveRun()).not.toThrow();
  });

  it('persists new achievement IDs and meta upgrade keys correctly', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.save({
      ...defaultV7,
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
