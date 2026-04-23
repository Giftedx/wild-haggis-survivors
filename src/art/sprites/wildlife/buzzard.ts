/**
 * Common buzzard — 32x20 procedural sprite. Broad-winged raptor silhouette,
 * soaring overhead. Golden eye is the key ID feature.
 * Frame idle = wings spread flat, Frame move = wings mid-flap (angled up).
 */
import * as Phaser from 'phaser';

export const BUZZARD_CANVAS_W = 32;
export const BUZZARD_CANVAS_H = 20;

const BUZZARD_BODY = 0x5a4838;
const BUZZARD_BODY_DARK = 0x3a2e22;
const BUZZARD_WING_TIP = 0x2a2018;
const BUZZARD_BREAST = 0xa89070;
const BUZZARD_EYE = 0xf0c020; // golden eye — the distinctive field mark

function drawBuzzardBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  flapping: boolean,
): void {
  const wingDy = flapping ? -2 : 0;

  // Body
  g.fillStyle(BUZZARD_BODY, 1);
  g.fillEllipse(cx, cy, 5, 8);

  // Breast — lighter belly stripe
  g.fillStyle(BUZZARD_BREAST, 1);
  g.fillEllipse(cx, cy + 1, 3, 5);

  // Wings — spread flat (idle) or angled up (flap). Pixel wedges.
  g.fillStyle(BUZZARD_BODY, 1);
  g.fillTriangle(cx - 2, cy - 1, cx - 14, cy - 3 + wingDy, cx - 14, cy + 1 + wingDy);
  g.fillTriangle(cx + 2, cy - 1, cx + 14, cy - 3 + wingDy, cx + 14, cy + 1 + wingDy);

  // Wing tips — darker primaries
  g.fillStyle(BUZZARD_WING_TIP, 1);
  g.fillRect(cx - 14, cy - 2 + wingDy, 3, 2);
  g.fillRect(cx + 11, cy - 2 + wingDy, 3, 2);

  // Head
  g.fillStyle(BUZZARD_BODY_DARK, 1);
  g.fillCircle(cx, cy - 4, 2);

  // Golden eye glint
  g.fillStyle(BUZZARD_EYE, 1);
  g.fillRect(cx, cy - 5, 1, 1);

  // Tail — wedge
  g.fillStyle(BUZZARD_BODY, 1);
  g.fillTriangle(cx - 2, cy + 5, cx + 2, cy + 5, cx, cy + 9);
}

export function bakeBuzzard(scene: Phaser.Scene): void {
  const w = BUZZARD_CANVAS_W;
  const h = BUZZARD_CANVAS_H;
  const cx = w / 2;
  const cy = h / 2;

  const gIdle = scene.add.graphics();
  drawBuzzardBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_buzzard_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawBuzzardBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_buzzard_move', w, h);
  gMove.destroy();
}
