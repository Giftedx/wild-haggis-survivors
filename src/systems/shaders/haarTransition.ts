/**
 * Haar transition density curve — pure timing module. Given an elapsed time
 * in ms and the biome ambient densities either side of a transition, returns
 * the current density the HaarFogController should hold.
 *
 * Shape: fromAmbient → 1.0 (ramp in) → hold at 1.0 → toAmbient (ramp out).
 * Defaults are 1000ms / 500ms / 1000ms per F1 spec §2. During the 1.0 hold
 * the biome swap happens behind the wall of fog.
 */

export interface HaarTransitionOptions {
  rampInMs: number;
  holdMs: number;
  rampOutMs: number;
}

export const DEFAULT_HAAR_TRANSITION: Readonly<HaarTransitionOptions> = Object.freeze({
  rampInMs: 1000,
  holdMs: 500,
  rampOutMs: 1000,
});

export const HAAR_TRANSITION_TOTAL_MS =
  DEFAULT_HAAR_TRANSITION.rampInMs +
  DEFAULT_HAAR_TRANSITION.holdMs +
  DEFAULT_HAAR_TRANSITION.rampOutMs;

function resolveOptions(opts?: Partial<HaarTransitionOptions>): HaarTransitionOptions {
  if (!opts) return DEFAULT_HAAR_TRANSITION;
  return {
    rampInMs: opts.rampInMs ?? DEFAULT_HAAR_TRANSITION.rampInMs,
    holdMs: opts.holdMs ?? DEFAULT_HAAR_TRANSITION.holdMs,
    rampOutMs: opts.rampOutMs ?? DEFAULT_HAAR_TRANSITION.rampOutMs,
  };
}

function clamp01(v: number): number {
  if (v < 0) return 0;
  if (v > 1) return 1;
  return v;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function haarDensityAt(
  elapsedMs: number,
  fromAmbient: number,
  toAmbient: number,
  opts?: Partial<HaarTransitionOptions>,
): number {
  const { rampInMs, holdMs, rampOutMs } = resolveOptions(opts);
  if (elapsedMs <= 0) return fromAmbient;

  if (elapsedMs < rampInMs) {
    const t = clamp01(elapsedMs / rampInMs);
    return lerp(fromAmbient, 1, t);
  }

  const holdEnd = rampInMs + holdMs;
  if (elapsedMs < holdEnd) {
    return 1;
  }

  const rampOutEnd = holdEnd + rampOutMs;
  if (elapsedMs < rampOutEnd) {
    const t = clamp01((elapsedMs - holdEnd) / rampOutMs);
    return lerp(1, toAmbient, t);
  }

  return toAmbient;
}

export function isHaarTransitionComplete(
  elapsedMs: number,
  opts?: Partial<HaarTransitionOptions>,
): boolean {
  const { rampInMs, holdMs, rampOutMs } = resolveOptions(opts);
  return elapsedMs >= rampInMs + holdMs + rampOutMs;
}
