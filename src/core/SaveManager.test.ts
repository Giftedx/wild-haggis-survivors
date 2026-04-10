import { describe, expect, it } from 'vitest';
import { SaveManager, type StorageLike } from './SaveManager';

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(key: string, value: string) { this.m.set(key, value); }
  removeItem(key: string) { this.m.delete(key); }
}

describe('SaveManager', () => {
  it('saves and loads persisted meta progression', () => {
    const storage = new MemoryStorage();
    const mgr = new SaveManager({ storage, key: 'k' });

    mgr.save({
      saveVersion: 2,
      totalKills: 42,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
    });
    const loaded = mgr.load();

    expect(loaded.saveVersion).toBe(2);
    expect(loaded.totalKills).toBe(42);
    expect(loaded.unlockedWeapons).toEqual(['thistle_shot']);
    expect(loaded.unlockedUpgrades).toEqual(['speed_tier_1']);
  });

  it('recovers from corrupted JSON without throwing', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', '{ definitely not json');

    const mgr = new SaveManager({ storage, key: 'k' });
    expect(() => mgr.load()).not.toThrow();
    expect(mgr.load()).toEqual({ saveVersion: 2, totalKills: 0, unlockedWeapons: [], unlockedUpgrades: [] });
  });

  it('migrates v1 JSON to v2 with unlockedUpgrades default', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 1, totalKills: 5, unlockedWeapons: ['thistle_shot'] }));
    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({
      saveVersion: 2,
      totalKills: 5,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: [],
    });
  });

  it('coerces malformed fields safely', () => {
    const storage = new MemoryStorage();
    storage.setItem('k', JSON.stringify({ saveVersion: 1, totalKills: 'nope', unlockedWeapons: [123, 'ok'] }));

    const mgr = new SaveManager({ storage, key: 'k' });
    expect(mgr.load()).toEqual({ saveVersion: 2, totalKills: 0, unlockedWeapons: ['ok'], unlockedUpgrades: [] });
  });
});
