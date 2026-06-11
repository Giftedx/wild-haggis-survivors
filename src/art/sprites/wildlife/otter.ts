/**
 * Eurasian otter — 36x22 procedural sprite. Long waterline body, tapered tail,
 * pale throat, bright eye, and whiskers for a loch-edge read.
 * Frame idle = low watchful stance, Frame move = bounding ripple.
 */
import * as Phaser from 'phaser';

export const OTTER_CANVAS_W = 36;
export const OTTER_CANVAS_H = 22;

const OTTER_OUTLINE = 0x20140c;
const OTTER_DARK = 0x4a2e18;
const OTTER_BODY = 0x6c4323;
const OTTER_WARM = 0x8a5a30;
const OTTER_THROAT = 0xf2d49a;
const OTTER_THROAT_BRIGHT = 0xfff0c8;
const OTTER_EYE = 0x100c08;
const OTTER_NOSE = 0x1a0e08;
const OTTER_WATER = 0x6ea8c8;

function drawOtterBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  bounding: boolean,
): void {
  const lift = bounding ? -1 : 0;
  const stretch = bounding ? 2 : 0;
  const y = cy + lift;

  // Water ripple line under the body — instant loch-edge cue.
  g.fillStyle(OTTER_WATER, 0.55);
  g.fillRect(cx - 13, cy + 11, 24, 1);
  g.fillStyle(OTTER_WATER, 0.35);
  g.fillRect(cx - 11, cy + 12, 20, 1);
  g.fillStyle(0xc8e0f2, 0.7);
  g.fillRect(cx - 8, cy + 11, 3, 1);
  g.fillRect(cx + 4, cy + 11, 3, 1);

  // Tapered paddle rudder tail — flatter, broader than a marten's bottle-brush.
  g.fillStyle(OTTER_OUTLINE, 1);
  g.fillTriangle(cx - 10, y + 4, cx - 20, y + 1, cx - 19, y + 9);
  g.fillStyle(OTTER_DARK, 1);
  g.fillTriangle(cx - 10, y + 5, cx - 18, y + 3, cx - 17, y + 8);
  g.fillStyle(OTTER_BODY, 0.9);
  g.fillTriangle(cx - 10, y + 6, cx - 16, y + 5, cx - 16, y + 7);

  // Long body and arched back — sleek, low waterline silhouette.
  g.fillStyle(OTTER_OUTLINE, 1);
  g.fillEllipse(cx - 1, y + 5, 25 + stretch, 9);
  g.fillStyle(OTTER_BODY, 1);
  g.fillEllipse(cx - 1, y + 5, 23 + stretch, 7);
  g.fillStyle(OTTER_WARM, 0.9);
  g.fillRect(cx - 9, y + 1, 14 + stretch, 2);
  // Wet sheen — bright back stripe so the otter reads as semi-aquatic.
  g.fillStyle(0xc89060, 0.7);
  g.fillRect(cx - 7, y + 2, 12 + stretch, 1);

  // Chest, shoulder, and head.
  g.fillStyle(OTTER_OUTLINE, 1);
  g.fillCircle(cx + 11, y + 1, 5);
  g.fillEllipse(cx + 16, y + 2, 7, 5);
  g.fillStyle(OTTER_BODY, 1);
  g.fillCircle(cx + 11, y + 1, 4);
  g.fillEllipse(cx + 16, y + 2, 6, 4);
  // Cream throat and chin — pale loch-otter cue.
  g.fillStyle(OTTER_THROAT, 1);
  g.fillEllipse(cx + 9, y + 5, 8, 4);
  g.fillRect(cx + 11, y + 3, 5, 2);
  g.fillStyle(OTTER_THROAT_BRIGHT, 0.85);
  g.fillEllipse(cx + 13, y + 4, 4, 1.5);

  // Round ear nubs.
  g.fillStyle(OTTER_OUTLINE, 1);
  g.fillCircle(cx + 9, y - 3, 1.6);
  g.fillStyle(OTTER_DARK, 1);
  g.fillCircle(cx + 9, y - 3, 1);

  // Face — eye, glint, nose tip.
  g.fillStyle(OTTER_EYE, 1);
  g.fillCircle(cx + 12, y, 1.2);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 12.3, y - 0.4, 0.55);
  g.fillStyle(OTTER_NOSE, 1);
  g.fillCircle(cx + 19, y + 1, 1);
  g.fillStyle(0xc89888, 0.7);
  g.fillRect(cx + 18.6, y + 0.7, 0.5, 0.5);

  // Whiskers — brighter cream, three each side, splayed.
  g.lineStyle(0.7, OTTER_THROAT_BRIGHT, 1);
  g.lineBetween(cx + 17, y + 1, cx + 21, y);
  g.lineBetween(cx + 17, y + 2, cx + 22, y + 2);
  g.lineBetween(cx + 17, y + 3, cx + 21, y + 4);

  // Webbed feet and bounding contact marks.
  const step = bounding ? 2 : 0;
  g.fillStyle(OTTER_DARK, 1);
  g.fillRect(cx - 7 - step, y + 9, 5, 1);
  g.fillRect(cx + 4 + step, y + 9, 5, 1);
  g.fillRect(cx - 2, y + 8, 4, 1);
  g.fillStyle(OTTER_OUTLINE, 1);
  g.fillRect(cx - 7 - step, y + 10, 5, 1);
  g.fillRect(cx + 4 + step, y + 10, 5, 1);
}

export function bakeOtter(scene: Phaser.Scene): void {
  const w = OTTER_CANVAS_W;
  const h = OTTER_CANVAS_H;
  const cx = w / 2;
  const cy = 9;

  const gIdle = scene.add.graphics();
  drawOtterBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_otter_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawOtterBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_otter_move', w, h);
  gMove.destroy();
}
