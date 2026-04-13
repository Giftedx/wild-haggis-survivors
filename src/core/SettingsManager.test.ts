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
import { MemoryStorage } from '../test/MemoryStorage';

class ThrowingStorage implements StorageLike {
  private m = new Map<string, string>();
  getItem(key: string) { return this.m.get(key) ?? null; }
  setItem(_key: string, _value: string) { throw new Error('blocked storage'); }
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
      saveVersion: 8,
      totalKillsSpent: 0,
      dailyChallenge: null,
      totalKills: 99,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: false,
      hasSeenDriftTutorial: false,
      runHistory: [],
    });
    settings.save({
      settingsVersion: 1,
      masterVolume: 0.5,
      sfxVolume: 0.8,
      musicVolume: 0.4,
      screenShake: false,
      damageNumbers: true,
      reduceParticles: true,
      uiScale: 1.1,
      highContrastUi: true,
      motionScale: 0.5,
      captionsEnabled: true,
      banterFrequency: 'normal',
      telemetryOptIn: false,
    });

    meta.reset();
    expect(meta.load().totalKills).toBe(0);

    const st = settings.load();
    expect(st.masterVolume).toBe(0.5);
    expect(st.sfxVolume).toBe(0.8);
    expect(st.screenShake).toBe(false);
    expect(st.uiScale).toBe(1.1);
    expect(st.highContrastUi).toBe(true);
  });

  it('clearing meta storage does not remove settings', () => {
    const mem = new MemoryStorage();
    const meta = new SaveManager({ storage: mem, key: 'm' });
    const settings = new SettingsManager({ storage: mem, key: 's' });

    meta.save({
      saveVersion: 8,
      totalKillsSpent: 0,
      dailyChallenge: null,
      totalKills: 10,
      unlockedWeapons: [],
      unlockedUpgrades: [],
      activeRun: null,
      unlockedAchievements: [],
      hasCompletedTutorial: false,
      hasSeenDriftTutorial: false,
      runHistory: [],
    });
    settings.save({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 0,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: false,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
      motionScale: 1,
      captionsEnabled: false,
      banterFrequency: 'normal',
      telemetryOptIn: false,
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
      saveVersion: 8,
      totalKillsSpent: 0,
      dailyChallenge: null,
      totalKills: 77,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
      activeRun: null,
      unlockedAchievements: ['ach_kills_1000'],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: false,
      runHistory: [],
    });
    settings.save({
      settingsVersion: 1,
      masterVolume: 1,
      sfxVolume: 1,
      musicVolume: 1,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
      motionScale: 1,
      captionsEnabled: false,
      banterFrequency: 'normal',
      telemetryOptIn: false,
    });

    settings.reset();
    expect(settings.load().masterVolume).toBe(1);

    const m = meta.load();
    expect(m.totalKills).toBe(77);
    expect(m.unlockedAchievements).toContain('ach_kills_1000');
  });

  it('does not throw when settings storage write fails', () => {
    const settings = new SettingsManager({ storage: new ThrowingStorage(), key: 's' });
    expect(() => settings.save({
      settingsVersion: 1,
      masterVolume: 0.7,
      sfxVolume: 0.5,
      musicVolume: 0.3,
      screenShake: true,
      damageNumbers: true,
      reduceParticles: false,
      uiScale: 1,
      highContrastUi: false,
      motionScale: 1,
      captionsEnabled: false,
      banterFrequency: 'normal',
      telemetryOptIn: false,
    })).not.toThrow();
    expect(() => settings.update((cur) => ({ ...cur, musicVolume: 0.2 }))).not.toThrow();
  });
});
