/**
 * Player-variant single-frame textures — one per VARIANT (`haggis_classic`,
 * `haggis_moor_runner`, etc.). These 9 textures back the menu preview,
 * the Chronicle + variant-select UI, and any place that draws a haggis
 * without needing the Phase-0 animation atlas.
 *
 * The animated gameplay haggis uses `bakeHaggisAtlas()` (state × frame)
 * which lives in `src/animation/textureAtlas.ts` — that stays next to
 * the atlas-key machinery. These single-frame textures use the same
 * shared body drawer so every menu preview matches the gameplay body.
 */

import * as Phaser from 'phaser';

import { drawHaggisBody } from '../../../animation/frameDrawers/haggisBodyDraw';
import { VARIANTS } from '../../../data/variants';
import type { VariantDef } from '../../../data/variants';
import { bakePlayerMoodSprites } from './moods';

const SPRITE_SIZE = 56;

function bakePlayerVariant(scene: Phaser.Scene, variant: VariantDef): void {
  const g = scene.add.graphics();
  drawHaggisBody(g, variant, {});
  g.generateTexture(variant.textureKey, SPRITE_SIZE, SPRITE_SIZE);
  g.destroy();
}

/** Bake the 9 single-frame player-variant textures. Called once from
 *  BootScene.generateAllTextures(). */
export function bakePlayerVariants(scene: Phaser.Scene): void {
  for (const variant of VARIANTS) {
    bakePlayerVariant(scene, variant);
  }
  bakePlayerMoodSprites(scene);
}
