/**
 * Motion scale accessors — a single place every visual-intensity consumer
 * asks "how much motion should I emit right now?".
 *
 * Rationale: the setting can change at runtime (player tweaks it mid-run),
 * so consumers must not cache the value at construction. These helpers are
 * cheap wrappers over SettingsManager.load() — resolve fresh on each call.
 *
 * motionScale semantics:
 *   1.0 — full, current game feel
 *   0.5 — half amplitude / count / duration
 *   0.0 — minimum that still communicates impact (see floors below)
 *
 * Callers should pass through these helpers rather than multiplying raw
 * numbers themselves, so floors/caps stay consistent across the codebase.
 */
import { getSettingsManager } from './SettingsManager';

/**
 * A1 M5 — hard cap on flash alpha when the player has opted into the
 * strict photosensitivity posture. Mirrors the WCAG / PEAT guidance
 * that flashes above ~0.4 opacity trip the "general flash" threshold
 * irrespective of duration.
 */
const REDUCE_FLASHING_ALPHA_CAP = 0.4;

/**
 * A1 M5 — floor on flash duration when reduceFlashing is on. Short,
 * bright flashes are the PEAT failure mode; stretching duration past
 * 200ms turns them into ramps, which are seizure-safer.
 */
const REDUCE_FLASHING_DURATION_FLOOR_MS = 200;

/** Raw 0..1 scale. Read from settings each call. */
export function getMotionScale(): number {
  return getSettingsManager().load().motionScale;
}

/** A1 M5 — true when the player has opted into strict photosensitivity caps. */
export function isReduceFlashingOn(): boolean {
  return getSettingsManager().load().reduceFlashing === true;
}

/** Scale a camera-shake amplitude. Returns 0 when the user has fully opted out. */
export function scaledShakeAmplitude(baseAmp: number): number {
  return baseAmp * getMotionScale();
}

/**
 * Scale a white/red flash alpha.
 *  - Floor 0 at motionScale 0 (flash disappears entirely).
 *  - When `reduceFlashing` is on, the result is additionally capped at
 *    0.4 — the PEAT / WCAG general-flash threshold — *after* the
 *    motion-scale multiply. If motionScale already pulls the alpha
 *    below 0.4, the cap is a no-op (stricter-wins).
 */
export function scaledFlashAlpha(baseAlpha: number): number {
  const scaled = Math.max(0, baseAlpha * getMotionScale());
  if (isReduceFlashingOn()) return Math.min(scaled, REDUCE_FLASHING_ALPHA_CAP);
  return scaled;
}

/**
 * Scale a flash-event duration.
 *  - Default: pass-through (flashes are inherently short; shortening
 *    them further is not a motion-scale concern).
 *  - When `reduceFlashing` is on, floor the duration at 200ms so the
 *    flash reads as a ramp rather than a strobe.
 */
export function scaledFlashDurationMs(baseDurationMs: number): number {
  if (!isReduceFlashingOn()) return baseDurationMs;
  return Math.max(REDUCE_FLASHING_DURATION_FLOOR_MS, baseDurationMs);
}

/**
 * Scale a slow-motion duration. Floor 60ms so the hit-feel beat survives
 * even at aggressive reduction; below 60ms the effect isn't perceptible
 * and just feels like a stutter.
 */
export function scaledSlowMoDurationMs(baseDurationMs: number): number {
  const m = getMotionScale();
  if (m >= 1) return baseDurationMs;
  const scaled = baseDurationMs * m;
  return scaled < 60 ? 60 : scaled;
}

/**
 * Scale a particle count. Rounded up so we never emit zero particles at
 * non-zero motion; minimum `min` particles always survive so the visual
 * intent stays recognisable even at heavy reduction.
 */
export function scaledParticleCount(baseCount: number, min: number = 4): number {
  const m = getMotionScale();
  if (m >= 1) return baseCount;
  if (m <= 0) return Math.max(min, 0);
  return Math.max(min, Math.ceil(baseCount * m));
}

/**
 * Scale a tween duration that conveys motion. Unlike slow-mo durations,
 * regular tweens are clamped to stay above a 120ms floor — any faster
 * reads as a snap, which is itself visually jarring.
 */
export function scaledTweenDurationMs(baseDurationMs: number): number {
  const m = getMotionScale();
  if (m >= 1) return baseDurationMs;
  const scaled = baseDurationMs * m;
  return Math.max(120, scaled);
}
