/**
 * Golden eagle — 40x24 procedural sprite. Broad soaring silhouette with
 * fingered primaries, golden nape, hooked beak, and barred tail.
 * Frame idle = wings level, Frame move = lifted power beat.
 */
import * as Phaser from 'phaser';

export const GOLDEN_EAGLE_CANVAS_W = 40;
export const GOLDEN_EAGLE_CANVAS_H = 24;

const EAGLE_OUTLINE = 0x151008;
const EAGLE_DARK = 0x2a2018;
const EAGLE_BODY = 0x4a3420;
const EAGLE_GOLD_DEEP = 0xa07020;
const EAGLE_GOLD = 0xe8b048;
const EAGLE_GOLD_BRIGHT = 0xfff0a8;
const EAGLE_BARS = 0xd4b080;
const EAGLE_UNDERWING = 0xf2e0b8;
const EAGLE_BEAK = 0xffc840;
const EAGLE_BEAK_DARK = 0x4a2a0a;

function drawGoldenEagleBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  beating: boolean,
): void {
  const wingY = beating ? -3 : 0;

  // Faint shadow on the ground beneath — the eagle is huge and casts.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 11, 26, 2.5);

  // Huge dark wing silhouette — broader chord than the buzzard.
  g.fillStyle(EAGLE_OUTLINE, 1);
  g.fillTriangle(cx - 1, cy - 1, cx - 19, cy - 7 + wingY, cx - 17, cy + 8 + wingY);
  g.fillTriangle(cx + 1, cy - 1, cx + 19, cy - 7 + wingY, cx + 17, cy + 8 + wingY);
  g.fillStyle(EAGLE_BODY, 1);
  g.fillTriangle(cx - 2, cy, cx - 17, cy - 5 + wingY, cx - 15, cy + 6 + wingY);
  g.fillTriangle(cx + 2, cy, cx + 17, cy - 5 + wingY, cx + 15, cy + 6 + wingY);

  // White underwing flash — golden eagle field mark, separates it from buzzard.
  g.fillStyle(EAGLE_UNDERWING, 0.85);
  g.fillRect(cx - 12, cy + 1 + wingY, 5, 2);
  g.fillRect(cx + 7, cy + 1 + wingY, 5, 2);
  g.fillStyle(EAGLE_GOLD, 0.7);
  g.fillRect(cx - 11, cy + 2 + wingY, 4, 1);
  g.fillRect(cx + 7, cy + 2 + wingY, 4, 1);

  // Long, separated fingered primaries — six per wing, wider gaps than buzzard.
  g.fillStyle(EAGLE_DARK, 1);
  for (const ox of [-19, -17, -14, -11, -8, -5]) {
    g.fillRect(cx + ox, cy + 3 + wingY, 1, 7);
  }
  for (const ox of [4, 7, 10, 13, 16, 18]) {
    g.fillRect(cx + ox, cy + 3 + wingY, 1, 7);
  }
  g.fillStyle(EAGLE_OUTLINE, 1);
  for (const ox of [-19, -16, -13, 12, 15, 18]) {
    g.fillRect(cx + ox, cy + 9 + wingY, 1, 1);
  }
  // Pale wing bars (coverts pattern).
  g.fillStyle(EAGLE_BARS, 0.85);
  g.fillRect(cx - 14, cy - 2 + wingY, 8, 1);
  g.fillRect(cx + 6, cy - 2 + wingY, 8, 1);
  g.fillRect(cx - 12, cy + 3 + wingY, 6, 1);
  g.fillRect(cx + 6, cy + 3 + wingY, 6, 1);

  // Body and golden nape — bigger and warmer so the species reads at a glance.
  g.fillStyle(EAGLE_OUTLINE, 1);
  g.fillEllipse(cx, cy + 2, 9, 13);
  g.fillCircle(cx + 1, cy - 5, 4);
  g.fillStyle(EAGLE_DARK, 1);
  g.fillEllipse(cx, cy + 2, 7, 11);
  // Nape gradient — deep gold base, brighter centre, hot core.
  g.fillStyle(EAGLE_GOLD_DEEP, 1);
  g.fillEllipse(cx, cy - 3, 7, 7);
  g.fillStyle(EAGLE_GOLD, 1);
  g.fillEllipse(cx, cy - 3, 6, 6);
  g.fillStyle(EAGLE_GOLD_BRIGHT, 0.9);
  g.fillEllipse(cx + 1, cy - 4, 3, 3);
  // Head sits forward of the nape.
  g.fillStyle(EAGLE_DARK, 1);
  g.fillCircle(cx + 1, cy - 5, 3);

  // Hooked beak — pronounced curve down into a darker tip notch.
  g.fillStyle(EAGLE_OUTLINE, 1);
  g.fillTriangle(cx + 3, cy - 6, cx + 8, cy - 4, cx + 3, cy - 2);
  g.fillStyle(EAGLE_BEAK, 1);
  g.fillTriangle(cx + 3, cy - 5, cx + 7, cy - 4, cx + 3, cy - 3);
  g.fillStyle(EAGLE_BEAK_DARK, 1);
  g.fillRect(cx + 6, cy - 4, 2, 2);
  g.fillRect(cx + 7, cy - 3, 1, 1);
  // Cere ridge.
  g.fillStyle(EAGLE_GOLD, 1);
  g.fillRect(cx + 2, cy - 5, 2, 1);

  // Eye — sharp gold glint that meets the viewer.
  g.fillStyle(EAGLE_BEAK, 1);
  g.fillRect(cx + 2, cy - 5, 1, 1);
  g.fillStyle(0xffffff, 0.95);
  g.fillRect(cx + 2.3, cy - 5.3, 0.5, 0.5);

  // Tail fan with two-bar pattern.
  g.fillStyle(EAGLE_OUTLINE, 1);
  g.fillTriangle(cx - 4, cy + 8, cx + 4, cy + 8, cx, cy + 13);
  g.fillStyle(EAGLE_BODY, 1);
  g.fillTriangle(cx - 3, cy + 8, cx + 3, cy + 8, cx, cy + 12);
  g.fillStyle(EAGLE_BARS, 0.9);
  g.fillRect(cx - 2, cy + 9, 4, 1);
  g.fillRect(cx - 2, cy + 11, 4, 1);
}

export function bakeGoldenEagle(scene: Phaser.Scene): void {
  const w = GOLDEN_EAGLE_CANVAS_W;
  const h = GOLDEN_EAGLE_CANVAS_H;
  const cx = w / 2;
  const cy = 11;

  const gIdle = scene.add.graphics();
  drawGoldenEagleBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_golden_eagle_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawGoldenEagleBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_golden_eagle_move', w, h);
  gMove.destroy();
}
