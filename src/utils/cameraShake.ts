import type { SettingsManager } from '../core/SettingsManager';

/**
 * Apply Phaser camera shake, scaled by the user's a11y preferences.
 *
 * - `screenShake: false` → no shake at all.
 * - `screenShake: true` → amplitude multiplied by `motionScale` (0..1).
 *
 * Duration is left unscaled: a shorter shake reads as "smaller" too —
 * scaling both would compound and make the shake vanish entirely at
 * motionScale 0.3. Amplitude alone preserves the beat while taming it.
 */
export function tryCameraShake(
  cam: { shake: (duration: number, intensity: number) => void } | null | undefined,
  durationMs: number,
  intensity: number,
  settings: SettingsManager
): void {
  if (!cam) return;
  const s = settings.load();
  if (!s.screenShake) return;
  const scaled = intensity * s.motionScale;
  if (scaled <= 0) return;
  cam.shake(durationMs, scaled);
}
