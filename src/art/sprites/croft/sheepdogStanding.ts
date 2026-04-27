/**
 * Standing-alert border collie companion to the existing sleeping
 * `croft_sheepdog_mat` sprite. Black-and-white markings, perked ears,
 * plumed tail, pink tongue tip, and the signature collie blue eye
 * highlight (one heterochromatic eye is a common, much-loved breed
 * trait). Two frames: the second flicks the ear and shifts the tail so
 * he reads as awake and watching, not statue-locked. Pure Hearth — this
 * is the dog who'd fall in step with you on the way down to the gate.
 */

import * as Phaser from 'phaser';

export const SHEEPDOG_STAND_CANVAS_W = 28;
export const SHEEPDOG_STAND_CANVAS_H = 24;
export const SHEEPDOG_STAND_FRAME_COUNT = 2;
export const SHEEPDOG_STAND_TEXTURE_KEYS = [
  'croft_sheepdog_stand_f0',
  'croft_sheepdog_stand_f1',
] as const;
export type SheepdogStandTextureKey = (typeof SHEEPDOG_STAND_TEXTURE_KEYS)[number];

interface SheepdogFrame {
  tailX: number;
  earY: number;
}

const SHEEPDOG_FRAMES: readonly SheepdogFrame[] = [
  { tailX: 0, earY: 0 },
  { tailX: 1, earY: -1 },
];

const OUTLINE = 0x0a0604;
const BLACK = 0x1a1410;
const BLACK_HI = 0x2a2418;
const WHITE = 0xf0eee0;
const WHITE_SHADE = 0xc0bea8;
const PINK = 0xd8688a;
const NOSE = 0x080404;
const EYE_BROWN = 0x3a2410;
const EYE_BLUE = 0x4a8ad0;
const EYE_BLUE_HI = 0x90c8f8;
const COLLAR = 0x8a1418;
const COLLAR_TAG = 0xd4a017;

export function drawSheepdogStandFrame(
  g: Phaser.GameObjects.Graphics,
  frameIdx: number,
): void {
  const f = SHEEPDOG_FRAMES[frameIdx % SHEEPDOG_FRAMES.length];

  // Ground shadow.
  g.fillStyle(OUTLINE, 0.35);
  g.fillEllipse(14, 22, 22, 3);

  // Four legs — slim, planted.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(7, 17, 3, 5);
  g.fillRect(11, 17, 3, 5);
  g.fillRect(16, 17, 3, 5);
  g.fillRect(20, 17, 3, 5);
  g.fillStyle(BLACK, 1);
  g.fillRect(7.4, 17, 2.2, 4.5);
  g.fillRect(11.4, 17, 2.2, 4.5);
  g.fillStyle(WHITE, 1);
  g.fillRect(16.4, 18.5, 2.2, 3);
  g.fillRect(20.4, 18.5, 2.2, 3);
  g.fillStyle(BLACK, 1);
  g.fillRect(16.4, 17, 2.2, 1.7);
  g.fillRect(20.4, 17, 2.2, 1.7);
  // White paw socks.
  g.fillStyle(WHITE, 1);
  g.fillRect(7.4, 21, 2.2, 1.2);
  g.fillRect(11.4, 21, 2.2, 1.2);

  // Body — black topline, white belly, classic collie split.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(5, 9, 18, 10, 3);
  g.fillStyle(BLACK, 1);
  g.fillRoundedRect(6, 9, 16, 7, 3);
  g.fillStyle(WHITE, 1);
  g.fillRoundedRect(6, 14, 16, 4, 2.5);
  // Body shading.
  g.fillStyle(BLACK_HI, 0.8);
  g.fillRect(7, 10, 14, 1.5);
  g.fillStyle(WHITE_SHADE, 0.7);
  g.fillRect(8, 16.5, 12, 1);

  // Tail — plumed, raised, black with white tip. Frame-wobbled.
  const tailX = f.tailX;
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(24 + tailX, 9, 6, 3.5);
  g.fillEllipse(26 + tailX, 6, 4, 3);
  g.fillStyle(BLACK, 1);
  g.fillEllipse(24 + tailX, 9, 5, 2.8);
  g.fillEllipse(26 + tailX, 6, 3.2, 2.4);
  g.fillStyle(WHITE, 1);
  g.fillCircle(27 + tailX, 5, 1.4);

  // Chest white blaze rising up the throat.
  g.fillStyle(WHITE, 1);
  g.fillTriangle(11, 16, 13, 9, 15, 16);

  // Head — angled slightly toward the viewer.
  const headCx = 8;
  const headCy = 7;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(headCx, headCy, 5.5);
  g.fillStyle(BLACK, 1);
  g.fillCircle(headCx, headCy, 4.8);
  // White muzzle blaze + stripe up the forehead.
  g.fillStyle(WHITE, 1);
  g.fillTriangle(headCx - 4, headCy + 3, headCx, headCy - 4, headCx + 1, headCy + 4);
  g.fillEllipse(headCx + 1, headCy + 2.5, 7, 4);
  g.fillStyle(WHITE_SHADE, 0.7);
  g.fillEllipse(headCx + 1, headCy + 3.5, 5, 1.5);
  // Snout/nose.
  g.fillStyle(NOSE, 1);
  g.fillEllipse(headCx + 3, headCy + 1, 2.4, 1.6);
  // Tongue tip — pink, just visible.
  g.fillStyle(PINK, 1);
  g.fillRect(headCx + 2, headCy + 2.5, 2, 1);
  g.fillStyle(OUTLINE, 0.5);
  g.fillRect(headCx + 2.7, headCy + 2.5, 0.4, 1);

  // Eyes — left brown, right BLUE (hetero — the breed signature).
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(headCx - 1.5, headCy - 0.5, 1.4);
  g.fillCircle(headCx + 1.5, headCy - 0.5, 1.4);
  g.fillStyle(EYE_BROWN, 1);
  g.fillCircle(headCx - 1.5, headCy - 0.5, 1);
  g.fillStyle(EYE_BLUE, 1);
  g.fillCircle(headCx + 1.5, headCy - 0.5, 1);
  g.fillStyle(EYE_BLUE_HI, 1);
  g.fillCircle(headCx + 1.8, headCy - 0.8, 0.5);
  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(headCx - 1.2, headCy - 0.8, 0.4);

  // Ears — perked triangles. One flicks per frame.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(headCx - 4, headCy - 3, headCx - 2, headCy - 7, headCx - 1.5, headCy - 3);
  g.fillTriangle(
    headCx + 1.5,
    headCy - 3,
    headCx + 3,
    headCy - 7 + f.earY,
    headCx + 4.5,
    headCy - 3,
  );
  g.fillStyle(BLACK, 1);
  g.fillTriangle(headCx - 3.6, headCy - 3, headCx - 2.2, headCy - 6.4, headCx - 1.8, headCy - 3);
  g.fillTriangle(
    headCx + 1.8,
    headCy - 3,
    headCx + 3,
    headCy - 6.4 + f.earY,
    headCx + 4.2,
    headCy - 3,
  );
  // Pink inner ear.
  g.fillStyle(PINK, 0.7);
  g.fillTriangle(headCx - 3.2, headCy - 3, headCx - 2.4, headCy - 5.4, headCx - 2, headCy - 3);
  g.fillTriangle(
    headCx + 2.2,
    headCy - 3,
    headCx + 3,
    headCy - 5.4 + f.earY,
    headCx + 3.8,
    headCy - 3,
  );

  // Collar — wee red collar with a brass tag.
  g.fillStyle(COLLAR, 1);
  g.fillRect(headCx + 0, headCy + 4, 5, 1.4);
  g.fillStyle(OUTLINE, 0.6);
  g.fillRect(headCx + 0, headCy + 5, 5, 0.4);
  g.fillStyle(COLLAR_TAG, 1);
  g.fillCircle(headCx + 2.5, headCy + 5.4, 0.8);
}

export function bakeSheepdogStandingTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < SHEEPDOG_STAND_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawSheepdogStandFrame(g, i);
    g.generateTexture(
      SHEEPDOG_STAND_TEXTURE_KEYS[i],
      SHEEPDOG_STAND_CANVAS_W,
      SHEEPDOG_STAND_CANVAS_H,
    );
    g.destroy();
  }
}
