/**
 * `engineer_turret` — a small cairn-turret for the Engineer variant.
 *
 * Stone cairn base (three irregular stones, mossy) with a short thistle-
 * barrel poking out the front face. Reads as "mechanical cairn" at
 * gameplay scale — clearly a turret, clearly made of the same moor-stone
 * as the other cairns. Copper rivet detail on the barrel collar ties it
 * to the Engineer's accent palette.
 */

import * as Phaser from 'phaser';

const STONE_DEEP   = 0x1a1e1e;
const STONE_BASE   = 0x304040;
const STONE_MID    = 0x4a5c5c;
const STONE_HI     = 0x6a8080;
const MOSS_DARK    = 0x1a4010;
const MOSS_MID     = 0x3a7020;
const COPPER_DARK  = 0x7a4008;
const COPPER_MID   = 0xc8780a;
const COPPER_HI    = 0xf0a030;
const BARREL_DARK  = 0x1a2020;
const BARREL_MID   = 0x283030;

export function bakeEngineerTurret(scene: Phaser.Scene): void {
  const s = 36;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 2;

  // Soft contact shadow.
  g.fillStyle(0x000000, 0.20);
  g.fillEllipse(cx, cy + 11, 24, 5);
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(cx, cy + 11, 16, 3);

  // Stone 1 — base, wide and low.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx, cy + 8, 24, 8);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx, cy + 8, 22, 7);
  g.fillStyle(STONE_MID, 0.95);
  g.fillEllipse(cx - 2, cy + 7, 16, 4);
  g.fillStyle(STONE_HI, 0.65);
  g.fillEllipse(cx - 3, cy + 6, 8, 1.8);

  // Stone 2 — mid-left.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx - 6, cy + 2, 13, 7);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx - 6, cy + 2, 11, 6);
  g.fillStyle(STONE_MID, 1);
  g.fillEllipse(cx - 7, cy + 1, 8, 3.6);
  g.fillStyle(STONE_HI, 0.8);
  g.fillEllipse(cx - 8, cy + 0.4, 4.4, 1.4);

  // Stone 3 — mid-right, slightly forward.
  g.fillStyle(STONE_DEEP, 1);
  g.fillEllipse(cx + 5, cy + 1, 12, 6.5);
  g.fillStyle(STONE_BASE, 1);
  g.fillEllipse(cx + 5, cy + 1, 10, 5.5);
  g.fillStyle(STONE_MID, 1);
  g.fillEllipse(cx + 4, cy + 0.2, 7, 3.2);
  g.fillStyle(STONE_HI, 0.8);
  g.fillEllipse(cx + 3, cy - 0.4, 3.6, 1.2);

  // Moss patches on the base stone.
  g.fillStyle(MOSS_DARK, 1);
  g.fillEllipse(cx - 9, cy + 3.5, 4, 1.8);
  g.fillEllipse(cx + 8, cy + 3, 3.4, 1.5);
  g.fillStyle(MOSS_MID, 1);
  g.fillEllipse(cx - 9, cy + 3, 2.8, 1.2);
  g.fillEllipse(cx + 8, cy + 2.4, 2.2, 1);

  // Barrel collar — copper ring where barrel meets stone.
  g.fillStyle(COPPER_DARK, 1);
  g.fillRect(cx - 1, cy - 1.5, 8, 4);
  g.fillStyle(COPPER_MID, 1);
  g.fillRect(cx, cy - 1, 7, 3);
  g.fillStyle(COPPER_HI, 0.9);
  g.fillRect(cx + 1, cy - 0.5, 5, 1.4);

  // Barrel — projects right from the cairn face.
  g.fillStyle(BARREL_DARK, 1);
  g.fillRect(cx + 6, cy - 0.8, 10, 3.8);
  g.fillStyle(BARREL_MID, 1);
  g.fillRect(cx + 6.5, cy - 0.4, 9, 2.8);
  // Barrel highlight — top edge.
  g.fillStyle(STONE_HI, 0.45);
  g.fillRect(cx + 7, cy - 0.2, 8, 0.9);
  // Barrel tip — copper cap.
  g.fillStyle(COPPER_DARK, 1);
  g.fillRect(cx + 15, cy - 0.6, 2.4, 3.4);
  g.fillStyle(COPPER_MID, 1);
  g.fillRect(cx + 15.4, cy - 0.2, 1.6, 2.6);

  // Copper rivets on stone 2 — the engineer's mark.
  g.fillStyle(COPPER_DARK, 1);
  g.fillCircle(cx - 4.4, cy + 0.4, 1.1);
  g.fillCircle(cx - 8, cy + 2.4, 0.9);
  g.fillStyle(COPPER_HI, 1);
  g.fillCircle(cx - 4.2, cy + 0.2, 0.5);
  g.fillCircle(cx - 7.8, cy + 2.2, 0.4);

  g.generateTexture('engineer_turret', s, s);
  g.destroy();
}
