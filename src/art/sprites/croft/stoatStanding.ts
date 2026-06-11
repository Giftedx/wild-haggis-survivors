/**
 * Stoat Scout companion sprite — Wild Living World Phase 2.
 *
 * The stoat is half the visual mass of the sheepdog and reads
 * unmistakably *as* a stoat: long sinuous body, very short legs, a
 * tail tipped jet-black (the genuine field-mark), warm chestnut back,
 * white throat and belly, a pointed black nose. Two frames flick the
 * tail tip and shift the back hump so the silhouette looks alert
 * rather than statue-locked. Pure Hearth-Wild blend — they are
 * curious, fast, and a little bit mischievous: the unmistakable
 * accomplice for a moor crawl.
 *
 * Sized to a 22×14 canvas so the stoat reads as visibly smaller than
 * the sheepdog (28×24) when both appear on the Croft picker side by
 * side. Reference: SCOTTISH_RESEARCH §1.7 (mustelids on the moor;
 * winter ermine note kept for a future palette swap).
 */

import * as Phaser from 'phaser';

export const STOAT_STAND_CANVAS_W = 22;
export const STOAT_STAND_CANVAS_H = 14;
export const STOAT_STAND_FRAME_COUNT = 2;
export const STOAT_STAND_TEXTURE_KEYS = [
  'croft_stoat_stand_f0',
  'croft_stoat_stand_f1',
] as const;
export type StoatStandTextureKey = (typeof STOAT_STAND_TEXTURE_KEYS)[number];

interface StoatFrame {
  tailY: number;
  backY: number;
}

const STOAT_FRAMES: readonly StoatFrame[] = [
  { tailY: 0, backY: 0 },
  { tailY: -1, backY: -0.6 },
];

const OUTLINE = 0x0a0604;
const BACK = 0xa86a30;
const BACK_HI = 0xc78648;
const BELLY = 0xf2eed8;
const BELLY_SHADE = 0xcfc8a8;
const NOSE = 0x080404;
const EYE = 0x1a1410;
const EYE_HI = 0xffffff;
const TAIL_TIP = 0x080404;

export function drawStoatStandFrame(
  g: Phaser.GameObjects.Graphics,
  frameIdx: number,
): void {
  const f = STOAT_FRAMES[frameIdx % STOAT_FRAMES.length];

  // Ground shadow — long and low because the body itself is long.
  g.fillStyle(OUTLINE, 0.32);
  g.fillEllipse(11, 13, 18, 2);

  // Four very short legs — stoats stand low and quick.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(5, 10, 1.6, 3);
  g.fillRect(8, 10, 1.6, 3);
  g.fillRect(12, 10, 1.6, 3);
  g.fillRect(15, 10, 1.6, 3);
  g.fillStyle(BACK, 1);
  g.fillRect(5.2, 10, 1.2, 2.5);
  g.fillRect(8.2, 10, 1.2, 2.5);
  g.fillRect(12.2, 10, 1.2, 2.5);
  g.fillRect(15.2, 10, 1.2, 2.5);

  // Body — long sinuous tube. Two ellipses overlap for the gentle hump.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(4, 5 + f.backY, 14, 6, 3);
  g.fillStyle(BACK, 1);
  g.fillRoundedRect(4.8, 5 + f.backY, 12.4, 5, 2.4);
  // Belly stripe — white from throat to tail base.
  g.fillStyle(BELLY, 1);
  g.fillRoundedRect(5, 8.4, 12, 1.8, 1);
  g.fillStyle(BELLY_SHADE, 0.7);
  g.fillRect(6, 9.6, 10, 0.6);
  // Back highlight.
  g.fillStyle(BACK_HI, 0.7);
  g.fillRect(6, 5.6 + f.backY, 10, 1);

  // Tail — long, slim, lifted, with the unmistakable black tip.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(18, 7 + f.tailY, 5, 2.6);
  g.fillEllipse(20, 5 + f.tailY, 3.4, 2);
  g.fillStyle(BACK, 1);
  g.fillEllipse(18, 7 + f.tailY, 4.2, 2);
  g.fillEllipse(20, 5 + f.tailY, 2.8, 1.5);
  g.fillStyle(TAIL_TIP, 1);
  g.fillCircle(21, 4.4 + f.tailY, 1.3);

  // Head — pointed snout, narrow skull, alert posture.
  const headCx = 3.8;
  const headCy = 6;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(headCx, headCy, 3.2);
  g.fillStyle(BACK, 1);
  g.fillCircle(headCx, headCy, 2.7);
  // White throat blaze.
  g.fillStyle(BELLY, 1);
  g.fillEllipse(headCx, headCy + 1.6, 3.2, 1.4);
  // Pointed snout.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(headCx - 1, headCy + 0.4, headCx - 3.6, headCy + 0.2, headCx - 1.2, headCy + 1.4);
  g.fillStyle(BACK, 1);
  g.fillTriangle(headCx - 1.2, headCy + 0.6, headCx - 3.2, headCy + 0.4, headCx - 1.4, headCy + 1.2);
  // Nose.
  g.fillStyle(NOSE, 1);
  g.fillEllipse(headCx - 3.1, headCy + 0.5, 0.9, 0.7);

  // Eye — bright single dot with a tiny highlight, gives the stoat
  // its characteristic "I see you" alertness.
  g.fillStyle(EYE, 1);
  g.fillCircle(headCx, headCy - 0.4, 0.7);
  g.fillStyle(EYE_HI, 0.95);
  g.fillCircle(headCx - 0.2, headCy - 0.6, 0.3);

  // Ears — tiny rounded knobs (stoats have small round ears, not pointed).
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(headCx + 1.4, headCy - 2.1, 0.9);
  g.fillStyle(BACK, 1);
  g.fillCircle(headCx + 1.4, headCy - 2.1, 0.55);
}

export function bakeStoatStandingTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < STOAT_STAND_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawStoatStandFrame(g, i);
    g.generateTexture(
      STOAT_STAND_TEXTURE_KEYS[i],
      STOAT_STAND_CANVAS_W,
      STOAT_STAND_CANVAS_H,
    );
    g.destroy();
  }
}
