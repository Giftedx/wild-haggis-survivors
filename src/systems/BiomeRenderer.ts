/**
 * BiomeRenderer — paints a soft tinted overlay for each biome region on
 * top of the existing Highland terrain. The overlay is low-alpha so the
 * handcrafted terrain underneath reads through; biomes whisper rather
 * than shout.
 *
 * One `Graphics` object per run. Lives at a depth between terrain and
 * entity shadows so it never covers gameplay-critical visuals.
 */
import Phaser from 'phaser';
import { BIOMES } from '../data/biomes';
import type { BiomeManager } from './BiomeManager';

const OVERLAY_DEPTH = -3.5; // between terrain (-4) and deco sprites (-3)
/**
 * Tint from Voronoi **seed** sites only (same seeds as BiomeManager) — a handful of
 * large, soft ellipses that overlap at biome boundaries. Avoids any regular grid of
 * circles over the whole map.
 */
const SEED_OVERLAY_ALPHA = 0.092;
/** Min radius so sparse seeds still cover corners; scales with neighbour distance. */
const MIN_RADIUS_FRAC = 0.21;
/** Radius vs half the distance to the nearest other seed (overlap ≈ smooth blend). */
const NEIGHBOUR_RADIUS_MUL = 0.94;

export class BiomeRenderer {
  private gfx: Phaser.GameObjects.Graphics;
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, manager: BiomeManager) {
    this.scene = scene;
    this.gfx = scene.add.graphics().setDepth(OVERLAY_DEPTH);
    this.render(manager);
  }

  render(manager: BiomeManager): void {
    this.gfx.clear();

    const { seeds, worldWidth, worldHeight } = manager.getLayout();
    const minDim = Math.min(worldWidth, worldHeight);
    const minCoverR = minDim * MIN_RADIUS_FRAC;

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
      const radius = Math.max(minDist * NEIGHBOUR_RADIUS_MUL * 0.5, minCoverR);
      const tint = BIOMES[seeds[i].biome].tint;
      this.gfx.fillStyle(tint, SEED_OVERLAY_ALPHA);
      this.gfx.fillEllipse(seeds[i].x, seeds[i].y, radius * 2, radius * 2);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
