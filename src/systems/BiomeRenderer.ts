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
const OVERLAY_ALPHA = 0.28;

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

    // Paint each grid cell as a soft blob. Uses slight overlap + low alpha
    // so boundaries naturally feather between biomes without per-edge blend logic.
    const cells: Array<{ x: number; y: number; w: number; h: number; tint: number }> = [];
    manager.forEachCell((gx, gy, biome, cellW, cellH) => {
      cells.push({
        x: gx * cellW,
        y: gy * cellH,
        w: cellW,
        h: cellH,
        tint: BIOMES[biome].tint,
      });
    });

    // Pass 1: soft fill per cell with overlap, low alpha — feathered look.
    for (const c of cells) {
      this.gfx.fillStyle(c.tint, OVERLAY_ALPHA);
      this.gfx.fillRect(c.x - 1, c.y - 1, c.w + 2, c.h + 2);
    }
  }

  destroy(): void {
    this.gfx.destroy();
  }
}
