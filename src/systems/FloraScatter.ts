/**
 * FloraScatter — places ~200 seeded decoration sprites across the world
 * with per-biome variant weighting and gentle sway animation.
 *
 * Performance: all 200 images use visibility culling (camera bounds +
 * margin). Only visible sprites update position each frame.
 */
import * as Phaser from 'phaser';
import type { BiomeManager } from './BiomeManager';
import type { BiomeId } from '../data/biomes';
import type { RNG } from '../utils/rng';

interface FloraSprite {
  image: Phaser.GameObjects.Image;
  baseX: number;
  baseY: number;
  phase: number;
  swayable: boolean;
}

/** Weighted texture tables per biome. Each entry: [textureKey, cumulativeWeight]. */
type WeightedEntry = readonly [string, number];

const FLORA_BY_BIOME: Readonly<Record<BiomeId, readonly WeightedEntry[]>> = {
  heather: [
    ['deco_heather', 0.20],
    ['deco_bracken', 0.35],
    ['deco_grouse_feather', 0.48],
    ['deco_wool_tuft', 0.60],
    ['deco_wind_grass', 0.74],
    ['deco_thistle', 0.88],
    ['deco_rock', 1.0],
  ],
  bog: [
    ['deco_bog_cotton', 0.18],
    ['deco_sphagnum', 0.34],
    ['deco_peat_cut', 0.50],
    ['deco_bog_boot', 0.56],
    ['deco_thistle', 0.72],
    ['deco_rock_2', 0.88],
    ['deco_heather', 1.0],
  ],
  pine: [
    ['deco_roots', 0.22],
    ['deco_pine_cone', 0.38],
    ['deco_mushrooms', 0.53],
    ['deco_rowan_berries', 0.66],
    ['deco_rock_3', 0.80],
    ['deco_thistle', 0.91],
    ['deco_heather', 1.0],
  ],
  loch: [
    ['deco_reeds', 0.24],
    ['deco_ripple', 0.40],
    ['deco_driftwood', 0.56],
    ['deco_creel', 0.66],
    ['deco_rock', 0.82],
    ['deco_glasgow_kite', 0.90],
    ['deco_heather', 1.0],
  ],
};

const FLORA_COUNT = 200;
const CULL_MARGIN = 150;

function pickTexture(table: readonly WeightedEntry[], roll: number): string {
  for (const [key, threshold] of table) {
    if (roll < threshold) return key;
  }
  return table[table.length - 1][0];
}

function isSwayable(textureKey: string): boolean {
  if (textureKey.includes('rock')) return false;
  if (textureKey.includes('peat')) return false;
  if (textureKey.includes('creel')) return false;
  if (textureKey.includes('driftwood')) return false;
  if (textureKey.includes('boot')) return false;
  if (textureKey.includes('ripple')) return false;
  if (textureKey.includes('pine_cone')) return false;
  if (textureKey.includes('grouse_feather')) return false;
  if (textureKey.includes('wool_tuft')) return false;
  return true;
}

export class FloraScatter {
  private flora: FloraSprite[] = [];
  private time = 0;

  create(
    scene: Phaser.Scene,
    biomeManager: BiomeManager,
    worldW: number,
    worldH: number,
    rng: RNG,
  ): void {
    // Clean up previous run (scene instance reuse).
    this.destroy();

    for (let i = 0; i < FLORA_COUNT; i++) {
      const x = rng.float(0, worldW);
      const y = rng.float(0, worldH);
      const biome = biomeManager.biomeAt(x, y);
      const table = FLORA_BY_BIOME[biome];
      const textureKey = pickTexture(table, rng.next());
      const scale = 0.8 + rng.next() * 0.4;
      const phase = rng.next() * Math.PI * 2;
      const swayable = isSwayable(textureKey);

      const img = scene.add.image(x, y, textureKey);
      img.setDepth(-3 + (y / worldH) * 0.5);
      img.setAlpha(0.7);
      img.setScale(scale);
      img.setVisible(false); // culled by default until update runs

      this.flora.push({ image: img, baseX: x, baseY: y, phase, swayable });
    }
  }

  update(delta: number, camera: Phaser.Cameras.Scene2D.Camera): void {
    this.time += delta * 0.001;
    const cam = camera.worldView;
    const left = cam.x - CULL_MARGIN;
    const right = cam.right + CULL_MARGIN;
    const top = cam.y - CULL_MARGIN;
    const bottom = cam.bottom + CULL_MARGIN;

    for (const f of this.flora) {
      if (f.baseX < left || f.baseX > right || f.baseY < top || f.baseY > bottom) {
        f.image.setVisible(false);
        continue;
      }
      f.image.setVisible(true);

      if (f.swayable) {
        const sx = Math.sin(this.time * 1.2 + f.phase) * 1.5;
        const sy = Math.cos(this.time * 0.8 + f.phase * 1.3) * 0.8;
        f.image.setPosition(f.baseX + sx, f.baseY + sy);
      }
    }
  }

  destroy(): void {
    for (const f of this.flora) f.image.destroy();
    this.flora = [];
    this.time = 0;
  }
}
