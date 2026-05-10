import type { ISettingsData } from '../core/SettingsManager';

/**
 * 2026-05-10 — pure gate for the first-launch cultural-content notice.
 *
 * Returns true when the player has not yet dismissed the splash. Mirrors
 * `shouldShowPhotosensitivityWarning` so the boot chain treats both
 * one-time acknowledgements as a single sticky-flag pattern. The notice
 * exists because the live build ships drafted Scots / Doric / Shetlandic /
 * Gaelic content while native-speaker review is in progress; players
 * deserve to know that up-front.
 *
 * On dismissal BootScene writes `culturalContentSplashSeen: true`, which
 * flips this to false forever (sticky — no settings-panel re-trigger).
 */
export function shouldShowCulturalContentSplash(
  s: Pick<ISettingsData, 'culturalContentSplashSeen'>,
): boolean {
  return s.culturalContentSplashSeen !== true;
}

/**
 * Returns a settings object with the splash flag flipped on. Pure —
 * the caller persists the result through `SettingsManager.save()` or
 * `update()`.
 */
export function markCulturalContentSplashSeen<
  T extends Pick<ISettingsData, 'culturalContentSplashSeen'>,
>(s: T): T {
  return { ...s, culturalContentSplashSeen: true };
}
