/**
 * `deco_antler_shed` — single shed red deer antler on the moor.
 * Stags shed yearly between Feb and April; the antler lies tine-up
 * with a mossy base and a few weathered cracks. Story-trace prop
 * that pairs naturally with the new cairn (waymarker + memento).
 */

import * as Phaser from 'phaser';

const BONE_OUTLINE = 0x3a2a14;
const BONE_BASE = 0xa88a4c;
const BONE_MID = 0xc8a868;
const BONE_HI = 0xeacc92;
const BONE_TIP = 0xfae6b8;
const BURR = 0x6a4818;
const MOSS_DARK = 0x1a4810;
const MOSS_MID = 0x3a7820;
const MOSS_HI = 0x6aa848;
const CRACK = 0x32200c;

export function bakeAntlerShed(scene: Phaser.Scene): void {
  const s = 32;
  const g = scene.add.graphics();
  const cx = s / 2;
  const cy = s / 2 + 4;

  // Contact shadow underneath the burr (the heavy end).
  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(cx - 6, cy + 6, 14, 3);
  g.fillStyle(0x000000, 0.4);
  g.fillEllipse(cx - 6, cy + 6, 9, 1.6);

  // Burr (pedicle base) — gnarly knobbly disc where the antler
  // detached from the skull. Sits low-left.
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx - 9, cy + 3, 6, 4.5);
  g.fillStyle(BURR, 1);
  g.fillEllipse(cx - 9, cy + 3, 4.8, 3.6);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx - 9, cy + 3, 3.6, 2.4);
  // Pearling — knobbly bone bumps around the burr.
  g.fillStyle(BONE_MID, 0.95);
  g.fillCircle(cx - 11, cy + 2, 0.7);
  g.fillCircle(cx - 7.4, cy + 2.4, 0.7);
  g.fillCircle(cx - 9, cy + 4.8, 0.7);
  g.fillCircle(cx - 11, cy + 4, 0.5);
  g.fillCircle(cx - 7, cy + 1, 0.5);

  // Main beam — diagonal up-and-right from the burr to upper-right.
  // Drawn as a stack of overlapping circles for the tapered curve.
  const beam: Array<[number, number, number]> = [
    [-7, 1, 2.8],
    [-4, -1, 2.6],
    [-1, -3, 2.4],
    [2, -5, 2.2],
    [5, -7, 2.0],
    [8, -9, 1.8],
    [11, -11, 1.6],
  ];
  for (const [dx, dy, r] of beam) {
    g.fillStyle(BONE_OUTLINE, 1);
    g.fillCircle(cx + dx, cy + dy, r + 0.6);
  }
  for (const [dx, dy, r] of beam) {
    g.fillStyle(BONE_BASE, 1);
    g.fillCircle(cx + dx, cy + dy, r);
  }
  for (const [dx, dy, r] of beam) {
    g.fillStyle(BONE_MID, 0.9);
    g.fillCircle(cx + dx - 0.4, cy + dy - 0.4, r * 0.7);
  }
  // Top-light streak across the beam.
  g.fillStyle(BONE_HI, 0.85);
  g.fillCircle(cx - 7, cy, 0.9);
  g.fillCircle(cx - 3, cy - 2.4, 0.9);
  g.fillCircle(cx + 1, cy - 4.8, 0.9);
  g.fillCircle(cx + 5, cy - 7.4, 0.7);

  // Brow tine (forward-pointing) — from near the burr.
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx - 4, cy + 2, 5, 1.8);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx - 4, cy + 2, 4.2, 1.4);
  g.fillStyle(BONE_MID, 0.95);
  g.fillEllipse(cx - 4.2, cy + 1.6, 3.6, 0.7);
  g.fillStyle(BONE_TIP, 0.95);
  g.fillEllipse(cx - 6, cy + 1.6, 1.4, 0.5);

  // Bay tine — branches up from mid-beam.
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx + 1, cy - 7, 1.6, 4.5);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx + 1, cy - 7, 1.2, 4);
  g.fillStyle(BONE_HI, 0.85);
  g.fillRect(cx + 0.6, cy - 9.6, 0.4, 4);
  g.fillStyle(BONE_TIP, 0.95);
  g.fillCircle(cx + 1, cy - 11, 0.6);

  // Trez tine — branches further along.
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx + 6, cy - 9.4, 1.4, 4);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx + 6, cy - 9.4, 1, 3.4);
  g.fillStyle(BONE_HI, 0.85);
  g.fillRect(cx + 5.7, cy - 11.4, 0.3, 3.6);
  g.fillStyle(BONE_TIP, 0.95);
  g.fillCircle(cx + 6, cy - 12.4, 0.5);

  // Crown tine — the tip of the main beam terminates in a small fork.
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx + 12.2, cy - 12.6, 1.4, 2.4);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx + 12.2, cy - 12.6, 1, 1.8);
  g.fillStyle(BONE_TIP, 0.95);
  g.fillCircle(cx + 12.2, cy - 13.4, 0.5);
  g.fillStyle(BONE_OUTLINE, 1);
  g.fillEllipse(cx + 13.4, cy - 11, 0.9, 1.6);
  g.fillStyle(BONE_BASE, 1);
  g.fillEllipse(cx + 13.4, cy - 11, 0.6, 1.2);
  g.fillStyle(BONE_TIP, 0.95);
  g.fillCircle(cx + 13.6, cy - 11.8, 0.4);

  // Hairline cracks along the beam.
  g.fillStyle(CRACK, 0.85);
  g.fillRect(cx - 5, cy - 0.4, 1.6, 0.4);
  g.fillRect(cx, cy - 4.4, 1.4, 0.4);
  g.fillRect(cx + 4, cy - 7.4, 1.2, 0.3);

  // Moss patch on the burr — life reclaiming the bone.
  g.fillStyle(MOSS_DARK, 1);
  g.fillEllipse(cx - 9, cy + 4.6, 3.4, 1.4);
  g.fillStyle(MOSS_MID, 1);
  g.fillEllipse(cx - 9, cy + 4.4, 2.6, 1);
  g.fillStyle(MOSS_HI, 0.95);
  g.fillCircle(cx - 9.6, cy + 4.2, 0.4);
  g.fillCircle(cx - 7.8, cy + 4.6, 0.4);

  g.generateTexture('deco_antler_shed', s, s);
  g.destroy();
}
