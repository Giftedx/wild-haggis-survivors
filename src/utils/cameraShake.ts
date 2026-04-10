import type { SettingsManager } from '../core/SettingsManager';

/**
 * Applies Phaser camera shake only when user preferences allow it.
 */
export function tryCameraShake(
  cam: { shake: (duration: number, intensity: number) => void } | null | undefined,
  durationMs: number,
  intensity: number,
  settings: SettingsManager
): void {
  if (!cam) return;
  if (!settings.load().screenShake) return;
  cam.shake(durationMs, intensity);
}
