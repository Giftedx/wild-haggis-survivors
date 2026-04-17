/**
 * Pure tuning resolvers for the film-grain overlay.
 *
 * Two observer-facing knobs from SettingsManager combine into the
 * overlay's visual intensity:
 *
 *   reduceParticles → slightly lower base alpha + reduced drift
 *   motionScale     → scales both alpha and drift linearly so a
 *                     player on motionScale 0 gets near-static grain
 *
 * Pulled out of FilmGrainOverlay.install so the named constants
 * document what each knob controls and tests can pin the
 * "reduce-particles dims the grain" + "motionScale 1 is the baseline"
 * invariants without spinning up Phaser.
 */

export const FILM_GRAIN_BASE_ALPHA_DEFAULT = 0.036;
export const FILM_GRAIN_BASE_ALPHA_REDUCED = 0.026;
/** Motion-scale dampening — alpha = base * (FLOOR + motionScale * SLOPE). */
export const FILM_GRAIN_MOTION_FLOOR = 0.75;
export const FILM_GRAIN_MOTION_SLOPE = 0.25;

export const FILM_GRAIN_DRIFT_BASE_PX = 1.1;
/** Motion scale ramps the drift — 0 gives 55%, 1 gives 100%. */
export const FILM_GRAIN_DRIFT_MOTION_FLOOR = 0.55;
export const FILM_GRAIN_DRIFT_MOTION_SLOPE = 0.45;
/** Reduce-particles shrinks drift by this factor. */
export const FILM_GRAIN_DRIFT_REDUCE_PARTICLES_MUL = 0.65;

/**
 * Base alpha for the film-grain sprite. Tween animates between
 * 82% of this (start) and 110% of this (peak) over ~3.8s.
 */
export function resolveFilmGrainBaseAlpha(
  reduceParticles: boolean,
  motionScale: number,
): number {
  const base = reduceParticles
    ? FILM_GRAIN_BASE_ALPHA_REDUCED
    : FILM_GRAIN_BASE_ALPHA_DEFAULT;
  return base * (FILM_GRAIN_MOTION_FLOOR + motionScale * FILM_GRAIN_MOTION_SLOPE);
}

/**
 * Peak-to-peak horizontal drift distance (px) for the slow pan tween.
 */
export function resolveFilmGrainDriftPx(
  reduceParticles: boolean,
  motionScale: number,
): number {
  const motion = FILM_GRAIN_DRIFT_MOTION_FLOOR + motionScale * FILM_GRAIN_DRIFT_MOTION_SLOPE;
  const rp = reduceParticles ? FILM_GRAIN_DRIFT_REDUCE_PARTICLES_MUL : 1;
  return FILM_GRAIN_DRIFT_BASE_PX * motion * rp;
}
