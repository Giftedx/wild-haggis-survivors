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

  describe('captionTextScale (A1 M4)', () => {
    it('defaults to 1', () => {
      const s = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
      expect(s.load().captionTextScale).toBe(1);
    });

    it('clamps to [0.8, 1.4]', () => {
      const mem = new MemoryStorage();
      const s = new SettingsManager({ storage: mem, key: 's' });
      s.update((cur) => ({ ...cur, captionTextScale: 5 }));
      expect(s.load().captionTextScale).toBe(1.4);
      s.update((cur) => ({ ...cur, captionTextScale: -2 }));
      expect(s.load().captionTextScale).toBe(0.8);
    });

    it('coerces non-numeric back to default', () => {
      const mem = new MemoryStorage();
      mem.setItem('s', JSON.stringify({
        settingsVersion: 1,
        captionTextScale: 'huge' as unknown as number,
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      expect(s.load().captionTextScale).toBe(1);
    });

    it('round-trips a persisted captionTextScale', () => {
      const mem = new MemoryStorage();
      const s = new SettingsManager({ storage: mem, key: 's' });
      s.update((cur) => ({ ...cur, captionTextScale: 1.25 }));
      expect(s.load().captionTextScale).toBe(1.25);
    });
  });

  describe('Key + Gamepad bindings (A1 M3)', () => {
    it('defaults keyBindings to the classic arrows+WASD+Space+Escape layout', () => {
      const s = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
      const d = s.load();
      expect(d.keyBindings.moveUp).toEqual({ primary: 'ArrowUp', secondary: 'KeyW' });
      expect(d.keyBindings.moveDown).toEqual({ primary: 'ArrowDown', secondary: 'KeyS' });
      expect(d.keyBindings.moveLeft).toEqual({ primary: 'ArrowLeft', secondary: 'KeyA' });
      expect(d.keyBindings.moveRight).toEqual({ primary: 'ArrowRight', secondary: 'KeyD' });
      expect(d.keyBindings.dash).toEqual({ primary: 'Space' });
      expect(d.keyBindings.pause).toEqual({ primary: 'Escape', secondary: 'KeyP' });
    });

    it('defaults gamepadBindings to dash + pause only', () => {
      const s = new SettingsManager({ storage: new MemoryStorage(), key: 's' });
      const d = s.load();
      expect(d.gamepadBindings.dash).toEqual({ primary: 0, secondary: 7 });
      expect(d.gamepadBindings.pause).toEqual({ primary: 9 });
      expect(d.gamepadBindings.moveUp).toBeUndefined();
    });

    it('persists rebinds round-trip', () => {
      const mem = new MemoryStorage();
      const s = new SettingsManager({ storage: mem, key: 's' });
      s.update((cur) => ({
        ...cur,
        keyBindings: {
          ...cur.keyBindings,
          dash: { primary: 'ShiftLeft' },
          pause: { primary: 'Tab', secondary: 'Backspace' },
        },
        gamepadBindings: {
          ...cur.gamepadBindings,
          dash: { primary: 2 },
        },
      }));
      const loaded = s.load();
      expect(loaded.keyBindings.dash.primary).toBe('ShiftLeft');
      expect(loaded.keyBindings.dash.secondary).toBeUndefined();
      expect(loaded.keyBindings.pause).toEqual({ primary: 'Tab', secondary: 'Backspace' });
      expect(loaded.gamepadBindings.dash).toEqual({ primary: 2 });
      // Untouched actions keep their defaults.
      expect(loaded.keyBindings.moveUp).toEqual({ primary: 'ArrowUp', secondary: 'KeyW' });
    });

    it('coerces missing per-action keyBinding back to default', () => {
      const mem = new MemoryStorage();
      mem.setItem('s', JSON.stringify({
        settingsVersion: 1,
        keyBindings: {
          dash: { primary: 'F' },
          // moveUp / moveDown / moveLeft / moveRight / pause missing — coerce fills them
        },
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      const loaded = s.load();
      expect(loaded.keyBindings.dash.primary).toBe('F');
      expect(loaded.keyBindings.moveUp).toEqual({ primary: 'ArrowUp', secondary: 'KeyW' });
      expect(loaded.keyBindings.pause).toEqual({ primary: 'Escape', secondary: 'KeyP' });
    });

    it('coerces malformed per-action keyBinding shape to default', () => {
      const mem = new MemoryStorage();
      mem.setItem('s', JSON.stringify({
        settingsVersion: 1,
        keyBindings: {
          dash: 'not-an-object',
          moveUp: { primary: 42, secondary: 'KeyW' },
          pause: { primary: '', secondary: 'KeyP' },
        },
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      const loaded = s.load();
      // dash — whole value malformed → default fills in.
      expect(loaded.keyBindings.dash).toEqual({ primary: 'Space' });
      // moveUp — primary non-string → falls back; secondary preserved.
      expect(loaded.keyBindings.moveUp.primary).toBe('ArrowUp');
      // pause — empty-string primary → fallback.
      expect(loaded.keyBindings.pause.primary).toBe('Escape');
    });

    it('drops out-of-range gamepad button indices', () => {
      const mem = new MemoryStorage();
      mem.setItem('s', JSON.stringify({
        settingsVersion: 1,
        gamepadBindings: {
          dash: { primary: -1 },
          pause: { primary: 9, secondary: 99 },
        },
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      const loaded = s.load();
      // dash — negative primary → fallback default.
      expect(loaded.gamepadBindings.dash).toEqual({ primary: 0, secondary: 7 });
      // pause — valid primary kept; out-of-range secondary dropped.
      expect(loaded.gamepadBindings.pause).toEqual({ primary: 9 });
    });

    it('legacy save without bindings fields loads with defaults', () => {
      const mem = new MemoryStorage();
      mem.setItem('s', JSON.stringify({
        settingsVersion: 1,
        masterVolume: 0.5,
      }));
      const s = new SettingsManager({ storage: mem, key: 's' });
      const loaded = s.load();
      expect(loaded.keyBindings.dash).toEqual({ primary: 'Space' });
      expect(loaded.gamepadBindings.pause).toEqual({ primary: 9 });
    });
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
