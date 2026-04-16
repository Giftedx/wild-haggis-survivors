import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { SettingsManager, CURRENT_SETTINGS_VERSION, type ISettingsData } from '../core/SettingsManager';
import { MemoryStorage } from '../test/MemoryStorage';

/**
 * Regression fence for the Options / Comfort panel: every string shown in
 * `SettingsScene` must resolve in i18n, and every persisted field the scene
 * touches must survive save/load. Catches missing keys when new toggles ship.
 */
const SETTINGS_SCENE_I18N_KEYS = [
  'ui.settings.title',
  'ui.settings.subtitle',
  'ui.settings.comfort_hint',
  'ui.settings.section_sound',
  'ui.settings.master_volume',
  'ui.settings.sfx_volume',
  'ui.settings.music_volume',
  'ui.settings.section_comfort',
  'ui.settings.ui_scale',
  'ui.settings.motion_scale',
  'ui.settings.screen_shake',
  'ui.settings.damage_numbers',
  'ui.settings.section_access',
  'ui.settings.captions',
  'ui.settings.high_contrast_ui',
  'ui.settings.reduce_particles',
  'ui.settings.telemetry_opt_in',
  'ui.settings.skipActIntermissions',
  'ui.settings.ironmoorMode',
  'ui.settings.back',
  'ui.settings.on',
  'ui.settings.off',
  'ui.settings.banter_frequency',
  'ui.settings.banter_off',
  'ui.settings.banter_sparing',
  'ui.settings.banter_normal',
  'ui.settings.banter_chatty',
] as const;

/** Fields the Comfort panel sliders/toggles/banter row persist (excludes version). */
const COMFORT_PANEL_DATA_KEYS: (keyof ISettingsData)[] = [
  'masterVolume',
  'sfxVolume',
  'musicVolume',
  'screenShake',
  'damageNumbers',
  'reduceParticles',
  'uiScale',
  'highContrastUi',
  'motionScale',
  'captionsEnabled',
  'banterFrequency',
  'telemetryOptIn',
  'skipActIntermissions',
  'ironmoorMode',
];

describe('Settings / Comfort panel smoke', () => {
  it('resolves every SettingsScene i18n key (no missing copy)', () => {
    for (const key of SETTINGS_SCENE_I18N_KEYS) {
      const resolved = t(key);
      expect(resolved, key).not.toBe(key);
      expect(resolved.length, key).toBeGreaterThan(0);
    }
  });

  it('round-trips all comfort-panel fields through SettingsManager', () => {
    const mem = new MemoryStorage();
    const sm = new SettingsManager({ storage: mem, key: 'comfort_smoke' });

    const payload: ISettingsData = {
      settingsVersion: CURRENT_SETTINGS_VERSION,
      masterVolume: 0.72,
      sfxVolume: 0.55,
      musicVolume: 0.33,
      screenShake: false,
      damageNumbers: false,
      reduceParticles: true,
      uiScale: 1.15,
      highContrastUi: true,
      motionScale: 0.4,
      captionsEnabled: true,
      banterFrequency: 'sparing',
      telemetryOptIn: true,
      skipActIntermissions: true,
      ironmoorMode: true,
    };
    sm.save(payload);
    const loaded = sm.load();
    expect(loaded.settingsVersion).toBe(CURRENT_SETTINGS_VERSION);
    for (const k of COMFORT_PANEL_DATA_KEYS) {
      expect(loaded[k], k).toEqual(payload[k]);
    }
  });
});
