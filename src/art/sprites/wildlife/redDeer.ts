/**
 * Scottish red deer — 40x28 procedural sprite. Dignified highland stag,
 * right-facing, with forked antlers, dished face, and tawny coat.
 * Frame 0 = idle (standing, head up), Frame 1 = walking (diagonal leg shift).
 */
import Phaser from 'phaser';

export const RED_DEER_CANVAS_W = 40;
export const RED_DEER_CANVAS_H = 28;

const DEER_BODY = 0xa8764a;
const DEER_BODY_DARK = 0x6b4828;
const DEER_BELLY = 0xd4b080;
const DEER_ANTLER = 0x3a2818;
const DEER_HOOF = 0x1a1108;
const DEER_EYE = 0x1a1410;
const DEER_OUTLINE = 0x2a1a08;

function drawRedDeerBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  walking: boolean,
): void {
  const legShift = walking ? 1 : 0;

  // Outline
  g.fillStyle(DEER_OUTLINE, 1);
  g.fillEllipse(cx, cy + 1, 26, 14);

  // Body
  g.fillStyle(DEER_BODY, 1);
  g.fillEllipse(cx, cy, 24, 12);

  // Belly highlight
  g.fillStyle(DEER_BELLY, 1);
  g.fillEllipse(cx, cy + 3, 18, 6);

  // Neck + head (right-facing)
  g.fillStyle(DEER_BODY, 1);
  g.fillTriangle(cx + 9, cy - 2, cx + 13, cy - 9, cx + 11, cy - 1);
  g.fillCircle(cx + 13, cy - 9, 4);

  // Snout
  g.fillStyle(DEER_BODY_DARK, 1);
  g.fillEllipse(cx + 15, cy - 7, 3, 2);

  // Antlers — two uprights with side tines
  g.fillStyle(DEER_ANTLER, 1);
  g.fillRect(cx + 11, cy - 14, 1, 4);
  g.fillRect(cx + 13, cy - 14, 1, 4);
  g.fillRect(cx + 9, cy - 13, 2, 1);
  g.fillRect(cx + 14, cy - 13, 2, 1);

  // Eye
  g.fillStyle(DEER_EYE, 1);
  g.fillRect(cx + 14, cy - 10, 1, 1);

  // Legs — front pair and hind pair, alternating on walk
  g.fillStyle(DEER_BODY_DARK, 1);
  g.fillRect(cx - 9, cy + 5, 2, 7 + legShift);
  g.fillRect(cx - 4, cy + 5, 2, 7 - legShift);
  g.fillRect(cx + 4, cy + 5, 2, 7 - legShift);
  g.fillRect(cx + 8, cy + 5, 2, 7 + legShift);

  // Hooves
  g.fillStyle(DEER_HOOF, 1);
  g.fillRect(cx - 9, cy + 11 + legShift, 2, 1);
  g.fillRect(cx - 4, cy + 11 - legShift, 2, 1);
  g.fillRect(cx + 4, cy + 11 - legShift, 2, 1);
  g.fillRect(cx + 8, cy + 11 + legShift, 2, 1);
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
