/**
 * Highland village postie for the Croft scene — Royal Mail red jacket,
 * navy trousers, cream postbag with a red strap, and one envelope poking
 * out the top. He is the "world keeps turning" warmth beat: someone
 * still climbs the brae each morning. Hearth register — weathered short
 * beard, tartan band on the wool hat, sturdy walking boots. Two frames
 * give him a subtle weight shift and a wee wobble on the envelope so he
 * reads as breathing in place rather than posed.
 */

import * as Phaser from 'phaser';

export const POSTIE_CANVAS_W = 32;
export const POSTIE_CANVAS_H = 40;
export const POSTIE_FRAME_COUNT = 2;
export const POSTIE_TEXTURE_KEYS = ['croft_postie_f0', 'croft_postie_f1'] as const;
export type PostieTextureKey = (typeof POSTIE_TEXTURE_KEYS)[number];

interface PostieFrame {
  shiftY: number;
  envelopeY: number;
  envelopeX: number;
}

const POSTIE_FRAMES: readonly PostieFrame[] = [
  { shiftY: 0, envelopeY: 0, envelopeX: 0 },
  { shiftY: 1, envelopeY: -1, envelopeX: 1 },
];

const OUTLINE = 0x1a0808;
const JACKET_DARK = 0x5a0c14;
const JACKET_MID = 0xa01820;
const JACKET_HI = 0xc83040;
const COLLAR = 0x3a0810;
const TROUSER_DARK = 0x101830;
const TROUSER_MID = 0x223060;
const BAG_CANVAS = 0xe8d8a8;
const BAG_SHADE = 0xb8a878;
const BAG_STRAP = 0x8a1018;
const ENVELOPE = 0xf4ecd8;
const ENVELOPE_SHADE = 0xc8b890;
const SKIN = 0xe0a070;
const SKIN_SHADE = 0xa86840;
const BEARD = 0x7a4828;
const HAT_DARK = 0x2a3a18;
const HAT_BAND_RED = 0xa01820;
const HAT_BAND_GREEN = 0x1a4a1a;
const HAT_BAND_GOLD = 0xd4a017;
const BOOT = 0x2a1a10;
const BOOT_HI = 0x4a3020;
const CHEEK = 0x9a3030;

export function drawPostieFrame(g: Phaser.GameObjects.Graphics, frameIdx: number): void {
  const cx = POSTIE_CANVAS_W / 2;
  const f = POSTIE_FRAMES[frameIdx % POSTIE_FRAMES.length];
  const dy = f.shiftY;

  // Boots — planted, slight stagger so he's mid-stride not parade-rest.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 7, 36, 6, 4, 1);
  g.fillRoundedRect(cx + 1, 36, 6, 4, 1);
  g.fillStyle(BOOT, 1);
  g.fillRoundedRect(cx - 6, 36, 5, 3, 1);
  g.fillRoundedRect(cx + 2, 36, 5, 3, 1);
  g.fillStyle(BOOT_HI, 1);
  g.fillRect(cx - 6, 36, 5, 0.7);
  g.fillRect(cx + 2, 36, 5, 0.7);

  // Trousers — navy, slim taper into the boots.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 7, 24 + dy, 14, 13);
  g.fillStyle(TROUSER_DARK, 1);
  g.fillRect(cx - 6, 24 + dy, 12, 12);
  g.fillStyle(TROUSER_MID, 1);
  g.fillRect(cx - 5, 25 + dy, 4, 10);
  g.fillRect(cx + 1, 25 + dy, 4, 10);
  // Belt line — small dark band where jacket meets trousers.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 6, 24 + dy, 12, 1);

  // Jacket — Royal Mail red. Two-tone with a darker collar shadow.
  const jacketY = 14 + dy;
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 9, jacketY, 18, 12, 2);
  g.fillStyle(JACKET_DARK, 1);
  g.fillRoundedRect(cx - 8, jacketY + 1, 16, 10, 2);
  g.fillStyle(JACKET_MID, 1);
  g.fillRoundedRect(cx - 7, jacketY + 2, 14, 7, 2);
  g.fillStyle(JACKET_HI, 0.9);
  g.fillRect(cx - 6, jacketY + 3, 4, 2);
  // Buttons down the centre — three brass dots.
  g.fillStyle(HAT_BAND_GOLD, 1);
  g.fillCircle(cx, jacketY + 4, 0.7);
  g.fillCircle(cx, jacketY + 7, 0.7);
  g.fillCircle(cx, jacketY + 10, 0.7);
  // Collar — darker V at the throat.
  g.fillStyle(COLLAR, 1);
  g.fillTriangle(cx - 4, jacketY + 1, cx + 4, jacketY + 1, cx, jacketY + 4);

  // Postbag — slung across the body on a red strap. Sits at his right hip.
  const bagX = cx + 8;
  const bagY = 23 + dy;
  // Strap diagonal — drawn as two stacked rects for the cross-body line.
  g.fillStyle(BAG_STRAP, 1);
  g.fillRect(cx - 6, jacketY + 3, 16, 1.6);
  g.fillRect(bagX - 2, jacketY + 4, 1.6, 6);
  // Bag body.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(bagX - 5, bagY, 10, 8, 1.5);
  g.fillStyle(BAG_CANVAS, 1);
  g.fillRoundedRect(bagX - 4, bagY + 1, 8, 6, 1);
  g.fillStyle(BAG_SHADE, 1);
  g.fillRect(bagX - 4, bagY + 5, 8, 2);
  // Flap clasp — small red square on the bag flap.
  g.fillStyle(BAG_STRAP, 1);
  g.fillRect(bagX - 1, bagY + 4, 2, 1.5);
  // Envelope poking out the top — frame-wobbled.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(bagX - 3 + f.envelopeX, bagY - 3 + f.envelopeY, 7, 4);
  g.fillStyle(ENVELOPE, 1);
  g.fillRect(bagX - 2 + f.envelopeX, bagY - 2 + f.envelopeY, 5, 3);
  g.fillStyle(ENVELOPE_SHADE, 1);
  g.fillTriangle(
    bagX - 2 + f.envelopeX,
    bagY - 2 + f.envelopeY,
    bagX + 3 + f.envelopeX,
    bagY - 2 + f.envelopeY,
    bagX + 0.5 + f.envelopeX,
    bagY + f.envelopeY,
  );

  // Head — friendly weathered face.
  const headY = 8 + dy;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, headY, 5.5);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, headY, 4.8);
  g.fillStyle(SKIN_SHADE, 0.55);
  g.fillEllipse(cx, headY + 1.5, 8, 2.5);
  // Cheeks — a tiny windburn flush.
  g.fillStyle(CHEEK, 0.4);
  g.fillCircle(cx - 2.5, headY + 1, 1.2);
  g.fillCircle(cx + 2.5, headY + 1, 1.2);
  // Short beard — fringes the jaw.
  g.fillStyle(BEARD, 1);
  g.fillEllipse(cx, headY + 3, 7, 2.5);
  g.fillStyle(OUTLINE, 0.4);
  g.fillRect(cx - 2, headY + 3.6, 4, 0.5);
  // Eyes — content squint.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 2.2, headY - 0.8, 1, 1);
  g.fillRect(cx + 1.2, headY - 0.8, 1, 1);
  // Smile.
  g.fillStyle(CHEEK, 1);
  g.fillRect(cx - 1.3, headY + 2, 2.6, 0.6);

  // Hat — wool beanie with a tartan band (red / green / gold stripes).
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 6, headY - 6, 12, 6, 2);
  g.fillStyle(HAT_DARK, 1);
  g.fillRoundedRect(cx - 5, headY - 5, 10, 5, 2);
  // Band stripes.
  g.fillStyle(HAT_BAND_RED, 1);
  g.fillRect(cx - 5, headY - 1.6, 10, 1.2);
  g.fillStyle(HAT_BAND_GREEN, 1);
  g.fillRect(cx - 5, headY - 0.4, 10, 0.5);
  g.fillStyle(HAT_BAND_GOLD, 0.9);
  g.fillRect(cx - 5, headY - 2.2, 10, 0.4);
  // Pom on top.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, headY - 7, 1.6);
  g.fillStyle(HAT_BAND_GOLD, 1);
  g.fillCircle(cx, headY - 7, 1.2);

  // Free arm — left hand swinging at hip, peeking from sleeve.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 12, jacketY + 7, 4, 5, 1.2);
  g.fillStyle(JACKET_MID, 1);
  g.fillRoundedRect(cx - 11, jacketY + 7, 3, 4, 1);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx - 10, jacketY + 12, 1.4);
  g.fillStyle(SKIN_SHADE, 0.5);
  g.fillCircle(cx - 10, jacketY + 12.6, 0.8);
}

export function bakePostieTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < POSTIE_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawPostieFrame(g, i);
    g.generateTexture(POSTIE_TEXTURE_KEYS[i], POSTIE_CANVAS_W, POSTIE_CANVAS_H);
    g.destroy();
  }
}
