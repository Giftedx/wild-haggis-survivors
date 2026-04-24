import type { HaarTransitionOptions } from './haarTransition';

/**
 * Accessibility gating for haar fog intensity.
 *
 * WHS does not yet ship a dedicated `reduceFlashing` setting (that lands
 * with A1 Accessibility Foundation). F1 derives a photosensitivity-safe
 * haar posture from the two existing shipped settings:
 *
 * - `motionScale` — scales the maximum density cap from 0.4 (at 0) to 1.0
 *   (at 1), and slows ramp durations (up to 2× at 0). Hold window is left
 *   alone — stillness is not motion.
 * - `reduceParticles` — hard-caps density at 0.5 regardless of motionScale
 *   when enabled. A player opting into fewer particles is signalling they
 *   want less screen churn; heavy fog doesn't belong in that posture either.
 *
 * When A1 ships a dedicated `reduceFlashing` toggle, wire it in as an
 * OR with `motionScale === 0` — the caps below still hold.
 */
export interface HaarA11ySettings {
  motionScale: number;
  reduceParticles: boolean;
}

export interface CappedHaar {
  density: number;
  transition: HaarTransitionOptions;
}

const MIN_CAP = 0.4;
const MAX_CAP = 1;
const REDUCE_PARTICLES_CAP = 0.5;
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

  const cappedDensity = Math.min(safeIn, cap);

  const stretch = rampScaleFromMotionScale(settings.motionScale);
  return {
    density: cappedDensity,
    transition: {
      rampInMs: transition.rampInMs * stretch,
      holdMs: transition.holdMs,
      rampOutMs: transition.rampOutMs * stretch,
    },
  };
}
