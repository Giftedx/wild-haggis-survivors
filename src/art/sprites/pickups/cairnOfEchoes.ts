/**
 * `cairn_of_echoes` — small stacked-stones silhouette with a soft
 * candle glow. Materialises at past-self death coords across runs
 * (The Moor Remembers, spec 2026-05-22). Distinct from
 * `pickup_cairn_stone` (single field-stone for Cairn Stacking).
 *
 * Three slate stones stacked tallest-to-shortest, weathered slate
 * palette per ART_STYLE_BIBLE.md (Wild tone — moor-bound), with a
 * warm honey halo at mid-stone reading as a small graveside candle
 * left for the dead.
 *
 * Registered in `bakePickups()` so the texture is cached before any
 * `GameScene.spawnCairnSprite` adds a sprite.
 */
import * as Phaser from 'phaser';

export const CAIRN_OF_ECHOES_TEXTURE_KEY = 'cairn_of_echoes';

export function bakeCairnOfEchoes(scene: Phaser.Scene): void {
  const w = 16;
  const h = 24;
  const g = scene.add.graphics();

  // Soft candle halo behind the stack — drawn first so stones overlay it.
  g.fillStyle(0xf4c878, 0.18);
  g.fillCircle(8, 14, 8);
  g.fillStyle(0xf4c878, 0.32);
  g.fillCircle(8, 12, 5);

  // Base stone (widest)
  g.fillStyle(0x3a4148, 1);
  g.fillRect(2, 16, 12, 8);
  g.fillStyle(0x4a5158, 1);
  g.fillRect(3, 16, 10, 7);
  g.fillStyle(0x5a6168, 1);
  g.fillRect(3, 16, 10, 2);

  // Middle stone
  g.fillStyle(0x3a4148, 1);
  g.fillRect(4, 8, 8, 8);
  g.fillStyle(0x5a6168, 1);
  g.fillRect(5, 8, 6, 7);
  g.fillStyle(0x6a7278, 1);
  g.fillRect(5, 8, 6, 2);

  // Top stone (smallest)
  g.fillStyle(0x4a5158, 1);
  g.fillRect(5, 2, 6, 6);
  g.fillStyle(0x6a7278, 1);
  g.fillRect(6, 2, 4, 5);
  g.fillStyle(0x7a8288, 1);
  g.fillRect(6, 2, 4, 1);

  // Hairline candle-glow centred on the middle stone — warm gold pinprick.
  g.fillStyle(0xf4c878, 0.7);
  g.fillCircle(8, 12, 1.6);
  g.fillStyle(0xfff0c0, 0.85);
  g.fillCircle(8, 12, 0.7);

  g.generateTexture(CAIRN_OF_ECHOES_TEXTURE_KEY, w, h);
  g.destroy();
}
