import { describe, expect, it, beforeEach } from 'vitest';
import {
  SaveManager,
  type StorageLike,
} from './SaveManager';
import {
  SettingsManager,
  SETTINGS_STORAGE_KEY,
  resetSettingsManagerSingletonForTests,
} from './SettingsManager';

class MemoryStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(key: string, value: string) { this.m.set(key, value); }
  removeItem(key: string) { this.m.delete(key); }
}

describe('SettingsManager air-gap', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('uses a different storage key than SaveManager', () => {
    const mem = new MemoryStorage();
    const meta = new SaveManager({ storage: mem, key: 'whs_meta_save' });
    const settings = new SettingsManager({ storage: mem, key: SETTINGS_STORAGE_KEY });

    meta.save({
      saveVersion: 4,
      totalKills: 99,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
    });
    settings.save({
      settingsVersion: 1,
      masterVolume: 0.5,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      screenShake: false,
      damageNumbers: true,
      reduceParticles: true,
    });

    meta.reset();
    expect(meta.load().totalKills).toBe(0);

    const st = settings.load();
    expect(st.masterVolume).toBe(0.5);
    expect(st.sfxVolume).toBe(0.8);
    expect(st.screenShake).toBe(false);
  });

  it('clearing meta storage does not remove settings', () => {
    const mem = new MemoryStorage();
    const meta = new SaveManager({ storage: mem, key: 'm' });
    const settings = new SettingsManager({ storage: mem, key: 's' });

    meta.save({
      saveVersion: 4,
      totalKills: 10,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
    });
    settings.save({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 0,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: false,
      reduceParticles: false,
    });

    meta.reset();
    settings.save(settings.load());

    expect(settings.load().damageNumbers).toBe(false);
  });

  it('resetting settings does not clear meta save', () => {
    const mem = new MemoryStorage();
    const meta = new SaveManager({ storage: mem, key: 'm' });
    const settings = new SettingsManager({ storage: mem, key: 's' });

    meta.save({
      saveVersion: 4,
      totalKills: 77,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
      activeRun: null,
      unlockedAchievements: ['ach_kills_1000'],
    });
    settings.save({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
    });

    settings.reset();
    expect(settings.load().masterVolume).toBe(1);

    const m = meta.load();
    expect(m.totalKills).toBe(77);
    expect(m.unlockedAchievements).toContain('ach_kills_1000');
  });
});
