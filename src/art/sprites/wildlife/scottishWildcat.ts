/**
 * Scottish wildcat — 34x24 procedural sprite. Stocky tabby silhouette with
 * blunt face, banded tail, cheek ruff, and dark stripes.
 * Frame idle = wary crouch, Frame move = low dart.
 */
import * as Phaser from 'phaser';

export const SCOTTISH_WILDCAT_CANVAS_W = 34;
export const SCOTTISH_WILDCAT_CANVAS_H = 24;

const WILDCAT_OUTLINE = 0x1a120c;
const WILDCAT_BODY = 0x8a6a48;
const WILDCAT_WARM = 0xb89070;
const WILDCAT_BACK = 0xa07a52;
const WILDCAT_STRIPE = 0x2a1808;
const WILDCAT_STRIPE_DARK = 0x100804;
const WILDCAT_CREAM = 0xeac890;
const WILDCAT_NOSE = 0x4a2818;
const WILDCAT_EYE = 0xffd040;
const WILDCAT_PUPIL = 0x080604;

function drawScottishWildcatBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  darting: boolean,
): void {
  const stretch = darting ? 2 : 0;
  const low = darting ? 1 : 0;
  const y = cy + low;

  // Contact shadow under the body.
  g.fillStyle(0x0a0604, 0.32);
  g.fillEllipse(cx - 1, cy + 13, 22, 2.5);

  // Thick blunt tail with bold black rings — the wildcat field mark.
  g.fillStyle(WILDCAT_OUTLINE, 1);
  g.fillEllipse(cx - 12, y + 2, 14, 7);
  g.fillStyle(WILDCAT_BODY, 1);
  g.fillEllipse(cx - 12, y + 2, 12, 5);
  g.fillStyle(WILDCAT_WARM, 0.85);
  g.fillRect(cx - 17, y + 1, 12, 1);
  // Four sharp tail rings — solid black bands, not dashes.
  g.fillStyle(WILDCAT_STRIPE_DARK, 1);
  g.fillRect(cx - 17, y, 2, 5);
  g.fillRect(cx - 13, y - 1, 2, 6);
  g.fillRect(cx - 9, y, 2, 5);
  g.fillRect(cx - 6, y + 1, 1, 3);
  // Black tail tip — diagnostic.
  g.fillStyle(WILDCAT_STRIPE_DARK, 1);
  g.fillEllipse(cx - 18, y + 2, 3, 4);

  // Stocky body with raised dorsal contour on the dart frame.
  const arch = darting ? -1 : 0;
  g.fillStyle(WILDCAT_OUTLINE, 1);
  g.fillEllipse(cx - 1, y + 5 + arch, 24 + stretch, 11);
  g.fillStyle(WILDCAT_BODY, 1);
  g.fillEllipse(cx - 1, y + 5 + arch, 22 + stretch, 9);
  g.fillStyle(WILDCAT_BACK, 0.95);
  g.fillEllipse(cx - 1, y + 4 + arch, 16 + stretch, 4);
  g.fillStyle(WILDCAT_WARM, 0.9);
  g.fillEllipse(cx - 1, y + 6 + arch, 14 + stretch, 5);

  // Tabby stripes across the back — broader and bolder.
  g.fillStyle(WILDCAT_STRIPE, 1);
  for (const ox of [-7, -3, 1, 5]) {
    g.fillRect(cx + ox, y + 1 + arch, 1, 6);
  }
  // Dorsal spine line.
  g.fillStyle(WILDCAT_STRIPE_DARK, 0.85);
  g.fillRect(cx - 8, y + 2 + arch, 14 + stretch, 1);

  // Face with ears and cheek ruff — taller ears with darker tufts.
  g.fillStyle(WILDCAT_OUTLINE, 1);
  g.fillCircle(cx + 10, y, 6);
  g.fillTriangle(cx + 5, y - 4, cx + 7, y - 11, cx + 10, y - 4);
  g.fillTriangle(cx + 12, y - 4, cx + 15, y - 11, cx + 16, y - 3);
  g.fillStyle(WILDCAT_BODY, 1);
  g.fillCircle(cx + 10, y, 5);
  g.fillTriangle(cx + 7, y - 4, cx + 7.8, y - 9, cx + 10, y - 4);
  g.fillTriangle(cx + 12, y - 4, cx + 14.2, y - 9, cx + 14, y - 3);
  // Inner ear pink.
  g.fillStyle(0xc8807a, 0.9);
  g.fillTriangle(cx + 8, y - 4, cx + 8.5, y - 7, cx + 9.5, y - 4);
  g.fillTriangle(cx + 12.5, y - 4, cx + 13.2, y - 7, cx + 13.5, y - 4);
  // Black ear tuft poking out.
  g.fillStyle(WILDCAT_STRIPE_DARK, 1);
  g.fillRect(cx + 7, y - 11, 1, 2);
  g.fillRect(cx + 15, y - 11, 1, 2);
  // Cheek ruff.
  g.fillStyle(WILDCAT_CREAM, 1);
  g.fillEllipse(cx + 12, y + 2, 6, 3);
  g.fillTriangle(cx + 6, y + 2, cx + 3, y + 5, cx + 8, y + 5);
  // Tabby face stripes — short forehead bars.
  g.fillStyle(WILDCAT_STRIPE, 0.95);
  g.fillRect(cx + 8, y - 3, 1, 2);
  g.fillRect(cx + 11, y - 3, 1, 2);

  // Eyes — gold with sharp pupil and shine.
  g.fillStyle(WILDCAT_EYE, 1);
  g.fillRect(cx + 9, y - 1, 2, 2);
  g.fillRect(cx + 12, y - 1, 2, 2);
  g.fillStyle(WILDCAT_PUPIL, 1);
  g.fillRect(cx + 9.5, y - 1, 1, 2);
  g.fillRect(cx + 12.5, y - 1, 1, 2);
  g.fillStyle(0xffffff, 0.9);
  g.fillRect(cx + 9.2, y - 1, 0.5, 0.5);
  g.fillRect(cx + 12.2, y - 1, 0.5, 0.5);

  // Pink-brown nose tip.
  g.fillStyle(WILDCAT_NOSE, 1);
  g.fillCircle(cx + 14, y + 2, 1);
  g.fillStyle(0xc89888, 0.7);
  g.fillRect(cx + 13.7, y + 1.7, 0.5, 0.5);

  // Whiskers.
  g.lineStyle(0.7, WILDCAT_CREAM, 1);
  g.lineBetween(cx + 13, y + 2, cx + 17, y + 1);
  g.lineBetween(cx + 13, y + 3, cx + 17, y + 4);
  g.lineBetween(cx + 13, y + 4, cx + 17, y + 5);

  // Low darting legs with paw pads.
  const step = darting ? 2 : 0;
  g.fillStyle(WILDCAT_STRIPE, 1);
  g.fillRect(cx - 7 - step, y + 9, 4 + step, 2);
  g.fillRect(cx + 3 + step, y + 9, 5, 2);
  g.fillRect(cx - 2, y + 9, 3, 1);
  g.fillStyle(WILDCAT_OUTLINE, 1);
  g.fillRect(cx - 7 - step, y + 11, 4 + step, 1);
  g.fillRect(cx + 3 + step, y + 11, 5, 1);
}

export function bakeScottishWildcat(scene: Phaser.Scene): void {
  const w = SCOTTISH_WILDCAT_CANVAS_W;
  const h = SCOTTISH_WILDCAT_CANVAS_H;
  const cx = w / 2;
  const cy = 10;

  const gIdle = scene.add.graphics();
  drawScottishWildcatBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_scottish_wildcat_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawScottishWildcatBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_scottish_wildcat_move', w, h);
  gMove.destroy();
}
