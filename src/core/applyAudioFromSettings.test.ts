import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CURRENT_SETTINGS_VERSION, type ISettingsData } from './SettingsManager';
import { DEFAULT_KEYBINDINGS, DEFAULT_GAMEPAD_BINDINGS } from './actions';

const applyFromSettings = vi.hoisted(() => vi.fn());
const setEnabledAudio = vi.hoisted(() => vi.fn());
const applyUserVolume = vi.hoisted(() => vi.fn());
const setEnabledMusic = vi.hoisted(() => vi.fn());

vi.mock('../systems/AudioSystem', () => ({
  audio: {
    applyFromSettings,
    setEnabled: setEnabledAudio,
  },
}));

vi.mock('../systems/music/ProceduralMusicEngine', () => ({
  musicEngine: {
    applyUserVolume,
    setEnabled: setEnabledMusic,
  },
}));

import { applyAudioFromUserSettings } from './applyAudioFromSettings';

const base: ISettingsData = {
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
  culturalContentSplashSeen: false,
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
};

function withVolumes(p: Partial<Pick<ISettingsData, 'masterVolume' | 'sfxVolume' | 'musicVolume'>>): ISettingsData {
  return { ...base, ...p };
}

describe('applyAudioFromUserSettings', () => {
  beforeEach(() => {
    applyFromSettings.mockClear();
    setEnabledAudio.mockClear();
    applyUserVolume.mockClear();
    setEnabledMusic.mockClear();
  });

  it('routes volumes and enables both buses when above the dead zone', () => {
    applyAudioFromUserSettings(withVolumes({ masterVolume: 0.8, sfxVolume: 0.5, musicVolume: 0.25 }));
    expect(applyFromSettings).toHaveBeenCalledWith(0.8, 0.5);
    expect(applyUserVolume).toHaveBeenCalledWith(0.8, 0.25);
    expect(setEnabledAudio).toHaveBeenCalledWith(true);
    expect(setEnabledMusic).toHaveBeenCalledWith(true);
  });

  it('treats volumes at or below 0.001 as off for enable flags', () => {
    applyAudioFromUserSettings(withVolumes({ masterVolume: 1, sfxVolume: 0.001, musicVolume: 0.001 }));
    expect(setEnabledAudio).toHaveBeenCalledWith(false);
    expect(setEnabledMusic).toHaveBeenCalledWith(false);
  });

  it('allows music on while SFX is dead-zoned', () => {
    applyAudioFromUserSettings(withVolumes({ masterVolume: 1, sfxVolume: 0, musicVolume: 0.5 }));
    expect(setEnabledAudio).toHaveBeenCalledWith(false);
    expect(setEnabledMusic).toHaveBeenCalledWith(true);
  });
});
