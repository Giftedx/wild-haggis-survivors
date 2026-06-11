/**
 * `deco_cairn` — small moss-covered stone cairn with a rowan twig
 * poking out the top. Old Scottish waymarker (also: protection
 * against the fae per `docs/research/SCOTTISH_RESEARCH_DEEP.md` rowan
 * lore). Five irregular stones stacked, lichen + moss patches, two
 * red rowan berries on the twig — reads as "small ancient marker"
 * at gameplay scale.
 */

import * as Phaser from 'phaser';

const STONE_DEEP = 0x1a1a1c;
const STONE_BASE = 0x4a4a52;
const STONE_MID = 0x6a6a72;
const STONE_HI = 0x9aa0a8;
const MOSS_DARK = 0x1a4810;
const MOSS_MID = 0x3a7820;
const MOSS_HI = 0x6aa848;
const LICHEN = 0xc8b048;
const LICHEN_HI = 0xe6d068;
const TWIG_DARK = 0x2a1a08;
const TWIG_MID = 0x6a4818;
const ROWAN_BERRY = 0xc01818;
const ROWAN_HI = 0xff5040;
const LEAF_GREEN = 0x4a8420;

export function bakeCairn(scene: Phaser.Scene): void {
  const s = 28;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 2;

  // Soft contact shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 9, 18, 4);
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, cy + 9, 13, 2.4);

  // Stone 1 — base, wide and flat.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx, cy + 6, 16, 6);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx, cy + 6, 14, 5);
  g.fillStyle(STONE_MID, 0.95);
  g.fillEllipse(cx - 1, cy + 5, 11, 3);
  g.fillStyle(STONE_HI, 0.7);
  g.fillEllipse(cx - 2, cy + 4.4, 6, 1.2);

  // Stone 2 — mid-left.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx - 4, cy + 1, 10, 5);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx - 4, cy + 1, 8.4, 4);
  g.fillStyle(STONE_MID, 1);
  g.fillEllipse(cx - 4.6, cy + 0.4, 6, 2.4);
  g.fillStyle(STONE_HI, 0.85);
  g.fillEllipse(cx - 5.2, cy, 3.4, 1);

  // Stone 3 — mid-right.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx + 4, cy, 9, 4.5);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx + 4, cy, 7.6, 3.6);
  g.fillStyle(STONE_MID, 1);
  g.fillEllipse(cx + 3.4, cy - 0.4, 5.4, 2);
  g.fillStyle(STONE_HI, 0.85);
  g.fillEllipse(cx + 3, cy - 0.8, 3, 0.9);

  // Stone 4 — upper, the cap stone.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx - 1, cy - 4, 8, 4);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx - 1, cy - 4, 6.6, 3.2);
  g.fillStyle(STONE_MID, 1);
  g.fillEllipse(cx - 1.4, cy - 4.4, 4.6, 1.8);
  g.fillStyle(STONE_HI, 0.95);
  g.fillEllipse(cx - 2, cy - 4.8, 2.4, 0.7);

  // Stone 5 — small crown stone.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx + 0.5, cy - 7, 4.4, 2.4);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx + 0.5, cy - 7, 3.6, 2);
  g.fillStyle(STONE_HI, 0.85);
  g.fillEllipse(cx, cy - 7.4, 1.6, 0.6);

  // Moss patches — three irregular dabs across the stack.
  g.fillStyle(MOSS_DARK, 1);
  g.fillEllipse(cx - 6, cy + 2, 3.4, 1.6);
  g.fillEllipse(cx + 5, cy + 1.6, 2.6, 1.2);
  g.fillEllipse(cx - 2, cy - 2.8, 2.8, 1);
  g.fillStyle(MOSS_MID, 1);
  g.fillEllipse(cx - 6, cy + 1.6, 2.4, 1);
  g.fillEllipse(cx + 5, cy + 1.2, 2, 0.8);
  g.fillEllipse(cx - 2, cy - 3.2, 2.2, 0.6);
  g.fillStyle(MOSS_HI, 0.95);
  g.fillCircle(cx - 6.4, cy + 1.4, 0.5);
  g.fillCircle(cx + 4.4, cy + 1, 0.4);

  // Lichen crusts — orange-yellow patch on the cap stone.
  g.fillStyle(LICHEN, 1);
  g.fillCircle(cx - 2.4, cy - 5.4, 1.2);
  g.fillStyle(LICHEN_HI, 0.95);
  g.fillCircle(cx - 2.6, cy - 5.6, 0.6);
  g.fillStyle(LICHEN, 0.85);
  g.fillCircle(cx + 1, cy - 4.2, 0.6);

  // Rowan twig — rises from the top of the cairn at a slight angle.
  g.fillStyle(TWIG_DARK, 1);
  g.fillRect(cx + 0.6, cy - 12, 0.8, 6);
  g.fillStyle(TWIG_MID, 1);
  g.fillRect(cx + 0.8, cy - 11.6, 0.4, 5.2);
  // Side branch.
  g.fillStyle(TWIG_DARK, 1);
  g.fillRect(cx + 1, cy - 10.4, 2.6, 0.6);

  // Two red rowan berries — clustered at the tip.
  g.fillStyle(0x6a0000, 1);
  g.fillCircle(cx + 1.4, cy - 12.4, 1);
  g.fillCircle(cx - 0.4, cy - 12.6, 0.9);
  g.fillStyle(ROWAN_BERRY, 1);
  g.fillCircle(cx + 1.4, cy - 12.4, 0.7);
  g.fillCircle(cx - 0.4, cy - 12.6, 0.6);
  g.fillStyle(ROWAN_HI, 1);
  g.fillCircle(cx + 1.2, cy - 12.6, 0.3);
  g.fillCircle(cx - 0.5, cy - 12.8, 0.25);
  // Tiny rowan leaf (compound — three leaflets clustered).
  g.fillStyle(LEAF_GREEN, 0.95);
  g.fillEllipse(cx + 3.4, cy - 10.6, 1.4, 0.7);
  g.fillEllipse(cx + 4.4, cy - 11, 1.2, 0.6);

  g.generateTexture('deco_cairn', s, s);
  g.destroy();
}
