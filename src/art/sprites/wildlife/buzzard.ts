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
const BUZZARD_BAR = 0xd8c098;
const BUZZARD_BAR_DARK = 0x18120c;
const BUZZARD_BEAK = 0x1a1208;
const BUZZARD_TALON = 0xc89060;
const BUZZARD_EYE = 0xf0c020; // golden eye — the distinctive field mark

function drawBuzzardBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  flapping: boolean,
): void {
  const wingDy = flapping ? -2 : 0;

  // Faint ground shadow just beneath the bird — visible because it's flying.
  g.fillStyle(0x000000, 0.15);
  g.fillEllipse(cx, cy + 9, 18, 2);

  // Dark under-silhouette first; this keeps the bird readable when
  // scaled down over moor textures.
  g.fillStyle(BUZZARD_WING_TIP, 1);
  g.fillTriangle(cx - 1, cy - 1, cx - 15, cy - 5 + wingDy, cx - 15, cy + 3 + wingDy);
  g.fillTriangle(cx + 1, cy - 1, cx + 15, cy - 5 + wingDy, cx + 15, cy + 3 + wingDy);

  // Body
  g.fillStyle(BUZZARD_BODY, 1);
  g.fillEllipse(cx, cy, 5, 8);

  // Breast — lighter belly stripe with darker chest band (buzzard field mark).
  g.fillStyle(BUZZARD_BREAST, 1);
  g.fillEllipse(cx, cy + 1, 3, 5);
  g.fillStyle(BUZZARD_BAR_DARK, 0.8);
  g.fillRect(cx - 1, cy - 1, 3, 1);

  // Wings — spread flat (idle) or angled up (flap). Pixel wedges.
  g.fillStyle(BUZZARD_BODY, 1);
  g.fillTriangle(cx - 2, cy - 1, cx - 14, cy - 4 + wingDy, cx - 14, cy + 2 + wingDy);
  g.fillTriangle(cx + 2, cy - 1, cx + 14, cy - 4 + wingDy, cx + 14, cy + 2 + wingDy);

  // Wing trailing edge — darker line that anchors the wing chord.
  g.fillStyle(BUZZARD_BAR_DARK, 0.7);
  g.fillRect(cx - 13, cy + 1 + wingDy, 11, 1);
  g.fillRect(cx + 3, cy + 1 + wingDy, 11, 1);

  // Five fingered primaries per wing — separated wedges, the buzzard signature.
  g.fillStyle(BUZZARD_WING_TIP, 1);
  for (const ox of [-15, -13, -11, -9, -7]) {
    g.fillRect(cx + ox, cy - 1 + wingDy, 1, 4);
  }
  for (const ox of [7, 9, 11, 13, 15]) {
    g.fillRect(cx + ox, cy - 1 + wingDy, 1, 4);
  }
  // Pale wing bars — strengthened so the primary contrast reads at 1x.
  g.fillStyle(BUZZARD_BAR, 0.95);
  g.fillRect(cx - 11, cy - 2 + wingDy, 7, 1);
  g.fillRect(cx + 5, cy - 2 + wingDy, 7, 1);
  g.fillStyle(BUZZARD_BAR, 0.7);
  g.fillRect(cx - 9, cy + wingDy, 4, 1);
  g.fillRect(cx + 6, cy + wingDy, 4, 1);

  // Head with hooked beak — top-down so the hook reads as a triangular notch.
  g.fillStyle(BUZZARD_BODY_DARK, 1);
  g.fillCircle(cx, cy - 4, 2.2);
  g.fillStyle(BUZZARD_BEAK, 1);
  g.fillTriangle(cx - 1, cy - 6, cx + 1, cy - 6, cx, cy - 7.5);
  g.fillRect(cx, cy - 6, 1, 1);

  // Golden eye glints, one each side of the head.
  g.fillStyle(BUZZARD_EYE, 1);
  g.fillRect(cx - 1, cy - 5, 1, 1);
  g.fillRect(cx + 1, cy - 5, 1, 1);

  // Legs and talons — small but visible against the body when soaring.
  g.fillStyle(BUZZARD_TALON, 1);
  g.fillRect(cx - 1, cy + 3, 1, 2);
  g.fillRect(cx + 1, cy + 3, 1, 2);
  g.fillStyle(BUZZARD_BEAK, 1);
  g.fillRect(cx - 2, cy + 5, 1, 1);
  g.fillRect(cx, cy + 5, 1, 1);
  g.fillRect(cx + 2, cy + 5, 1, 1);

  // Tail — fan wedge with dark terminal band, the diagnostic buzzard mark.
  g.fillStyle(BUZZARD_BODY, 1);
  g.fillTriangle(cx - 3, cy + 5, cx + 3, cy + 5, cx, cy + 10);
  g.fillStyle(BUZZARD_BAR, 0.95);
  g.fillRect(cx - 2, cy + 6, 4, 1);
  g.fillStyle(BUZZARD_BAR_DARK, 0.95);
  g.fillRect(cx - 2, cy + 8, 4, 1);

  // Glide trail — two faint dot pairs behind the wings on flap frame.
  if (flapping) {
    g.fillStyle(0xfff8e8, 0.4);
    g.fillCircle(cx - 14, cy + 5, 0.8);
    g.fillCircle(cx + 14, cy + 5, 0.8);
    g.fillStyle(0xfff8e8, 0.22);
    g.fillCircle(cx - 12, cy + 6, 0.6);
    g.fillCircle(cx + 12, cy + 6, 0.6);
  }
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
