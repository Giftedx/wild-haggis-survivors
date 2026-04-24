import { afterEach, describe, expect, it } from 'vitest';
import { applyLocaleFromUserSettings } from './applyLocaleFromSettings';
import { DEFAULT_LOCALE, getLocale, setLocale } from './i18n';
import { CURRENT_SETTINGS_VERSION, type ISettingsData } from './SettingsManager';
import { DEFAULT_KEYBINDINGS, DEFAULT_GAMEPAD_BINDINGS } from './actions';

const baseSettings: ISettingsData = {
  settingsVersion: CURRENT_SETTINGS_VERSION,
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
  keyBindings: DEFAULT_KEYBINDINGS,
  gamepadBindings: DEFAULT_GAMEPAD_BINDINGS,
};

describe('applyLocaleFromUserSettings', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('applies an explicit scs localeKey', () => {
    applyLocaleFromUserSettings({ ...baseSettings, localeKey: 'scs' });
    expect(getLocale()).toBe('scs');
  });

  it('applies an explicit en localeKey', () => {
    setLocale('scs');
    applyLocaleFromUserSettings({ ...baseSettings, localeKey: 'en' });
    expect(getLocale()).toBe('en');
  });

  it('falls back to default when localeKey is absent (back-compat)', () => {
    setLocale('scs');
    const { localeKey: _, ...rest } = baseSettings;
    void _;
    applyLocaleFromUserSettings(rest as ISettingsData);
    expect(getLocale()).toBe('en');
  });
});
