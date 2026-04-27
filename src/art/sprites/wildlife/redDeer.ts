/**
 * Scottish red deer — 40x28 procedural sprite. Dignified highland stag,
 * right-facing, with forked antlers, dished face, and tawny coat.
 * Frame 0 = idle (standing, head up), Frame 1 = walking (diagonal leg shift).
 */
import * as Phaser from 'phaser';

export const RED_DEER_CANVAS_W = 40;
export const RED_DEER_CANVAS_H = 28;

const DEER_BODY = 0xa8764a;
const DEER_BODY_DARK = 0x6b4828;
const DEER_BELLY = 0xd4b080;
const DEER_ANTLER = 0x3a2818;
const DEER_ANTLER_LIGHT = 0x5a3e22;
const DEER_HOOF_DARK = 0x080604;
const DEER_HOOF_LIGHT = 0x2a1808;
const DEER_EYE = 0x1a1410;
const DEER_OUTLINE = 0x2a1a08;
const DEER_RUMP = 0xfff0d0;

function drawRedDeerBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  walking: boolean,
): void {
  const legShift = walking ? 2 : 0;

  // Ground shadow under the body.
  g.fillStyle(0x150c04, 0.35);
  g.fillEllipse(cx, cy + 13, 26, 3);

  // Outline
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillEllipse(cx, cy + 1, 26, 14);

  // Body
  g.fillStyle(DEER_BODY, 1);
  g.fillEllipse(cx, cy, 24, 12);

  // Belly highlight
  g.fillStyle(DEER_BELLY, 1);
  g.fillEllipse(cx, cy + 3, 18, 6);

  // White rump patch — larger and sharper, the strongest deer cue at tiny scale.
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillEllipse(cx - 10, cy - 1, 6, 7);
  g.fillStyle(DEER_RUMP, 1);
  g.fillEllipse(cx - 10, cy - 1, 5, 6);
  g.fillStyle(0xc8b090, 0.9);
  g.fillEllipse(cx - 10, cy + 1, 4, 2);

  // Short tail with cream tip on the rump patch.
  g.fillStyle(DEER_BODY_DARK, 1);
  g.fillTriangle(cx - 13, cy - 2, cx - 16, cy - 4, cx - 13, cy + 1);
  g.fillStyle(DEER_RUMP, 1);
  g.fillRect(cx - 16, cy - 4, 1, 1);

  // Neck + head (right-facing)
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillTriangle(cx + 8, cy - 3, cx + 14, cy - 10, cx + 12, cy);
  g.fillStyle(DEER_BODY, 1);
  g.fillTriangle(cx + 9, cy - 2, cx + 13, cy - 9, cx + 11, cy - 1);
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillCircle(cx + 13, cy - 9, 5);
  g.fillStyle(DEER_BODY, 1);
  g.fillCircle(cx + 13, cy - 9, 4);

  // Cream throat patch — adds species polish.
  g.fillStyle(DEER_BELLY, 0.85);
  g.fillEllipse(cx + 11, cy - 6, 3, 2);

  // Snout
  g.fillStyle(DEER_BODY_DARK, 1);
  g.fillEllipse(cx + 15, cy - 7, 3, 2);
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillRect(cx + 16, cy - 7, 1, 1);

  // Antlers — taller forked silhouette with side tines (5 per side: brow, bay, trez, top fork x2).
  // Main beams.
  g.fillStyle(DEER_ANTLER, 1);
  g.fillRect(cx + 10, cy - 17, 1, 8);
  g.fillRect(cx + 14, cy - 17, 1, 8);
  // Brow tine (low, forward).
  g.fillRect(cx + 11, cy - 11, 2, 1);
  g.fillRect(cx + 12, cy - 12, 1, 1);
  g.fillRect(cx + 16, cy - 11, 2, 1);
  g.fillRect(cx + 17, cy - 12, 1, 1);
  // Bay tine (mid).
  g.fillRect(cx + 8, cy - 13, 2, 1);
  g.fillRect(cx + 7, cy - 14, 1, 1);
  g.fillRect(cx + 15, cy - 13, 3, 1);
  g.fillRect(cx + 18, cy - 14, 1, 1);
  // Trez tine (upper).
  g.fillRect(cx + 9, cy - 15, 2, 1);
  g.fillRect(cx + 14, cy - 15, 3, 1);
  // Top fork (crown).
  g.fillRect(cx + 9, cy - 17, 1, 1);
  g.fillRect(cx + 11, cy - 18, 1, 2);
  g.fillRect(cx + 13, cy - 18, 1, 2);
  g.fillRect(cx + 15, cy - 17, 1, 1);
  // Antler highlight pass — warm rim on the leading edge.
  g.fillStyle(DEER_ANTLER_LIGHT, 0.9);
  g.fillRect(cx + 14, cy - 16, 1, 6);
  g.fillRect(cx + 11, cy - 18, 1, 1);

  // Eye with shine.
  g.fillStyle(DEER_EYE, 1);
  g.fillRect(cx + 14, cy - 10, 1, 1);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx + 14.4, cy - 10.4, 0.5, 0.5);

  // Ear — subtle warm wedge behind the head.
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillTriangle(cx + 10, cy - 11, cx + 9, cy - 14, cx + 12, cy - 11);
  g.fillStyle(DEER_BODY_DARK, 1);
  g.fillTriangle(cx + 10, cy - 11, cx + 10, cy - 13, cx + 11, cy - 11);

  // Legs — front pair and hind pair with stronger walk shift.
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillRect(cx - 9, cy + 5, 2, 8 + legShift);
  g.fillRect(cx - 4, cy + 5, 2, 8 - legShift);
  g.fillRect(cx + 4, cy + 5, 2, 8 - legShift);
  g.fillRect(cx + 8, cy + 5, 2, 8 + legShift);
  g.fillStyle(DEER_BODY_DARK, 1);
  g.fillRect(cx - 9, cy + 5, 1, 7 + legShift);
  g.fillRect(cx - 4, cy + 5, 1, 7 - legShift);
  g.fillRect(cx + 4, cy + 5, 1, 7 - legShift);
  g.fillRect(cx + 8, cy + 5, 1, 7 + legShift);

  // Cloven hooves — two-tone for contrast against ground.
  g.fillStyle(DEER_HOOF_DARK, 1);
  g.fillRect(cx - 9, cy + 12 + legShift, 2, 2);
  g.fillRect(cx - 4, cy + 12 - legShift, 2, 2);
  g.fillRect(cx + 4, cy + 12 - legShift, 2, 2);
  g.fillRect(cx + 8, cy + 12 + legShift, 2, 2);
  g.fillStyle(DEER_HOOF_LIGHT, 1);
  g.fillRect(cx - 9, cy + 12 + legShift, 2, 1);
  g.fillRect(cx - 4, cy + 12 - legShift, 2, 1);
  g.fillRect(cx + 4, cy + 12 - legShift, 2, 1);
  g.fillRect(cx + 8, cy + 12 + legShift, 2, 1);

  // Fine back highlight along the shoulder line.
  g.fillStyle(0xd8b080, 0.75);
  g.fillRect(cx - 8, cy - 5, 11, 1);

  // Breath plume on idle — two warm cream pixels off the muzzle.
  if (!walking) {
    g.fillStyle(0xfff8e8, 0.7);
    g.fillCircle(cx + 18, cy - 6, 1);
    g.fillStyle(0xfff8e8, 0.45);
    g.fillCircle(cx + 19.5, cy - 7, 0.8);
  }
}

export function bakeRedDeer(scene: Phaser.Scene): void {
  const w = RED_DEER_CANVAS_W;
  const h = RED_DEER_CANVAS_H;
  const cx = w / 2;
  const cy = h / 2;

  const gIdle = scene.add.graphics();
  drawRedDeerBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_red_deer_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawRedDeerBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_red_deer_move', w, h);
  gMove.destroy();
}
