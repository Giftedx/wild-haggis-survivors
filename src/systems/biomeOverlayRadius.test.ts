import { describe, it, expect } from 'vitest';
import {
  computeBiomeOverlayRadii,
  BIOME_MIN_RADIUS_FRAC,
  BIOME_NEIGHBOUR_RADIUS_MUL,
} from './biomeOverlayRadius';

describe('computeBiomeOverlayRadii', () => {
  it('returns one radius per seed', () => {
    const seeds = [{ x: 100, y: 100 }, { x: 200, y: 200 }, { x: 300, y: 300 }];
    const radii = computeBiomeOverlayRadii(seeds, 1000, 1000);
    expect(radii.length).toBe(seeds.length);
  });

  it('single-seed fallback uses minDim × NEIGHBOUR_MUL × 0.5 (which exceeds the floor)', () => {
    // No neighbours → minDist falls back to minDim (1000). Radius candidate =
    // 1000 * 0.94 * 0.5 = 470, which beats the 210 floor, so it wins.
    const radii = computeBiomeOverlayRadii([{ x: 500, y: 500 }], 1000, 2000);
    expect(radii[0]).toBeCloseTo(1000 * BIOME_NEIGHBOUR_RADIUS_MUL * 0.5, 5);
  });

  it('empty seed list returns empty array', () => {
    expect(computeBiomeOverlayRadii([], 1000, 1000)).toEqual([]);
  });

  it('two seeds far apart use half-distance × BIOME_NEIGHBOUR_RADIUS_MUL (above floor)', () => {
    const seeds = [{ x: 0, y: 0 }, { x: 4000, y: 0 }];
    const radii = computeBiomeOverlayRadii(seeds, 5000, 5000);
    // Half-distance = 2000; radius = 2000 * 0.94 = 1880. Floor is 5000*0.21=1050.
    const expected = 4000 * BIOME_NEIGHBOUR_RADIUS_MUL * 0.5;
    expect(radii[0]).toBeCloseTo(expected, 5);
    expect(radii[0]).toBe(radii[1]); // symmetric
  });

  it('two seeds close together clamp to the min-coverage floor', () => {
    const seeds = [{ x: 0, y: 0 }, { x: 10, y: 0 }];
    const radii = computeBiomeOverlayRadii(seeds, 1000, 1000);
    expect(radii[0]).toBeCloseTo(1000 * BIOME_MIN_RADIUS_FRAC, 5);
  });

  it('radii are always positive and finite', () => {
    const seeds = [
      { x: 100, y: 100 },
      { x: 500, y: 500 },
      { x: 900, y: 100 },
      { x: 100, y: 900 },
    ];
    const radii = computeBiomeOverlayRadii(seeds, 1000, 1000);
    for (const r of radii) {
      expect(r).toBeGreaterThan(0);
      expect(Number.isFinite(r)).toBe(true);
    }
  });
});
