import { describe, expect, it } from 'vitest';
import {
  MEMORY_TRAIL_EMIT_INTERVAL_MS,
  MEMORY_TRAIL_RADIUS_PX,
  memoryTrailOverlaps,
  tickMemoryTrailEmit,
} from './memoryTrail';

describe('tickMemoryTrailEmit', () => {
  it('emits nothing and zeros the accumulator when the player is out of fog', () => {
    const r = tickMemoryTrailEmit({ inFog: false, accMs: 500, scaledDelta: 16 });
    expect(r.emitCount).toBe(0);
    expect(r.nextAccMs).toBe(0);
  });

  it('emits nothing on a zero-delta tick but preserves the accumulator', () => {
    const r = tickMemoryTrailEmit({ inFog: true, accMs: 50, scaledDelta: 0 });
    expect(r.emitCount).toBe(0);
    expect(r.nextAccMs).toBe(50);
  });

  it('emits once after the interval elapses', () => {
    const r = tickMemoryTrailEmit({
      inFog: true,
      accMs: MEMORY_TRAIL_EMIT_INTERVAL_MS - 1,
      scaledDelta: 2,
    });
    expect(r.emitCount).toBe(1);
    expect(r.nextAccMs).toBe(1);
  });

  it('emits multiple segments when a single frame covers several intervals (continuous trail under lag spike)', () => {
    const r = tickMemoryTrailEmit({
      inFog: true,
      accMs: 0,
      scaledDelta: MEMORY_TRAIL_EMIT_INTERVAL_MS * 3.5,
    });
    expect(r.emitCount).toBe(3);
    // Accumulator carries the half-interval remainder forward.
    expect(r.nextAccMs).toBeCloseTo(MEMORY_TRAIL_EMIT_INTERVAL_MS * 0.5, 3);
  });

  it('caps emissions per frame so a huge delta does not dump hundreds of segments', () => {
    const HUGE = 1_000_000;
    const r = tickMemoryTrailEmit({ inFog: true, accMs: 0, scaledDelta: HUGE });
    // Internal cap MAX_EMITS_PER_TICK — not exported, but asserting <= 10 is sane.
    expect(r.emitCount).toBeLessThanOrEqual(10);
    expect(r.emitCount).toBeGreaterThan(0);
  });

  it('ignores negative scaledDelta (defensive) without spilling into emissions', () => {
    const r = tickMemoryTrailEmit({ inFog: true, accMs: 100, scaledDelta: -16 });
    expect(r.emitCount).toBe(0);
    expect(r.nextAccMs).toBe(100);
  });

  it('leaving fog mid-frame clears the accumulator for clean re-entry', () => {
    const r1 = tickMemoryTrailEmit({ inFog: true, accMs: 100, scaledDelta: 10 });
    expect(r1.nextAccMs).toBe(110);
    const r2 = tickMemoryTrailEmit({ inFog: false, accMs: r1.nextAccMs, scaledDelta: 16 });
    expect(r2.nextAccMs).toBe(0);
  });
});

describe('memoryTrailOverlaps', () => {
  it('is true when the point sits at the segment centre', () => {
    expect(memoryTrailOverlaps(100, 100, MEMORY_TRAIL_RADIUS_PX, 100, 100)).toBe(true);
  });

  it('is true when the point is within the radius', () => {
    expect(memoryTrailOverlaps(100, 100, MEMORY_TRAIL_RADIUS_PX, 115, 100)).toBe(true);
  });

  it('is false when the point sits exactly on the radius (exclusive boundary)', () => {
    expect(memoryTrailOverlaps(100, 100, 10, 110, 100)).toBe(false);
  });

  it('is false when the point is outside the radius', () => {
    expect(memoryTrailOverlaps(100, 100, MEMORY_TRAIL_RADIUS_PX, 200, 200)).toBe(false);
  });

  it('handles non-axis-aligned separations', () => {
    // Distance 5 to (103, 104), radius 6 → inside.
    expect(memoryTrailOverlaps(100, 100, 6, 103, 104)).toBe(true);
    // Distance 5 to (103, 104), radius 4 → outside.
    expect(memoryTrailOverlaps(100, 100, 4, 103, 104)).toBe(false);
  });
});
