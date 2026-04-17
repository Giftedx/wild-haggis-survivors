/**
 * Pure helpers for the three camera-shake flavours in JuiceSystem.
 *
 * Each shake has an (amplitude × motionScale) scaling + a fixed
 * duration. Returns `null` when the player has screen shake disabled
 * or when the scaled amplitude collapses to zero — scene can
 * short-circuit before calling `cameras.main.shake()`.
 */

/** Amplitude at motionScale=1 for the standard boss-hit shake. */
export const BOSS_SHAKE_BASE_AMP = 0.015;
/** Duration (ms) for the standard boss-hit shake. */
export const BOSS_SHAKE_DURATION_MS = 400;

/** Amplitude at motionScale=1 for the celebratory boss-death shake. */
export const BOSS_DEATH_SHAKE_BASE_AMP = 0.025;
/** Duration (ms) for the celebratory boss-death shake. */
export const BOSS_DEATH_SHAKE_DURATION_MS = 600;

export interface ScreenShakeParams {
  durationMs: number;
  amplitude: number;
}

/**
 * Resolve shake (durationMs, amplitude) for a given base amplitude,
 * screen-shake setting, and motion-scale knob. Returns null when
 * shake is disabled or the scaled amplitude is zero/negative — the
 * scene skips the `cameras.main.shake()` call in that case.
 */
export function resolveScreenShakeParams(
  baseAmp: number,
  durationMs: number,
  screenShakeEnabled: boolean,
  motionScale: number,
): ScreenShakeParams | null {
  if (!screenShakeEnabled) return null;
  const amplitude = baseAmp * motionScale;
  if (!(amplitude > 0)) return null;
  return { durationMs, amplitude };
}
