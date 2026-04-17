import { describe, it, expect, vi } from 'vitest';
import { performSettingsReset } from './settingsResetAction';
import type { ISettingsData } from '../core/SettingsManager';

const makeDefaults = (): ISettingsData => ({
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
  localeKey: 'en',
});

describe('performSettingsReset', () => {
  it('wipes persisted settings, re-loads defaults, and restarts the scene', () => {
    const reset = vi.fn();
    const load = vi.fn(() => makeDefaults());
    const restartScene = vi.fn();

    const { defaults } = performSettingsReset({
      settingsManager: { reset, load },
      restartScene,
    });

    expect(reset).toHaveBeenCalledTimes(1);
    expect(restartScene).toHaveBeenCalledTimes(1);
    expect(defaults.uiScale).toBe(1);
    expect(defaults.highContrastUi).toBe(false);
  });

  it('calls reset BEFORE load — so load picks up defaults, not stale state', () => {
    const order: string[] = [];
    const reset = vi.fn(() => { order.push('reset'); });
    const load = vi.fn(() => { order.push('load'); return makeDefaults(); });
    const restartScene = vi.fn(() => { order.push('restart'); });

    performSettingsReset({ settingsManager: { reset, load }, restartScene });

    expect(order).toEqual(['reset', 'load', 'restart']);
  });
});
