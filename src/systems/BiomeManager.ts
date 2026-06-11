/**
 * BiomeManager — voronoi partition of the world into biome regions.
 *
 * Why voronoi: cheap, organic-looking boundaries, and lookups are O(N) on
 * the seed count (N ≤ 8) — well within per-frame budget. Precomputing a
 * coarse grid (64×64 cells covering the world) collapses lookups to O(1)
 * for hot paths like `update()` queries.
 *
 * Determinism: the whole thing is driven by the passed-in RNG. Daily /
 * seeded runs produce identical biome maps.
 */
import { BIOMES, BIOME_IDS, BiomeId, BiomeDef, pickBiomeAssignment } from '../data/biomes';
import type { RNG } from '../utils/rng';

export interface BiomeSeed {
  readonly x: number;
  readonly y: number;
  readonly biome: BiomeId;
}

export interface BiomeLayout {
  readonly seeds: readonly BiomeSeed[];
  readonly worldWidth: number;
  readonly worldHeight: number;
}

const LOOKUP_GRID_RES = 48; // 48×48 cells across world — good resolution/cost trade

export class BiomeManager {
  private layout: BiomeLayout;
  private lookup: BiomeId[]; // grid row-major, length = LOOKUP_GRID_RES²
  private cellW: number;
  private cellH: number;

  constructor(layout: BiomeLayout) {
    this.layout = layout;
    this.cellW = layout.worldWidth / LOOKUP_GRID_RES;
    this.cellH = layout.worldHeight / LOOKUP_GRID_RES;
    this.lookup = new Array(LOOKUP_GRID_RES * LOOKUP_GRID_RES);
    this.bakeLookup();
  }

  getLayout(): BiomeLayout {
    return this.layout;
  }

  /** Biome at a world-space point. Safe outside bounds (clamps). */
  biomeAt(x: number, y: number): BiomeId {
    const gx = Math.max(0, Math.min(LOOKUP_GRID_RES - 1, Math.floor(x / this.cellW)));
    const gy = Math.max(0, Math.min(LOOKUP_GRID_RES - 1, Math.floor(y / this.cellH)));
    return this.lookup[gy * LOOKUP_GRID_RES + gx];
  }

  biomeDefAt(x: number, y: number): BiomeDef {
    return BIOMES[this.biomeAt(x, y)];
  }

  /**
   * Iterate every grid cell with its biome — used by the renderer to bake
   * the overlay texture, and by the minimap to tint regions.
   */
  forEachCell(cb: (gx: number, gy: number, biome: BiomeId, cellW: number, cellH: number) => void): void {
    for (let gy = 0; gy < LOOKUP_GRID_RES; gy++) {
      for (let gx = 0; gx < LOOKUP_GRID_RES; gx++) {
        cb(gx, gy, this.lookup[gy * LOOKUP_GRID_RES + gx], this.cellW, this.cellH);
      }
    }
  }

  getGridResolution(): number {
    return LOOKUP_GRID_RES;
  }

  private bakeLookup(): void {
    const seeds = this.layout.seeds;
    for (let gy = 0; gy < LOOKUP_GRID_RES; gy++) {
      const cy = (gy + 0.5) * this.cellH;
      for (let gx = 0; gx < LOOKUP_GRID_RES; gx++) {
        const cx = (gx + 0.5) * this.cellW;
        let best = 0;
        let bestDist = Infinity;
        for (let i = 0; i < seeds.length; i++) {
          const dx = seeds[i].x - cx;
          const dy = seeds[i].y - cy;
          const d = dx * dx + dy * dy;
          if (d < bestDist) {
            bestDist = d;
            best = i;
          }
        }
        this.lookup[gy * LOOKUP_GRID_RES + gx] = seeds[best].biome;
      }
    }
  }
}

/**
 * Build a biome layout for a run. Seed points are placed with a bit of
 * jitter inside a padded region so no biome hugs the extreme edges.
 */
export function createBiomeLayout(
  rng: RNG,
  worldWidth: number,
  worldHeight: number,
): BiomeLayout {
  const seedCount = rng.int(5, 6);
  const ids = pickBiomeAssignment(rng, seedCount);

  const pad = 0.15; // 15% inset — keeps seeds away from the raw edge
  const padX = worldWidth * pad;
  const padY = worldHeight * pad;
  const seeds: BiomeSeed[] = [];
  for (let i = 0; i < seedCount; i++) {
    seeds.push({
      x: rng.float(padX, worldWidth - padX),
      y: rng.float(padY, worldHeight - padY),
      biome: ids[i],
    });
  }
  return { seeds, worldWidth, worldHeight };
}

export { BIOMES, BIOME_IDS };
export type { BiomeId, BiomeDef };
