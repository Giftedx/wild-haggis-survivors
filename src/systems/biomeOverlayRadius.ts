/**
 * Pure radius calculator for the soft tinted ellipse drawn per biome
 * seed in BiomeRenderer. Each seed gets a radius sized from its
 * distance to the nearest other seed, so adjacent biomes overlap
 * just enough for their tints to bleed into a smooth boundary.
 * Isolated seeds fall back to a minimum coverage radius so sparse
 * maps don't leave untinted corners.
 *
 * The 0.92 neighbour-radius multiplier (times 0.5 for half-distance)
 * and 0.21 min-coverage fraction are the two tuning knobs — pulled
 * out as named constants so the overlay's "softness" is edit-in-
 * one-place.
 */

/**
 * Radius vs half the distance to the nearest other seed. `1` would
 * have tangent boundaries; <1 means a small gap; >1 means heavy
 * overlap. 0.94 gives a gentle overlap that blends tints without
 * washing out.
 */
export const BIOME_NEIGHBOUR_RADIUS_MUL = 0.94;
/**
 * Minimum radius as a fraction of the world's shorter side. Sparse
 * biome layouts can still cover corners with this floor in place.
 */
export const BIOME_MIN_RADIUS_FRAC = 0.21;

export interface SeedLike {
  readonly x: number;
  readonly y: number;
}

/**
 * For each seed, return the overlay radius (in world units) it
 * should be drawn with. `seeds` is treated as readonly and
 * self-excluded for nearest-neighbour lookups.
 */
export function computeBiomeOverlayRadii(
  seeds: readonly SeedLike[],
  worldWidth: number,
  worldHeight: number,
): number[] {
  const minDim = Math.min(worldWidth, worldHeight);
  const minCoverR = minDim * BIOME_MIN_RADIUS_FRAC;
  const out: number[] = new Array(seeds.length);

  for (let i = 0; i < seeds.length; i++) {
    let minDist = Infinity;
    for (let j = 0; j < seeds.length; j++) {
      if (i === j) continue;
      const dx = seeds[i].x - seeds[j].x;
      const dy = seeds[i].y - seeds[j].y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < minDist) minDist = d;
    }
    if (!Number.isFinite(minDist) || minDist <= 0) {
      minDist = minDim;
    }
    out[i] = Math.max(minDist * BIOME_NEIGHBOUR_RADIUS_MUL * 0.5, minCoverR);
  }

  return out;
}
