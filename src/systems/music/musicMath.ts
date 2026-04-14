/**
 * Small audio/UI curve helpers — smooth polynomials and frame-rate–independent
 * smoothing so mood follows predictable time constants at any Phaser delta.
 */

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function smoothstep01(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = edge1 === edge0 ? 1 : clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

/** Logistic-style knee: maps (-∞,∞) → (0,1), centered at `mid` with width ~`span`. */
export function softKnee(x: number, mid: number, span: number): number {
  if (span <= 0) return x >= mid ? 1 : 0;
  return 1 / (1 + Math.exp(-(x - mid) / span));
}

/**
 * Exponential approach to `target` — equivalent to a first-order low-pass with
 * time constant `tauMs` milliseconds (63% toward target per `tauMs`).
 */
export function expApproach(current: number, target: number, deltaMs: number, tauMs: number): number {
  if (tauMs <= 0) return target;
  const a = 1 - Math.exp(-deltaMs / tauMs);
  return current + (target - current) * Math.min(1, a);
}

/** Geometric (log-space) interpolation — natural for frequencies, tempos, intervals. */
export function logLerp(a: number, b: number, t: number): number {
  if (a <= 0 || b <= 0) return a + (b - a) * clamp01(t);
  const u = clamp01(t);
  return Math.exp(Math.log(a) * (1 - u) + Math.log(b) * u);
}

/**
 * Shared time constants for SFX master ramps, music ducking, ambient beds,
 * and lightweight UI tweens — same “feel” as mood smoothing in this module.
 */
export const MOTION_TIMING = {
  /** SFX bus when prefs / mute change (s). */
  sfxMasterRampSec: 0.15,
  /** Music master when `applyUserVolume` runs (s). */
  musicUserVolumeRampSec: 0.15,
  /** Music unmute from `setEnabled(true)` — slightly slower than prefs (s). */
  musicUnmuteRampSec: 0.3,
  /** Music recovers after gameplay SFX punch (ms, exponential decay τ in `ProceduralMusicEngine.update`). */
  musicSfxDuckRecoverMs: 260,
  /** Additive music attenuation impulses (0–1 each, stacked then clamped in `notifyGameplaySfxImpulse`). */
  musicDuckKill: 0.24,
  musicDuckPlayerHit: 0.38,
  musicDuckBoss: 0.52,
  musicDuckDeath: 0.78,
  musicDuckLevelUp: 0.08,
  musicDuckAchievement: 0.055,
  musicDuckPurchase: 0.06,
  /** Moor moment sting — soft; stacks with procedural bloom from the same beat. */
  musicDuckMoorMoment: 0.07,
  ambientFadeInSec: 1.5,
  ambientFadeOutSec: 0.8,
  /** Common Phaser alpha / spawn tweens (ms). */
  uiFadeFastMs: 150,
  uiFadeStandardMs: 200,
  /** Floor for scaled motion tweens (`scaledTweenDurationMs`). */
  uiTweenFloorMs: 120,
  /** Settings toggle thumb slide (ms). */
  uiToggleTweenMs: 140,
} as const;
