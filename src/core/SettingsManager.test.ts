import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import {
  SaveManager,
  type StorageLike,
} from './SaveManager';
import {
  SettingsManager,
  SETTINGS_STORAGE_KEY,
  resetSettingsManagerSingletonForTests,
  getSettingsManager,
} from './SettingsManager';
import { MemoryStorage } from '../test/MemoryStorage';
import { DEFAULT_KEYBINDINGS, DEFAULT_GAMEPAD_BINDINGS } from './actions';

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
      saveVersion: 9,
      totalKillsSpent: 0,
      dailyChallenge: null,
      totalKills: 99,
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
      codexCulledKeys: [],
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
      skipActIntermissions: false,
      ironmoorMode: false,
      speedrunTimerVisible: false,
      captureEnabled: true,
      reduceFlashing: false,
      photosensitivityWarningSeen: false,
      assistMode: false,
      assistModeGameSpeed: 1,
      assistModeExtendedIFrames: false,
      assistModeExtendedComboWindow: false,
      assistModeInvincibility: false,
      captionTextScale: 1,
      colorblindMode: 'off',
      disableSeasonalEvents: false,
      disableHazards: false,
      cloudSaveOptIn: false,
      keyBindings: DEFAULT_KEYBINDINGS,
      gamepadBindings: DEFAULT_GAMEPAD_BINDINGS,
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
      saveVersion: 9,
      totalKillsSpent: 0,
      dailyChallenge: null,
      totalKills: 10,
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
      codexCulledKeys: [],
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
      skipActIntermissions: false,
      ironmoorMode: false,
      speedrunTimerVisible: false,
      captureEnabled: true,
      reduceFlashing: false,
      photosensitivityWarningSeen: false,
      assistMode: false,
      assistModeGameSpeed: 1,
      assistModeExtendedIFrames: false,
      assistModeExtendedComboWindow: false,
      assistModeInvincibility: false,
      captionTextScale: 1,
      colorblindMode: 'off',
      disableSeasonalEvents: false,
      disableHazards: false,
      cloudSaveOptIn: false,
      keyBindings: DEFAULT_KEYBINDINGS,
      gamepadBindings: DEFAULT_GAMEPAD_BINDINGS,
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
      saveVersion: 9,
      totalKillsSpent: 0,
      dailyChallenge: null,
      totalKills: 77,
      unlockedWeapons: ['thistle_shot'],
      unlockedUpgrades: ['speed_tier_1'],
      activeRun: null,
      unlockedAchievements: ['ach_kills_1000'],
      hasCompletedTutorial: true,
      hasSeenDriftTutorial: false,
      hasSeenEliteAffixTip: false,
      hasSeenMoorMomentTip: false,
      hasSeenCeilidhChainTip: false,
      hasSeenStandingStonesTip: false,
      hasSeenAncestralEchoTip: false,
      moorMomentsLifetime: 0,
      runHistory: [],
      codexCulledKeys: [],
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
      skipActIntermissions: false,
      ironmoorMode: false,
      speedrunTimerVisible: false,
      captureEnabled: true,
      reduceFlashing: false,
      photosensitivityWarningSeen: false,
      assistMode: false,
      assistModeGameSpeed: 1,
      assistModeExtendedIFrames: false,
      assistModeExtendedComboWindow: false,
      assistModeInvincibility: false,
      captionTextScale: 1,
      colorblindMode: 'off',
      disableSeasonalEvents: false,
      disableHazards: false,
      cloudSaveOptIn: false,
      keyBindings: DEFAULT_KEYBINDINGS,
      gamepadBindings: DEFAULT_GAMEPAD_BINDINGS,
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
      skipActIntermissions: false,
      ironmoorMode: false,
      speedrunTimerVisible: false,
      captureEnabled: true,
      reduceFlashing: false,
      photosensitivityWarningSeen: false,
      assistMode: false,
      assistModeGameSpeed: 1,
      assistModeExtendedIFrames: false,
      assistModeExtendedComboWindow: false,
      assistModeInvincibility: false,
      captionTextScale: 1,
      colorblindMode: 'off',
      disableSeasonalEvents: false,
      disableHazards: false,
      cloudSaveOptIn: false,
      keyBindings: DEFAULT_KEYBINDINGS,
      gamepadBindings: DEFAULT_GAMEPAD_BINDINGS,
    })).not.toThrow();
    expect(() => settings.update((cur) => ({ ...cur, musicVolume: 0.2 }))).not.toThrow();
  });
});

describe('SettingsManager: P3 cloudSaveOptIn', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('defaults cloudSaveOptIn to false (offline-first)', () => {
    const sm = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
    expect(sm.load().cloudSaveOptIn).toBe(false);
  });

  it('round-trips a true value through persistence', () => {
    const mem = new MemoryStorage();
    const sm = new SettingsManager({ storage: mem, key: 's' });
    sm.update((cur) => ({ ...cur, cloudSaveOptIn: true }));
    const reloaded = new SettingsManager({ storage: mem, key: 's' }).load();
    expect(reloaded.cloudSaveOptIn).toBe(true);
  });

  it('coerces non-boolean values to the default', () => {
    const mem = new MemoryStorage();
    mem.setItem('s', JSON.stringify({
      settingsVersion: 1,
      cloudSaveOptIn: 'yes please',
    }));
    const sm = new SettingsManager({ storage: mem, key: 's' });
    expect(sm.load().cloudSaveOptIn).toBe(false);
  });
});

describe('SettingsManager: W2 skipActIntermissions', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });
  afterEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('defaults skipActIntermissions to false', () => {
    const mgr = getSettingsManager();
    mgr.reset();
    expect(mgr.load().skipActIntermissions).toBe(false);
  });

  it('persists skipActIntermissions through save/load', () => {
    const mem = new MemoryStorage();
    const settings = new SettingsManager({ storage: mem, key: 's' });
    settings.update((cur) => ({ ...cur, skipActIntermissions: true }));
    expect(settings.load().skipActIntermissions).toBe(true);
    settings.update((cur) => ({ ...cur, skipActIntermissions: false }));
    expect(settings.load().skipActIntermissions).toBe(false);
  });

  it('defaults skipActIntermissions to false on pre-W2 saves missing the field', () => {
    const mem = new MemoryStorage();
    // Simulate a pre-W2 save that has no skipActIntermissions field
    mem.setItem('s', JSON.stringify({
      settingsVersion: 1,
      masterVolume: 0.8,
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
      // skipActIntermissions absent — pre-W2 save
    }));
    const settings = new SettingsManager({ storage: mem, key: 's' });
    const loaded = settings.load();
    expect(loaded.skipActIntermissions).toBe(false);
    // Other fields survive migration intact
    expect(loaded.masterVolume).toBe(0.8);
  });

  // ── W18 localeKey ──────────────────────────────────────────────
  it('defaults localeKey to en', () => {
    const mgr = getSettingsManager();
    mgr.reset();
    expect(mgr.load().localeKey ?? 'en').toBe('en');
  });

  it('persists localeKey through save/load', () => {
    const mem = new MemoryStorage();
    const settings = new SettingsManager({ storage: mem, key: 's' });
    settings.update((cur) => ({ ...cur, localeKey: 'scs' }));
    expect(settings.load().localeKey).toBe('scs');
    settings.update((cur) => ({ ...cur, localeKey: 'en' }));
    expect(settings.load().localeKey).toBe('en');
  });

  it('coerces unknown localeKey strings to en', () => {
    const mem = new MemoryStorage();
    mem.setItem('s', JSON.stringify({
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
      skipActIntermissions: false,
      ironmoorMode: false,
      localeKey: 'martian',
    }));
    const settings = new SettingsManager({ storage: mem, key: 's' });
    expect(settings.load().localeKey).toBe('en');
  });

  it('coerces non-string localeKey values to en', () => {
    const mem = new MemoryStorage();
    mem.setItem('s', JSON.stringify({
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
      skipActIntermissions: false,
      ironmoorMode: false,
      localeKey: 42,
    }));
    const settings = new SettingsManager({ storage: mem, key: 's' });
    expect(settings.load().localeKey).toBe('en');
  });

  it('defaults localeKey to en when absent on a legacy save', () => {
    const mem = new MemoryStorage();
    // Pre-W18 save: no localeKey field at all
    mem.setItem('s', JSON.stringify({
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
      skipActIntermissions: false,
      ironmoorMode: false,
      speedrunTimerVisible: false,
    }));
    const settings = new SettingsManager({ storage: mem, key: 's' });
    expect(settings.load().localeKey).toBe('en');
  });
});

describe('SettingsManager captureEnabled', () => {
  it('defaults captureEnabled to true on a fresh load', () => {
    const mgr = new SettingsManager({
      storage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    });
    expect(mgr.load().captureEnabled).toBe(true);
  });

  it('coerces saved captureEnabled=false', () => {
    const mem = new MemoryStorage();
    mem.setItem('s', JSON.stringify({ captureEnabled: false }));
    const mgr = new SettingsManager({ storage: mem, key: 's' });
    expect(mgr.load().captureEnabled).toBe(false);
  });

  it('coerces missing captureEnabled back to the default', () => {
    const mem = new MemoryStorage();
    mem.setItem('s', JSON.stringify({ masterVolume: 0.5 }));
    const mgr = new SettingsManager({ storage: mem, key: 's' });
    expect(mgr.load().captureEnabled).toBe(true);
  });
});
