import type { HaarTransitionOptions } from './haarTransition';

/**
 * Accessibility gating for haar fog intensity.
 *
 * F1 shipped the first two levers; A1 M5 adds the third:
 *
 * - `motionScale` — scales the maximum density cap from 0.4 (at 0) to 1.0
 *   (at 1), and slows ramp durations (up to 2× at 0). Hold window is left
 *   alone — stillness is not motion.
 * - `reduceParticles` — hard-caps density at 0.5 regardless of motionScale
 *   when enabled. A player opting into fewer particles is signalling they
 *   want less screen churn; heavy fog doesn't belong in that posture either.
 * - `reduceFlashing` — A1 M5 strict photosensitivity posture. Forces the
 *   density cap to MIN_CAP (0.4) and the ramp stretch to MAX (2×),
 *   independent of motionScale. Mirrors the companion guard that caps
 *   JuiceSystem flash alpha/duration: reduceFlashing is a hard toggle,
 *   motionScale is a continuum.
 *
 * Stricter cap always wins — reduceParticles (0.5) + reduceFlashing (0.4)
 * resolves to 0.4. The interface stays additive: callers that haven't
 * surfaced the new toggle yet can default to `reduceFlashing: false` and
 * behaviour is unchanged.
 */
export interface HaarA11ySettings {
  motionScale: number;
  reduceParticles: boolean;
  reduceFlashing: boolean;
}

export interface CappedHaar {
  density: number;
  transition: HaarTransitionOptions;
}

const MIN_CAP = 0.4;
const MAX_CAP = 1;
const REDUCE_PARTICLES_CAP = 0.5;
const REDUCE_FLASHING_CAP = MIN_CAP;
const MAX_RAMP_STRETCH = 2;

function densityCapFromMotionScale(motionScale: number): number {
  const m = Math.max(0, Math.min(1, motionScale));
  return MIN_CAP + (MAX_CAP - MIN_CAP) * m;
}

function rampScaleFromMotionScale(motionScale: number): number {
  const m = Math.max(0, Math.min(1, motionScale));
  return 1 + (MAX_RAMP_STRETCH - 1) * (1 - m);
}

export function capHaarForA11y(
  settings: HaarA11ySettings,
  density: number,
  transition: HaarTransitionOptions,
): CappedHaar {
  const safeIn = Math.max(0, density);

  let cap = densityCapFromMotionScale(settings.motionScale);
  if (settings.reduceParticles) cap = Math.min(cap, REDUCE_PARTICLES_CAP);
  if (settings.reduceFlashing) cap = Math.min(cap, REDUCE_FLASHING_CAP);

  const cappedDensity = Math.min(safeIn, cap);

  // reduceFlashing forces the maximum ramp stretch regardless of motionScale
  // — a bright haar that rolls in over half a second reads as a flash, even
  // if the peak density is capped.
  const stretch = settings.reduceFlashing
    ? MAX_RAMP_STRETCH
    : rampScaleFromMotionScale(settings.motionScale);
  return {
    density: cappedDensity,
    transition: {
      rampInMs: transition.rampInMs * stretch,
      holdMs: transition.holdMs,
      rampOutMs: transition.rampOutMs * stretch,
    },
  };
}
