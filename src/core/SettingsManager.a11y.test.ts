import { describe, it, expect, beforeEach } from 'vitest';
import {
  SettingsManager,
  resetSettingsManagerSingletonForTests,
} from './SettingsManager';
import { MemoryStorage } from '../test/MemoryStorage';

describe('accessibility settings', () => {
  beforeEach(() => {
    resetSettingsManagerSingletonForTests();
  });

  it('defaults to full motion and captions off', () => {
    const s = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
    const d = s.load();
    expect(d.motionScale).toBe(1);
    expect(d.captionsEnabled).toBe(false);
  });

  it('persists motionScale and captionsEnabled', () => {
    const mem = new MemoryStorage();
    const s = new SettingsManager({ storage: mem, key: 's' });
    s.update((cur) => ({ ...cur, motionScale: 0.25, captionsEnabled: true }));
    const loaded = s.load();
    expect(loaded.motionScale).toBe(0.25);
    expect(loaded.captionsEnabled).toBe(true);
  });

  it('clamps motionScale to [0, 1]', () => {
    const mem = new MemoryStorage();
    const s = new SettingsManager({ storage: mem, key: 's' });
    s.update((cur) => ({ ...cur, motionScale: 2.5 }));
    expect(s.load().motionScale).toBe(1);
    s.update((cur) => ({ ...cur, motionScale: -3 }));
    expect(s.load().motionScale).toBe(0);
  });

  it('coerces non-numeric motionScale to default 1', () => {
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
      motionScale: 'unsafe' as unknown as number,
      captionsEnabled: false,
    }));
    const s = new SettingsManager({ storage: mem, key: 's' });
    expect(s.load().motionScale).toBe(1);
  });

  it('legacy save without a11y fields still loads with defaults', () => {
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
      // motionScale + captionsEnabled absent — simulates pre-a11y save
    }));
    const s = new SettingsManager({ storage: mem, key: 's' });
    const loaded = s.load();
    expect(loaded.motionScale).toBe(1);
    expect(loaded.captionsEnabled).toBe(false);
  });

  it('reduceFlashing + photosensitivityWarningSeen default to false', () => {
    const s = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
    const d = s.load();
    expect(d.reduceFlashing).toBe(false);
    expect(d.photosensitivityWarningSeen).toBe(false);
  });

  it('persists reduceFlashing + photosensitivityWarningSeen', () => {
    const mem = new MemoryStorage();
    const s = new SettingsManager({ storage: mem, key: 's' });
    s.update((cur) => ({
      ...cur,
      reduceFlashing: true,
      photosensitivityWarningSeen: true,
    }));
    const loaded = s.load();
    expect(loaded.reduceFlashing).toBe(true);
    expect(loaded.photosensitivityWarningSeen).toBe(true);
  });

  it('coerces non-boolean reduceFlashing / photosensitivityWarningSeen to defaults', () => {
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
      reduceFlashing: 'yes' as unknown as boolean,
      photosensitivityWarningSeen: 1 as unknown as boolean,
    }));
    const s = new SettingsManager({ storage: mem, key: 's' });
    const loaded = s.load();
    expect(loaded.reduceFlashing).toBe(false);
    expect(loaded.photosensitivityWarningSeen).toBe(false);
  });

  it('legacy save without reduceFlashing / warning-seen fields loads with defaults', () => {
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
      motionScale: 0.5,
      captionsEnabled: false,
      // reduceFlashing + photosensitivityWarningSeen absent — pre-A1-M5 save
    }));
    const s = new SettingsManager({ storage: mem, key: 's' });
    const loaded = s.load();
    expect(loaded.reduceFlashing).toBe(false);
    expect(loaded.photosensitivityWarningSeen).toBe(false);
  });

  describe('Assist Mode (A1 M6)', () => {
    it('defaults all assist-mode fields off / unity', () => {
      const s = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
      const d = s.load();
      expect(d.assistMode).toBe(false);
      expect(d.assistModeGameSpeed).toBe(1);
      expect(d.assistModeExtendedIFrames).toBe(false);
      expect(d.assistModeExtendedComboWindow).toBe(false);
      expect(d.assistModeInvincibility).toBe(false);
    });

    it('persists all assist-mode fields round-trip', () => {
      const mem = new MemoryStorage();
      const s = new SettingsManager({ storage: mem, key: 's' });
      s.update((cur) => ({
        ...cur,
        assistMode: true,
        assistModeGameSpeed: 0.7,
        assistModeExtendedIFrames: true,
        assistModeExtendedComboWindow: true,
        assistModeInvincibility: true,
      }));
      const loaded = s.load();
      expect(loaded.assistMode).toBe(true);
      expect(loaded.assistModeGameSpeed).toBe(0.7);
      expect(loaded.assistModeExtendedIFrames).toBe(true);
      expect(loaded.assistModeExtendedComboWindow).toBe(true);
      expect(loaded.assistModeInvincibility).toBe(true);
    });

    it('clamps assistModeGameSpeed to [0.5, 1]', () => {
      const mem = new MemoryStorage();
      const s = new SettingsManager({ storage: mem, key: 's' });
      s.update((cur) => ({ ...cur, assistModeGameSpeed: 2.5 }));
      expect(s.load().assistModeGameSpeed).toBe(1);
      s.update((cur) => ({ ...cur, assistModeGameSpeed: 0.1 }));
      expect(s.load().assistModeGameSpeed).toBe(0.5);
    });

    it('coerces non-numeric assistModeGameSpeed to default 1', () => {
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
        assistModeGameSpeed: 'slow' as unknown as number,
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      expect(s.load().assistModeGameSpeed).toBe(1);
    });

    it('coerces non-boolean assist-mode toggles to defaults', () => {
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
        assistMode: 'on' as unknown as boolean,
        assistModeExtendedIFrames: 1 as unknown as boolean,
        assistModeExtendedComboWindow: null as unknown as boolean,
        assistModeInvincibility: {} as unknown as boolean,
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      const loaded = s.load();
      expect(loaded.assistMode).toBe(false);
      expect(loaded.assistModeExtendedIFrames).toBe(false);
      expect(loaded.assistModeExtendedComboWindow).toBe(false);
      expect(loaded.assistModeInvincibility).toBe(false);
    });

    it('legacy save without assist-mode fields loads with defaults', () => {
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
        // assistMode fields absent — pre-A1-M6 save
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      const loaded = s.load();
      expect(loaded.assistMode).toBe(false);
      expect(loaded.assistModeGameSpeed).toBe(1);
      expect(loaded.assistModeExtendedIFrames).toBe(false);
      expect(loaded.assistModeExtendedComboWindow).toBe(false);
      expect(loaded.assistModeInvincibility).toBe(false);
    });
  });
});
