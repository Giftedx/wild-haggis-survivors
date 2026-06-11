import type { ISettingsData } from './SettingsManager';
import { audio } from '../systems/AudioSystem';
import { musicEngine } from '../systems/music/ProceduralMusicEngine';

/**
 * Applies air-gapped user volume prefs to SFX + music engines.
 * Call after loading `ISettingsData` or when toggles change.
 */
export function applyAudioFromUserSettings(s: ISettingsData): void {
  const sfxOn = s.sfxVolume > 0.001;
  const musicOn = s.musicVolume > 0.001;
  audio.applyFromSettings(s.masterVolume, s.sfxVolume);
  audio.setEnabled(sfxOn);
  musicEngine.applyUserVolume(s.masterVolume, s.musicVolume);
  musicEngine.setEnabled(musicOn);
}
