/**
 * Scottish red squirrel — 30x26 procedural sprite. Right-facing, with a
 * copper coat, pale belly, tufted ears, and a large curled brush tail.
 * Frame idle = alert crouch, Frame move = springing hop.
 */
import * as Phaser from 'phaser';

export const RED_SQUIRREL_CANVAS_W = 30;
export const RED_SQUIRREL_CANVAS_H = 26;

const SQUIRREL_OUTLINE = 0x2a1a10;
const SQUIRREL_RUSSET = 0xb85a24;
const SQUIRREL_DARK = 0x6f3218;
const SQUIRREL_BELLY = 0xe2b078;
const SQUIRREL_LIGHT = 0xd47a32;
const SQUIRREL_RIM = 0xf2a04a;
const SQUIRREL_EYE = 0x151008;
const SQUIRREL_NOSE = 0x3a1a0a;

function drawRedSquirrelBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  leaping: boolean,
): void {
  const hopY = leaping ? -2 : 0;
  const legShift = leaping ? 2 : 0;
  const y = cy + hopY;

  // Contact shadow under the body.
  g.fillStyle(0x1a0c04, 0.32);
  g.fillEllipse(cx, cy + 10, 14, 2.5);

  // Big curled brush tail, drawn first so the body sits in front.
  g.fillStyle(SQUIRREL_OUTLINE, 1);
  g.fillEllipse(cx - 9, y - 4, 12, 18);
  g.fillEllipse(cx - 12, y - 10, 8, 10);
  g.fillEllipse(cx - 9, y - 15, 5, 6);
  g.fillEllipse(cx - 6, y - 17, 4, 4);
  g.fillStyle(SQUIRREL_DARK, 1);
  g.fillEllipse(cx - 9, y - 4, 10, 16);
  g.fillEllipse(cx - 12, y - 10, 6, 8);
  g.fillEllipse(cx - 9, y - 15, 3, 4);
  g.fillEllipse(cx - 6, y - 17, 2.5, 2.5);
  g.fillStyle(SQUIRREL_RUSSET, 1);
  g.fillEllipse(cx - 8, y - 5, 7, 13);
  g.fillEllipse(cx - 11, y - 10, 4, 6);
  g.fillEllipse(cx - 9, y - 15, 2, 3);
  // Rim-lit fur strands along the brush curl edge.
  g.fillStyle(SQUIRREL_RIM, 1);
  g.fillRect(cx - 10, y - 12, 2, 6);
  g.fillRect(cx - 12, y - 6, 1, 4);
  g.fillStyle(SQUIRREL_LIGHT, 0.85);
  g.fillRect(cx - 9, y - 4, 1, 6);
  // Bright tip flick at the curl crest.
  g.fillStyle(0xffd080, 0.9);
  g.fillCircle(cx - 6, y - 17, 1.2);

  // Body and haunch.
  g.fillStyle(SQUIRREL_OUTLINE, 1);
  g.fillEllipse(cx, y + 4, 17, 10);
  g.fillCircle(cx - 5, y + 5, 5);
  g.fillStyle(SQUIRREL_RUSSET, 1);
  g.fillEllipse(cx, y + 4, 15, 8);
  g.fillCircle(cx - 5, y + 5, 4);
  g.fillStyle(SQUIRREL_BELLY, 1);
  g.fillEllipse(cx + 2, y + 6, 8, 4);
  // Belly highlight strip.
  g.fillStyle(0xfff0c8, 0.55);
  g.fillRect(cx + 1, y + 7, 5, 1);

  // Head, snout, and tufted ears — taller, sharper tufts so the species sells.
  g.fillStyle(SQUIRREL_OUTLINE, 1);
  g.fillCircle(cx + 7, y - 1, 5);
  g.fillTriangle(cx + 3, y - 5, cx + 4, y - 13, cx + 7, y - 5);
  g.fillTriangle(cx + 9, y - 5, cx + 11, y - 13, cx + 13, y - 4);
  g.fillStyle(SQUIRREL_RUSSET, 1);
  g.fillCircle(cx + 7, y - 1, 4);
  g.fillTriangle(cx + 4, y - 5, cx + 5, y - 11, cx + 7, y - 5);
  g.fillTriangle(cx + 9, y - 5, cx + 11, y - 11, cx + 12, y - 4);
  // Tuft hairs poking past the silhouette.
  g.fillStyle(SQUIRREL_OUTLINE, 1);
  g.fillRect(cx + 4, y - 13, 1, 2);
  g.fillRect(cx + 11, y - 13, 1, 2);
  g.fillStyle(SQUIRREL_DARK, 1);
  g.fillEllipse(cx + 11, y + 1, 4, 3);

  // Face marks — eye, highlight, nose.
  g.fillStyle(SQUIRREL_EYE, 1);
  g.fillCircle(cx + 8, y - 2, 1.2);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 8.4, y - 2.4, 0.55);
  g.fillStyle(SQUIRREL_NOSE, 1);
  g.fillCircle(cx + 12, y + 1, 1);
  g.fillStyle(0xffd0a8, 0.7);
  g.fillRect(cx + 11.7, y + 0.7, 0.5, 0.5);

  // Whisker pair so the muzzle reads from the moor.
  g.lineStyle(0.7, 0xfff0d0, 0.9);
  g.lineBetween(cx + 11, y + 2, cx + 14, y + 3);
  g.lineBetween(cx + 11, y + 3, cx + 14, y + 4);

  // Legs and paws. The move frame stretches the hind foot and tucks the forepaw.
  g.fillStyle(SQUIRREL_DARK, 1);
  g.fillRect(cx - 6 - legShift, y + 8, 5 + legShift, 1);
  g.fillRect(cx + 2, y + 8 - legShift, 4, 1);
  // Forepaw — clearer pixel cluster, raised when leaping.
  const foreY = leaping ? y + 3 : y + 4;
  g.fillRect(cx + 5, foreY, 2, 4);
  g.fillRect(cx + 4, foreY + 4, 3, 1);
  g.fillStyle(SQUIRREL_BELLY, 1);
  g.fillCircle(cx + 7, y + 6, 1);
  g.fillStyle(SQUIRREL_LIGHT, 1);
  g.fillRect(cx + 5, foreY + 1, 1, 2);
}

export function bakeRedSquirrel(scene: Phaser.Scene): void {
  const w = RED_SQUIRREL_CANVAS_W;
  const h = RED_SQUIRREL_CANVAS_H;
  const cx = w / 2;
  const cy = 15;

  const gIdle = scene.add.graphics();
  drawRedSquirrelBody(gIdle, cx, cy, false);
  gIdle.generateTexture('wildlife_red_squirrel_idle', w, h);
  gIdle.destroy();

  const gMove = scene.add.graphics();
  drawRedSquirrelBody(gMove, cx, cy, true);
  gMove.generateTexture('wildlife_red_squirrel_move', w, h);
  gMove.destroy();
}
