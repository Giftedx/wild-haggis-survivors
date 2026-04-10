import { describe, expect, it } from 'vitest';
import { SaveManager, type IRunState, type StorageLike } from './SaveManager';

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(key: string, value: string) { this.m.set(key, value); }
  removeItem(key: string) { this.m.delete(key); }
}

const defaultV3 = {
  saveVersion: 3 as const,
  totalKills: 0,
  unlockedWeapons: [] as string[],
  unlockedUpgrades: [] as string[],
  activeRun: null,
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
});

describe('SaveManager', () => {
  it('saves and loads persisted meta progression (v3)', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });

    mgr.save({
      saveVersion: 3,
      totalKills: 42,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
      activeRun: null,
    });
    const loaded = mgr.load();

    expect(loaded.saveVersion).toBe(3);
    expect(loaded.totalKills).toBe(42);
    expect(loaded.unlockedWeapons).toEqual(['thistle_shot']);
    expect(loaded.unlockedUpgrades).toEqual(['speed_tier_1']);
    expect(loaded.activeRun).toBeNull();
  });

  it('recovers from corrupted JSON without throwing', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{ definitely not json');

    const mgr = new SaveManager({ storage, key: 'k' });
    expect(() => mgr.load()).not.toThrow();
    expect(mgr.load()).toEqual(defaultV3);
  });

  it('migrates v1 JSON to v3 with defaults', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 1, totalKills: 5, unlockedWeapons: ['thistle_shot'] }));
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      saveVersion: 3,
      totalKills: 5,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: [],
      activeRun: null,
    });
  });

  it('migrates v2 JSON to v3 preserving upgrades', () => {
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
      saveVersion: 3,
      totalKills: 3,
      unlockedWeapons: [],
      unlockedUpgrades: ['speed_tier_1'],
      activeRun: null,
    });
  });

  it('coerces malformed fields safely', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 3, totalKills: 'nope', unlockedWeapons: [123, 'ok'] }));

    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      saveVersion: 3,
      totalKills: 0,
      unlockedWeapons: ['ok'],
      unlockedUpgrades: [],
      activeRun: null,
    });
  });

  it('saveActiveRun persists coerced mid-run snapshot', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.save({ ...defaultV3, totalKills: 1 });
    mgr.saveActiveRun(sampleRun());
    const loaded = mgr.load();
    expect(loaded.activeRun).not.toBeNull();
    expect(loaded.activeRun!.gameTimeSec).toBe(600);
    expect(loaded.activeRun!.currentLevel).toBe(9);
    expect(loaded.activeRun!.acquiredWeapons).toHaveLength(2);
  });

  it('clearActiveRun removes suspended run', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });
    mgr.saveActiveRun(sampleRun());
    mgr.clearActiveRun();
    expect(mgr.load().activeRun).toBeNull();
  });
});
