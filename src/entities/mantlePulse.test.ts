import { describe, expect, it } from 'vitest';
import {
  MANTLE_PULSE_INTERVAL_MS,
  MANTLE_PULSE_KNOCKBACK_VEL,
  MANTLE_PULSE_RADIUS_PX,
  computeMantlePulseStagger,
  tickMantlePulseTimer,
} from './mantlePulse';

describe('tickMantlePulseTimer', () => {
  it('does not fire below tier 2 and zeroes the accumulator', () => {
    expect(tickMantlePulseTimer({ deltaMs: 9_999, accumulatedMs: 5_900, currentTier: 0 }))
      .toEqual({ didPulse: false, nextAccumulatedMs: 0 });
    expect(tickMantlePulseTimer({ deltaMs: 9_999, accumulatedMs: 5_900, currentTier: 1 }))
      .toEqual({ didPulse: false, nextAccumulatedMs: 0 });
  });

  it('accumulates without firing while under threshold at tier 2', () => {
    const r = tickMantlePulseTimer({ deltaMs: 100, accumulatedMs: 0, currentTier: 2 });
    expect(r.didPulse).toBe(false);
    expect(r.nextAccumulatedMs).toBe(100);
  });

  it('fires when the accumulator crosses the interval threshold', () => {
    const r = tickMantlePulseTimer({
      deltaMs: 200,
      accumulatedMs: MANTLE_PULSE_INTERVAL_MS - 100,
      currentTier: 2,
    });
    expect(r.didPulse).toBe(true);
    expect(r.nextAccumulatedMs).toBe(100);
  });

  it('carries overshoot into the next cycle (frame-drop safe)', () => {
    const r = tickMantlePulseTimer({
      deltaMs: MANTLE_PULSE_INTERVAL_MS + 1_000,
      accumulatedMs: 0,
      currentTier: 2,
    });
    expect(r.didPulse).toBe(true);
    expect(r.nextAccumulatedMs).toBe(1_000);
  });

  it('treats negative delta as zero (defensive)', () => {
    const r = tickMantlePulseTimer({ deltaMs: -500, accumulatedMs: 1_000, currentTier: 2 });
    expect(r.didPulse).toBe(false);
    expect(r.nextAccumulatedMs).toBe(1_000);
  });
});

describe('computeMantlePulseStagger', () => {
  it('returns null for enemies outside the pulse radius', () => {
    expect(computeMantlePulseStagger(0, 0, MANTLE_PULSE_RADIUS_PX + 1, 0)).toBeNull();
    expect(computeMantlePulseStagger(100, 100, 200, 100)).toBeNull();
  });

  it('returns an outward-radial impulse for enemies inside the radius', () => {
    const r = computeMantlePulseStagger(0, 0, 30, 40); // dist 50 — exactly on the rim
    expect(r).not.toBeNull();
    if (!r) return;
    // Magnitude should equal the knockback; direction along (3, 4) normalised.
    const mag = Math.hypot(r.vx, r.vy);
    expect(mag).toBeCloseTo(MANTLE_PULSE_KNOCKBACK_VEL, 5);
    expect(r.vx / mag).toBeCloseTo(0.6, 5);
    expect(r.vy / mag).toBeCloseTo(0.8, 5);
  });

  it('handles co-located enemies with a deterministic +x push (no NaN)', () => {
    const r = computeMantlePulseStagger(50, 50, 50, 50);
    expect(r).toEqual({ vx: MANTLE_PULSE_KNOCKBACK_VEL, vy: 0 });
  });

  it('respects custom radius + knockback overrides', () => {
    expect(computeMantlePulseStagger(0, 0, 40, 0, 30, 100)).toBeNull();
    const r = computeMantlePulseStagger(0, 0, 20, 0, 30, 100);
    expect(r).toEqual({ vx: 100, vy: 0 });
  });
});
