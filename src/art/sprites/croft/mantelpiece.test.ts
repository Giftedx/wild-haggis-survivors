import { describe, expect, it } from 'vitest';
import { computeTrophySlotXs } from './mantelpiece';

/**
 * Pure helper tests. The actual drawer code uses Phaser.Graphics
 * and is exercised end-to-end via the croft e2e smoke.
 */
describe('computeTrophySlotXs', () => {
  it('returns one X per slot, evenly distributed across the usable width', () => {
    const xs = computeTrophySlotXs(0, 400, 5);
    expect(xs).toHaveLength(5);
    // Monotonically increasing.
    for (let i = 1; i < xs.length; i++) {
      expect(xs[i]).toBeGreaterThan(xs[i - 1]);
    }
    // Slots should lie comfortably inside the shelf bounds.
    expect(xs[0]).toBeGreaterThan(0);
    expect(xs[4]).toBeLessThan(400);
    // First and last slots should be roughly symmetric around the centre.
    expect(Math.abs((xs[0] - 0) - (400 - xs[4]))).toBeLessThan(2);
  });

  it('returns an empty array when slotCount is 0 or negative', () => {
    expect(computeTrophySlotXs(0, 400, 0)).toEqual([]);
    expect(computeTrophySlotXs(10, 400, -1)).toEqual([]);
  });

  it('shifts with the shelf origin', () => {
    const xsAt0 = computeTrophySlotXs(0, 400, 5);
    const xsAt100 = computeTrophySlotXs(100, 400, 5);
    for (let i = 0; i < xsAt0.length; i++) {
      expect(xsAt100[i]).toBeCloseTo(xsAt0[i] + 100);
    }
  });

  it('scales stride with width', () => {
    const xsNarrow = computeTrophySlotXs(0, 200, 5);
    const xsWide = computeTrophySlotXs(0, 800, 5);
    const strideNarrow = xsNarrow[1] - xsNarrow[0];
    const strideWide = xsWide[1] - xsWide[0];
    expect(strideWide).toBeGreaterThan(strideNarrow);
  });

  it('respects a side gutter so trophies never hug the shelf edges', () => {
    const xs = computeTrophySlotXs(0, 400, 1);
    expect(xs[0]).toBeGreaterThan(0);
    expect(xs[0]).toBeLessThan(400);
  });
});
