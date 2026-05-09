/**
 * `pickup_cairn_stone` — a small highland stone the haggis adds to a
 * memory cairn (DESIGN_IDEAS §1 Cairn Stacking). Walking over a stone
 * "stacks" it; three stones stacked over a run trigger the Cairn
 * Blessing — full heal + a sustained pickup-radius pulse.
 *
 * Visually a 14×10 weathered field-stone: slate-grey body with a
 * lighter top highlight (sun-on-the-moor) + a darker base shadow,
 * a green moss tuft on the upper-left edge (highland authenticity),
 * and a hairline crack running diagonal — the kind of stone you'd
 * find on a Munro path waymarker.
 *
 * Tonal palette: Wild (slate + moss + bracken-shadow) per
 * ART_STYLE_BIBLE.md — the cairn is a moor-bound pilgrimage marker,
 * not a hearth-warm collectible.
 *
 * Registered in `bakePickups()` so the texture is cached before any
 * `scene.add.image('pickup_cairn_stone', …)` call from PickupSpawner.
 */
import * as Phaser from 'phaser';

export const CAIRN_STONE_TEXTURE_KEY = 'pickup_cairn_stone';

export function bakeCairnStone(scene: Phaser.Scene): void {
  const w = 14;
  const h = 10;
  const g = scene.add.graphics();

  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(w / 2, h - 1, w - 3, 2);

  g.fillStyle(0x6a6e74, 1);
  g.fillRoundedRect(1, 2, w - 2, h - 3, 2);

  g.fillStyle(0x8a8e94, 1);
  g.fillRoundedRect(2, 2, w - 4, 2, 1);

  g.fillStyle(0x4a4e54, 1);
  g.fillRoundedRect(2, h - 3, w - 4, 1, 1);

  g.fillStyle(0x5e7a4a, 1);
  g.fillRect(2, 2, 2, 1);
  g.fillStyle(0x4a6238, 1);
  g.fillRect(2, 3, 1, 1);

  g.lineStyle(1, 0x4a4e54, 0.7);
  g.beginPath();
  g.moveTo(5, 3);
  g.lineTo(9, h - 3);
  g.strokePath();

  g.generateTexture(CAIRN_STONE_TEXTURE_KEY, w, h);
  g.destroy();
}
