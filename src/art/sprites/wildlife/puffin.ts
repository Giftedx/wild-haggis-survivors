/**
 * Atlantic puffin — 24x28 procedural sprite. Compact seabird with black back,
 * white face and belly, orange beak, orange feet, and small wing beats.
 * Frame idle = perched hover, Frame move = quick wing flick.
 */
import * as Phaser from 'phaser';

export const PUFFIN_CANVAS_W = 24;
export const PUFFIN_CANVAS_H = 28;

const PUFFIN_OUTLINE = 0x101014;
const PUFFIN_BLACK = 0x202028;
const PUFFIN_WHITE = 0xf2ead8;
const PUFFIN_WHITE_SHADOW = 0xc8c0b0;
const PUFFIN_GREY = 0x8a8a90;
const PUFFIN_BEAK_BASE = 0xd86028;
const PUFFIN_BEAK_TIP = 0xffb450;
const PUFFIN_BEAK_BAND = 0xfff0c8;
const PUFFIN_FEET = 0xff8030;
const PUFFIN_EYE_RING = 0xff6020;
const PUFFIN_EYE = 0x100c08;

function drawPuffinBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  flapping: boolean,
): void {
  const wingLift = flapping ? -3 : 0;
  const bob = flapping ? -1 : 0;
  const y = cy + bob;

  // Faint shadow under perched feet.
  g.fillStyle(0x000000, 0.32);
  g.fillEllipse(cx, cy + 21, 10, 1.8);

  // Wings first, tucked or flicked out.
  g.fillStyle(PUFFIN_OUTLINE, 1);
  g.fillTriangle(cx - 4, y + 3, cx - 12, y + 1 + wingLift, cx - 6, y + 11);
  g.fillTriangle(cx + 4, y + 3, cx + 12, y + 1 + wingLift, cx + 6, y + 11);
  g.fillStyle(PUFFIN_BLACK, 1);
  g.fillTriangle(cx - 4, y + 4, cx - 10, y + 2 + wingLift, cx - 6, y + 10);
  g.fillTriangle(cx + 4, y + 4, cx + 10, y + 2 + wingLift, cx + 6, y + 10);
  // Wing tip fold — a brighter trailing bar so the wing has a leading edge.
  g.fillStyle(PUFFIN_GREY, 0.85);
  g.fillRect(cx - 10, y + 4 + wingLift, 4, 1);
  g.fillRect(cx + 6, y + 4 + wingLift, 4, 1);

  // Body and belly.
  g.fillStyle(PUFFIN_OUTLINE, 1);
  g.fillEllipse(cx, y + 8, 13, 17);
  g.fillStyle(PUFFIN_BLACK, 1);
  g.fillEllipse(cx, y + 8, 11, 15);
  g.fillStyle(PUFFIN_WHITE, 1);
  g.fillEllipse(cx, y + 9, 7, 11);
  // Subtle grey shadow band along the belly so the white isn't a flat oval.
  g.fillStyle(PUFFIN_WHITE_SHADOW, 0.6);
  g.fillEllipse(cx - 1, y + 12, 5, 4);
  g.fillStyle(PUFFIN_GREY, 0.45);
  g.fillRect(cx - 2, y + 14, 4, 1);

  // Head and white cheek mask — slightly larger oval for that signature face.
  g.fillStyle(PUFFIN_OUTLINE, 1);
  g.fillCircle(cx, y, 6);
  g.fillStyle(PUFFIN_BLACK, 1);
  g.fillCircle(cx, y, 5);
  g.fillStyle(PUFFIN_WHITE, 1);
  g.fillEllipse(cx + 1, y, 7, 6);
  // Pale cheek shading.
  g.fillStyle(PUFFIN_WHITE_SHADOW, 0.6);
  g.fillRect(cx, y + 2, 3, 1);

  // Bright triangular bill — 2-zone (dark base, bright tip) plus pale band.
  g.fillStyle(PUFFIN_OUTLINE, 1);
  g.fillTriangle(cx + 4, y - 3, cx + 12, y + 1, cx + 4, y + 5);
  g.fillStyle(PUFFIN_BEAK_BASE, 1);
  g.fillTriangle(cx + 5, y - 2, cx + 8, y + 1, cx + 5, y + 4);
  g.fillStyle(PUFFIN_BEAK_TIP, 1);
  g.fillTriangle(cx + 7, y - 1, cx + 11, y + 1, cx + 7, y + 3);
  // Pale yellow band that separates the two beak zones — the puffin signature.
  g.fillStyle(PUFFIN_BEAK_BAND, 1);
  g.fillRect(cx + 7, y, 1, 2);
  // Beak rictal line.
  g.fillStyle(PUFFIN_OUTLINE, 1);
  g.fillRect(cx + 5, y + 1, 6, 1);

  // Eye with bright orange eye ring — gives the face the iconic puffin pop.
  g.fillStyle(PUFFIN_EYE_RING, 1);
  g.fillCircle(cx + 2, y - 1, 1.6);
  g.fillStyle(PUFFIN_WHITE, 1);
  g.fillCircle(cx + 2, y - 1, 1.1);
  g.fillStyle(PUFFIN_EYE, 1);
  g.fillCircle(cx + 2, y - 1, 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 2.3, y - 1.3, 0.4);

  // Bright orange feet — webbed bar each side.
  g.fillStyle(PUFFIN_OUTLINE, 1);
  g.fillRect(cx - 5, y + 17, 4, 3);
  g.fillRect(cx + 1, y + 17, 4, 3);
  g.fillStyle(PUFFIN_FEET, 1);
  g.fillRect(cx - 4, y + 17, 3, 2);
  g.fillRect(cx + 1, y + 17, 3, 2);
  g.fillStyle(PUFFIN_BEAK_TIP, 0.85);
  g.fillRect(cx - 4, y + 17, 1, 2);
  g.fillRect(cx + 1, y + 17, 1, 2);
}

export function bakePuffin(scene: Phaser.Scene): void {
  const w = PUFFIN_CANVAS_W;
  const h = PUFFIN_CANVAS_H;
  const cx = w / 2;
  const cy = 7;

  const gIdle = scene.add.graphics();
  drawPuffinBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_puffin_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawPuffinBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_puffin_move', w, h);
  gMove.destroy();
}
