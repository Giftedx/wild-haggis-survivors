/**
 * BiomeRenderer — paints a soft tinted overlay for each biome region on
 * top of the existing Highland terrain. The overlay is low-alpha so the
 * handcrafted terrain underneath reads through; biomes whisper rather
 * than shout.
 *
 * One `Graphics` object per run. Lives at a depth between terrain and
 * entity shadows so it never covers gameplay-critical visuals.
 */
import * as Phaser from 'phaser';
import { BIOMES } from '../data/biomes';
import type { BiomeManager } from './BiomeManager';
import { computeBiomeOverlayRadii } from './biomeOverlayRadius';

const OVERLAY_DEPTH = -3.5; // between terrain (-4) and deco sprites (-3)
/**
 * Tint from Voronoi **seed** sites only (same seeds as BiomeManager) — a handful of
 * large, soft ellipses that overlap at biome boundaries. Avoids any regular grid of
 * circles over the whole map.
 */
const SEED_OVERLAY_ALPHA = 0.092;

export class BiomeRenderer {
  private gfx: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, manager: BiomeManager) {
    this.gfx = scene.add.graphics().setDepth(OVERLAY_DEPTH);
    this.render(manager);
  }

  render(manager: BiomeManager): void {
    this.gfx.clear();

    const { seeds, worldWidth, worldHeight } = manager.getLayout();
    const radii = computeBiomeOverlayRadii(seeds, worldWidth, worldHeight);

    for (let i = 0; i < seeds.length; i++) {
      const tint = BIOMES[seeds[i].biome].tint;
      this.gfx.fillStyle(tint, SEED_OVERLAY_ALPHA);
      this.gfx.fillEllipse(seeds[i].x, seeds[i].y, radii[i] * 2, radii[i] * 2);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
