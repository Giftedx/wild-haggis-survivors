import { describe, it, expect } from 'vitest';
import {
  resolveFilmGrainBaseAlpha,
  resolveFilmGrainDriftPx,
  FILM_GRAIN_BASE_ALPHA_DEFAULT,
  FILM_GRAIN_BASE_ALPHA_REDUCED,
  FILM_GRAIN_DRIFT_BASE_PX,
} from './filmGrainTuning';

describe('resolveFilmGrainBaseAlpha', () => {
  it('reduceParticles=false + motionScale=1 matches the default base × (0.75 + 0.25)', () => {
    expect(resolveFilmGrainBaseAlpha(false, 1)).toBeCloseTo(FILM_GRAIN_BASE_ALPHA_DEFAULT, 10);
  });

  it('reduceParticles=true always dims below the default at matching motion', () => {
    for (const ms of [0, 0.5, 1]) {
      expect(resolveFilmGrainBaseAlpha(true, ms))
        .toBeLessThan(resolveFilmGrainBaseAlpha(false, ms));
    }
  });

  it('motionScale=0 still produces a non-zero residual (the floor)', () => {
    expect(resolveFilmGrainBaseAlpha(false, 0)).toBeGreaterThan(0);
    expect(resolveFilmGrainBaseAlpha(false, 0)).toBeCloseTo(
      FILM_GRAIN_BASE_ALPHA_DEFAULT * 0.75, 10);
  });

  it('is monotonically non-decreasing in motionScale', () => {
    let prev = -1;
    for (let ms = 0; ms <= 1; ms += 0.1) {
      const a = resolveFilmGrainBaseAlpha(false, ms);
      expect(a).toBeGreaterThanOrEqual(prev);
      prev = a;
    }
  });

  it('reduced base constant is smaller than the default (invariant)', () => {
    expect(FILM_GRAIN_BASE_ALPHA_REDUCED).toBeLessThan(FILM_GRAIN_BASE_ALPHA_DEFAULT);
  });
});

describe('resolveFilmGrainDriftPx', () => {
  it('motionScale=1 + reduceParticles=false returns the full base drift', () => {
    expect(resolveFilmGrainDriftPx(false, 1)).toBeCloseTo(FILM_GRAIN_DRIFT_BASE_PX, 10);
  });

  it('reduceParticles=true shrinks drift by the dampen multiplier', () => {
    const full = resolveFilmGrainDriftPx(false, 1);
    const reduced = resolveFilmGrainDriftPx(true, 1);
    expect(reduced).toBeLessThan(full);
  });

  it('motionScale=0 still produces residual drift (never hard-zero)', () => {
    expect(resolveFilmGrainDriftPx(false, 0)).toBeGreaterThan(0);
  });

  it('is monotonically non-decreasing in motionScale', () => {
    let prev = -1;
    for (let ms = 0; ms <= 1; ms += 0.1) {
      const d = resolveFilmGrainDriftPx(false, ms);
      expect(d).toBeGreaterThanOrEqual(prev);
      prev = d;
    }
  });
});
