import { describe, it, expect } from 'vitest';
import {
  pickNearbyPosition,
  NEARBY_SPAWN_MIN_DIST,
  NEARBY_SPAWN_DIST_RANGE,
  NEARBY_SPAWN_EDGE_MARGIN,
} from './nearbySpawn';

function sequence(vals: number[]): () => number {
  let i = 0;
  return () => vals[i++ % vals.length];
}

describe('pickNearbyPosition', () => {
  it('never places a pickup closer than MIN_DIST from the player in open space', () => {
    // rand=0 → angle=0 (east), dist=MIN_DIST.
    const out = pickNearbyPosition({
      playerX: 1000, playerY: 1000,
      worldWidth: 5000, worldHeight: 5000,
      rand: sequence([0, 0]),
    });
    // Distance should equal MIN_DIST exactly.
    const dx = out.x - 1000;
    const dy = out.y - 1000;
    expect(Math.hypot(dx, dy)).toBeCloseTo(NEARBY_SPAWN_MIN_DIST, 6);
  });

  it('never places a pickup farther than MIN_DIST + DIST_RANGE from the player', () => {
    // rand=0 for angle, rand=1 for dist → dist = MIN + RANGE = 350.
    const out = pickNearbyPosition({
      playerX: 1000, playerY: 1000,
      worldWidth: 5000, worldHeight: 5000,
      rand: sequence([0, 0.999999]),
    });
    const d = Math.hypot(out.x - 1000, out.y - 1000);
    expect(d).toBeLessThanOrEqual(NEARBY_SPAWN_MIN_DIST + NEARBY_SPAWN_DIST_RANGE + 1e-6);
  });

  it('clamps x to stay EDGE_MARGIN from the left wall', () => {
    // Player near left edge, angle = π (west) → rawX would be < 0.
    // rand = 0.5 produces angle = π, dist = MIN + RANGE/2 = 250.
    const out = pickNearbyPosition({
      playerX: 10, playerY: 1000,
      worldWidth: 2000, worldHeight: 2000,
      rand: sequence([0.5, 0.5]),
    });
    expect(out.x).toBe(NEARBY_SPAWN_EDGE_MARGIN);
  });

  it('clamps y to stay EDGE_MARGIN from the top wall', () => {
    // Angle = 3π/2 (sin = -1) → rawY = playerY - dist.
    // rand 0.75 gives angle = 1.5π, dist mid.
    const out = pickNearbyPosition({
      playerX: 1000, playerY: 20,
      worldWidth: 2000, worldHeight: 2000,
      rand: sequence([0.75, 0.5]),
    });
    expect(out.y).toBe(NEARBY_SPAWN_EDGE_MARGIN);
  });

  it('clamps to right/bottom edges on large angles', () => {
    // Player near the right+bottom corner.
    const out = pickNearbyPosition({
      playerX: 1990, playerY: 1990,
      worldWidth: 2000, worldHeight: 2000,
      rand: sequence([0, 1]), // angle = 0 (east), dist = MIN + RANGE
    });
    expect(out.x).toBe(2000 - NEARBY_SPAWN_EDGE_MARGIN);
  });

  it('always returns integer-safe finite numbers', () => {
    for (let i = 0; i < 20; i++) {
      const out = pickNearbyPosition({
        playerX: 1000, playerY: 1000,
        worldWidth: 2000, worldHeight: 2000,
        rand: sequence([Math.random(), Math.random()]),
      });
      expect(Number.isFinite(out.x)).toBe(true);
      expect(Number.isFinite(out.y)).toBe(true);
    }
  });
});
