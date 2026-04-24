import type { ISettingsData } from '../core/SettingsManager';

/**
 * A1 M5 — pure gate for the first-launch photosensitivity warning.
 *
 * Returns true when the player has not yet dismissed the splash. The
 * BootScene checks this once after asset generation completes and
 * before transitioning to MainMenu. On dismissal the BootScene writes
 * `photosensitivityWarningSeen: true`, which flips this to false
 * forever (the flag is sticky — no way to re-trigger the splash from
 * in-game, by design).
 */
export function shouldShowPhotosensitivityWarning(
  s: Pick<ISettingsData, 'photosensitivityWarningSeen'>,
): boolean {
  return s.photosensitivityWarningSeen !== true;
}

/**
 * Returns a settings object with the warning flag flipped on. Pure —
 * the caller persists the result through `SettingsManager.save()` or
 * `update()`.
 */
export function markPhotosensitivityWarningSeen<
  T extends Pick<ISettingsData, 'photosensitivityWarningSeen'>,
>(s: T): T {
  return { ...s, photosensitivityWarningSeen: true };
}
