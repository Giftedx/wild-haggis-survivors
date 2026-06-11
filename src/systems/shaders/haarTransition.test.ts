import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HAAR_TRANSITION,
  haarDensityAt,
  HAAR_TRANSITION_TOTAL_MS,
  isHaarTransitionComplete,
} from './haarTransition';

describe('haarDensityAt — biome transition ramp', () => {
  const from = 0.1;
  const to = 0.2;

  it('starts at fromAmbient at t=0', () => {
    expect(haarDensityAt(0, from, to)).toBeCloseTo(from, 5);
  });

  it('ramps linearly toward 1.0 over the rampInMs window', () => {
    const half = haarDensityAt(DEFAULT_HAAR_TRANSITION.rampInMs / 2, from, to);
    expect(half).toBeGreaterThan(from);
    expect(half).toBeLessThan(1);
  });

  it('reaches 1.0 at the end of the ramp-in window', () => {
    expect(haarDensityAt(DEFAULT_HAAR_TRANSITION.rampInMs, from, to)).toBeCloseTo(1, 5);
  });

  it('holds at 1.0 throughout the hold window', () => {
    const start = DEFAULT_HAAR_TRANSITION.rampInMs + 1;
    const end = DEFAULT_HAAR_TRANSITION.rampInMs + DEFAULT_HAAR_TRANSITION.holdMs - 1;
    expect(haarDensityAt(start, from, to)).toBe(1);
    expect(haarDensityAt(end, from, to)).toBe(1);
  });

  it('ramps from 1.0 back to toAmbient over the ramp-out window', () => {
    const rampOutStart = DEFAULT_HAAR_TRANSITION.rampInMs + DEFAULT_HAAR_TRANSITION.holdMs;
    const rampOutEnd = HAAR_TRANSITION_TOTAL_MS;
    expect(haarDensityAt(rampOutStart, from, to)).toBe(1);
    const mid = (rampOutStart + rampOutEnd) / 2;
    expect(haarDensityAt(mid, from, to)).toBeGreaterThan(to);
    expect(haarDensityAt(mid, from, to)).toBeLessThan(1);
    expect(haarDensityAt(rampOutEnd, from, to)).toBeCloseTo(to, 5);
  });

  it('clamps to toAmbient past the full transition duration', () => {
    expect(haarDensityAt(HAAR_TRANSITION_TOTAL_MS + 500, from, to)).toBeCloseTo(to, 5);
    expect(haarDensityAt(1_000_000, from, to)).toBeCloseTo(to, 5);
  });

  it('handles identical from/to without NaN', () => {
    expect(haarDensityAt(0, 0.15, 0.15)).toBeCloseTo(0.15, 5);
    expect(haarDensityAt(500, 0.15, 0.15)).toBeGreaterThanOrEqual(0.15);
    expect(haarDensityAt(HAAR_TRANSITION_TOTAL_MS, 0.15, 0.15)).toBeCloseTo(0.15, 5);
  });

  it('supports custom rampInMs / holdMs / rampOutMs overrides', () => {
    const opts = { rampInMs: 200, holdMs: 100, rampOutMs: 200 };
    expect(haarDensityAt(0, 0, 0, opts)).toBe(0);
    expect(haarDensityAt(200, 0, 0, opts)).toBeCloseTo(1, 5);
    expect(haarDensityAt(300, 0, 0, opts)).toBe(1);
    expect(haarDensityAt(500, 0, 0, opts)).toBeCloseTo(0, 5);
  });

  it('returns a value within [0, 1] for arbitrary elapsed-ms probes', () => {
    for (let t = -100; t <= HAAR_TRANSITION_TOTAL_MS + 1000; t += 50) {
      const d = haarDensityAt(t, 0, 0.3);
      expect(d).toBeGreaterThanOrEqual(0);
      expect(d).toBeLessThanOrEqual(1);
    }
  });
});

describe('isHaarTransitionComplete', () => {
  it('false during the transition', () => {
    expect(isHaarTransitionComplete(0)).toBe(false);
    expect(isHaarTransitionComplete(HAAR_TRANSITION_TOTAL_MS - 1)).toBe(false);
  });

  it('true at or past the transition duration', () => {
    expect(isHaarTransitionComplete(HAAR_TRANSITION_TOTAL_MS)).toBe(true);
    expect(isHaarTransitionComplete(HAAR_TRANSITION_TOTAL_MS + 1)).toBe(true);
  });

  it('respects overrides', () => {
    const opts = { rampInMs: 100, holdMs: 100, rampOutMs: 100 };
    expect(isHaarTransitionComplete(299, opts)).toBe(false);
    expect(isHaarTransitionComplete(300, opts)).toBe(true);
  });
});
