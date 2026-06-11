/**
 * Pine marten — 36x22 procedural sprite. Long, low mustelid silhouette with
 * a chocolate coat, cream bib, pointed face, and thick tail.
 * Frame idle = watchful prowl, Frame move = quick trotting stretch.
 */
import * as Phaser from 'phaser';

export const PINE_MARTEN_CANVAS_W = 36;
export const PINE_MARTEN_CANVAS_H = 22;

const MARTEN_OUTLINE = 0x20140c;
const MARTEN_BODY = 0x5a341c;
const MARTEN_DARK = 0x342010;
const MARTEN_WARM = 0x7a4a24;
const MARTEN_BIB = 0xf2d49a;
const MARTEN_BIB_BRIGHT = 0xfff0c0;
const MARTEN_EYE = 0x100c08;
const MARTEN_NOSE = 0x2a1208;

function drawPineMartenBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  trotting: boolean,
): void {
  const stretch = trotting ? 2 : 0;
  const lift = trotting ? -1 : 0;
  const y = cy + lift;

  // Soft contact shadow under the body.
  g.fillStyle(0x0c0804, 0.35);
  g.fillEllipse(cx - 1, cy + 12, 22, 2.5);

  // Tail: heavy and slightly raised, the clearest read at small scale.
  g.fillStyle(MARTEN_OUTLINE, 1);
  g.fillEllipse(cx - 13, y + 2, 13, 6);
  g.fillTriangle(cx - 18, y, cx - 10, y + 1, cx - 18, y + 6);
  g.fillStyle(MARTEN_DARK, 1);
  g.fillEllipse(cx - 13, y + 2, 11, 4);
  g.fillTriangle(cx - 17, y + 1, cx - 10, y + 2, cx - 17, y + 5);
  // Tail back-light strand so it doesn't flatten.
  g.fillStyle(MARTEN_WARM, 0.7);
  g.fillRect(cx - 14, y, 6, 1);

  // Long body.
  g.fillStyle(MARTEN_OUTLINE, 1);
  g.fillEllipse(cx - 1, y + 4, 24 + stretch, 9);
  g.fillStyle(MARTEN_BODY, 1);
  g.fillEllipse(cx - 1, y + 4, 22 + stretch, 7);
  g.fillStyle(MARTEN_WARM, 0.85);
  g.fillRect(cx - 10, y, 12 + stretch, 2);

  // Chest bib and throat patch — brighter so the cream cue dominates the read.
  g.fillStyle(MARTEN_OUTLINE, 1);
  g.fillEllipse(cx + 7, y + 6, 9, 5);
  g.fillStyle(MARTEN_BIB, 1);
  g.fillEllipse(cx + 7, y + 6, 8, 4);
  g.fillTriangle(cx + 6, y + 4, cx + 11, y + 4, cx + 8, y + 9);
  g.fillStyle(MARTEN_BIB_BRIGHT, 0.9);
  g.fillEllipse(cx + 7, y + 5, 5, 2);

  // Head with pointed muzzle and small round ears.
  g.fillStyle(MARTEN_OUTLINE, 1);
  g.fillCircle(cx + 11, y, 5);
  g.fillTriangle(cx + 13, y - 1, cx + 19, y + 1, cx + 13, y + 3);
  g.fillCircle(cx + 8, y - 4, 2.4);
  g.fillCircle(cx + 12, y - 4, 2.4);
  g.fillStyle(MARTEN_BODY, 1);
  g.fillCircle(cx + 11, y, 4);
  g.fillTriangle(cx + 13, y, cx + 18, y + 1, cx + 13, y + 2);
  g.fillCircle(cx + 8, y - 4, 1.8);
  g.fillCircle(cx + 12, y - 4, 1.8);
  // Ear inner pink.
  g.fillStyle(0xc89888, 0.85);
  g.fillCircle(cx + 8, y - 4, 0.8);
  g.fillCircle(cx + 12, y - 4, 0.8);
  // Pointed nose tip.
  g.fillStyle(MARTEN_NOSE, 1);
  g.fillCircle(cx + 18, y + 1, 1.1);
  g.fillStyle(0xc89888, 0.6);
  g.fillRect(cx + 17.6, y + 0.7, 0.5, 0.5);

  // Eye and brow shine.
  g.fillStyle(MARTEN_EYE, 1);
  g.fillCircle(cx + 12, y - 1, 1.2);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 12.3, y - 1.4, 0.5);
  g.fillStyle(MARTEN_BIB, 0.9);
  g.fillRect(cx + 9, y + 2, 3, 1);

  // Whiskers — short cream strands so the muzzle reads quick.
  g.lineStyle(0.7, 0xfff0d0, 0.9);
  g.lineBetween(cx + 16, y + 1, cx + 19.5, y);
  g.lineBetween(cx + 16, y + 2, cx + 19.5, y + 2);

  // Four fast little legs; the move frame alternates diagonals.
  const a = trotting ? 1 : 0;
  g.fillStyle(MARTEN_DARK, 1);
  g.fillRect(cx - 8 - a, y + 7, 2, 5 + a);
  g.fillRect(cx - 3 + a, y + 7, 2, 5 - a);
  g.fillRect(cx + 5 + a, y + 7, 2, 5 - a);
  g.fillRect(cx + 10 - a, y + 6, 2, 5 + a);
  g.fillStyle(MARTEN_OUTLINE, 1);
  g.fillRect(cx - 9 - a, y + 11 + a, 3, 1);
  g.fillRect(cx - 3 + a, y + 11 - a, 3, 1);
  g.fillRect(cx + 5 + a, y + 11 - a, 3, 1);
  g.fillRect(cx + 10 - a, y + 10 + a, 3, 1);
}

export function bakePineMarten(scene: Phaser.Scene): void {
  const w = PINE_MARTEN_CANVAS_W;
  const h = PINE_MARTEN_CANVAS_H;
  const cx = w / 2;
  const cy = 9;

  const gIdle = scene.add.graphics();
  drawPineMartenBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_pine_marten_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawPineMartenBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_pine_marten_move', w, h);
  gMove.destroy();
}
