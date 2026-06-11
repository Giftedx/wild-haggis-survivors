/**
 * Neighbour-wifie popping in for tea — the warmth of "the door is
 * always on the latch". Tartan headscarf knotted under her chin, soft
 * cardigan over a print apron, and a willow basket of fresh-laid eggs
 * cradled in front of her. Two cream eggs sit visible above the rim.
 * Hearth register: rosy cheeks, sensible flats, a smile that says she
 * already has the kettle on at her own place. Two frames hold a slow
 * head-tilt and let the basket sway just enough to feel breathing.
 */

import * as Phaser from 'phaser';

export const NEIGHBOUR_CANVAS_W = 32;
export const NEIGHBOUR_CANVAS_H = 40;
export const NEIGHBOUR_FRAME_COUNT = 2;
export const NEIGHBOUR_TEXTURE_KEYS = [
  'croft_neighbour_f0',
  'croft_neighbour_f1',
] as const;
export type NeighbourTextureKey = (typeof NEIGHBOUR_TEXTURE_KEYS)[number];

interface NeighbourFrame {
  headTilt: number;
  basketX: number;
  basketY: number;
}

const NEIGHBOUR_FRAMES: readonly NeighbourFrame[] = [
  { headTilt: 0, basketX: 0, basketY: 0 },
  { headTilt: 1, basketX: 1, basketY: 1 },
];

const OUTLINE = 0x1a0808;
const SKIN = 0xe8b890;
const SKIN_SHADE = 0xb88868;
const CHEEK = 0xc04848;
const LIP = 0x9a3030;
const HAIR_BASE = 0xa07028;
const HAIR_HI = 0xc89048;
const SCARF_RED = 0x8a1418;
const SCARF_GREEN = 0x1a4a1a;
const SCARF_GOLD = 0xd4a017;
const SCARF_LIGHT = 0xc83840;
const CARDIGAN_DARK = 0x4a2820;
const CARDIGAN_MID = 0x7a4830;
const CARDIGAN_HI = 0xa06848;
const APRON_BASE = 0xe8d8b0;
const APRON_PRINT = 0x9a3050;
const APRON_PRINT_HI = 0xd87090;
const SKIRT = 0x3a2a4a;
const SKIRT_HI = 0x5a4878;
const BASKET_DARK = 0x4a2810;
const BASKET_MID = 0x7a4828;
const BASKET_HI = 0xa86838;
const EGG_BASE = 0xf4ecd0;
const EGG_SHADE = 0xc8b890;
const SHOE = 0x2a1810;

export function drawNeighbourFrame(
  g: Phaser.GameObjects.Graphics,
  frameIdx: number,
): void {
  const cx = NEIGHBOUR_CANVAS_W / 2;
  const f = NEIGHBOUR_FRAMES[frameIdx % NEIGHBOUR_FRAMES.length];

  // Sensible flats.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 7, 36, 6, 4, 1.5);
  g.fillRoundedRect(cx + 1, 36, 6, 4, 1.5);
  g.fillStyle(SHOE, 1);
  g.fillRoundedRect(cx - 6, 36, 5, 3, 1);
  g.fillRoundedRect(cx + 2, 36, 5, 3, 1);

  // Skirt — gentle A-line, peeking under the apron.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(cx - 11, 36, cx + 11, 36, cx + 7, 26);
  g.fillTriangle(cx - 11, 36, cx + 7, 26, cx - 7, 26);
  g.fillStyle(SKIRT, 1);
  g.fillTriangle(cx - 10, 35.5, cx + 10, 35.5, cx + 6, 26.5);
  g.fillTriangle(cx - 10, 35.5, cx + 6, 26.5, cx - 6, 26.5);
  g.fillStyle(SKIRT_HI, 0.8);
  g.fillRect(cx - 8, 27, 4, 5);

  // Apron — cream with a tiny pink-rose print pattern.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 9, 22, 18, 14);
  g.fillStyle(APRON_BASE, 1);
  g.fillRect(cx - 8, 22, 16, 13);
  // Hem ruffle.
  g.fillStyle(APRON_PRINT, 0.7);
  g.fillRect(cx - 8, 33, 16, 2);
  // Print dots — paired so they feel like little flowers.
  g.fillStyle(APRON_PRINT, 0.9);
  g.fillCircle(cx - 5, 25, 0.7);
  g.fillCircle(cx + 4, 24, 0.7);
  g.fillCircle(cx - 2, 28, 0.7);
  g.fillCircle(cx + 6, 30, 0.7);
  g.fillCircle(cx - 6, 31, 0.7);
  g.fillStyle(APRON_PRINT_HI, 0.8);
  g.fillCircle(cx - 5, 25, 0.3);
  g.fillCircle(cx + 4, 24, 0.3);

  // Cardigan — over the shoulders, two-tone.
  const cardY = 14;
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 10, cardY, 20, 12, 2);
  g.fillStyle(CARDIGAN_DARK, 1);
  g.fillRoundedRect(cx - 9, cardY + 1, 18, 10, 2);
  g.fillStyle(CARDIGAN_MID, 1);
  g.fillRect(cx - 8, cardY + 2, 5, 8);
  g.fillRect(cx + 3, cardY + 2, 5, 8);
  g.fillStyle(CARDIGAN_HI, 0.85);
  g.fillRect(cx - 7, cardY + 3, 2, 4);
  g.fillRect(cx + 5, cardY + 3, 2, 4);
  // Apron tie loops at the back-corners of cardigan.
  g.fillStyle(APRON_BASE, 1);
  g.fillRect(cx - 9, cardY + 9, 18, 1.4);
  // Cardigan buttons.
  g.fillStyle(SCARF_GOLD, 1);
  g.fillCircle(cx - 1, cardY + 4, 0.6);
  g.fillCircle(cx - 1, cardY + 7, 0.6);

  // Arms cradling the basket — sleeves come down to elbows.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 12, cardY + 5, 5, 7, 1.5);
  g.fillRoundedRect(cx + 7, cardY + 5, 5, 7, 1.5);
  g.fillStyle(CARDIGAN_MID, 1);
  g.fillRoundedRect(cx - 11, cardY + 5.5, 3.5, 6, 1);
  g.fillRoundedRect(cx + 7.5, cardY + 5.5, 3.5, 6, 1);
  // Forearm + hand on each side cupping the basket.
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx - 9 + f.basketX, cardY + 12.5, 1.5);
  g.fillCircle(cx + 9 - f.basketX, cardY + 12.5, 1.5);
  g.fillStyle(SKIN_SHADE, 0.5);
  g.fillCircle(cx - 9 + f.basketX, cardY + 13.2, 0.9);
  g.fillCircle(cx + 9 - f.basketX, cardY + 13.2, 0.9);

  // Basket — willow weave with two cream eggs visible.
  const basketY = 24 + f.basketY;
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx + f.basketX, basketY + 4, 16, 5);
  g.fillRoundedRect(cx - 7 + f.basketX, basketY - 3, 14, 8, 2);
  g.fillStyle(BASKET_MID, 1);
  g.fillRoundedRect(cx - 6 + f.basketX, basketY - 2, 12, 6, 1.5);
  g.fillStyle(BASKET_DARK, 1);
  // Weave bars — vertical and horizontal hashes.
  g.fillRect(cx - 6 + f.basketX, basketY, 12, 0.6);
  g.fillRect(cx - 6 + f.basketX, basketY + 2, 12, 0.6);
  g.fillRect(cx - 4 + f.basketX, basketY - 2, 0.5, 6);
  g.fillRect(cx - 1 + f.basketX, basketY - 2, 0.5, 6);
  g.fillRect(cx + 2 + f.basketX, basketY - 2, 0.5, 6);
  g.fillRect(cx + 5 + f.basketX, basketY - 2, 0.5, 6);
  // Handle arching over.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx + f.basketX, basketY - 4, 14, 5);
  g.fillStyle(BASKET_HI, 1);
  g.fillEllipse(cx + f.basketX, basketY - 4, 12, 4);
  g.fillStyle(APRON_BASE, 1);
  g.fillEllipse(cx + f.basketX, basketY - 4, 10, 2.5);
  // Two eggs poking up over the rim.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx - 3 + f.basketX, basketY - 1, 4, 5);
  g.fillEllipse(cx + 2 + f.basketX, basketY - 1, 4, 5);
  g.fillStyle(EGG_BASE, 1);
  g.fillEllipse(cx - 3 + f.basketX, basketY - 1, 3, 4);
  g.fillEllipse(cx + 2 + f.basketX, basketY - 1, 3, 4);
  g.fillStyle(EGG_SHADE, 0.7);
  g.fillEllipse(cx - 3 + f.basketX, basketY + 0.5, 2, 1);
  g.fillEllipse(cx + 2 + f.basketX, basketY + 0.5, 2, 1);

  // Head — gentle tilt, tartan headscarf knotted under chin.
  const headY = 8;
  const tiltX = f.headTilt;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx + tiltX, headY, 6);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx + tiltX, headY, 5.2);
  g.fillStyle(SKIN_SHADE, 0.55);
  g.fillEllipse(cx + tiltX, headY + 2, 8, 2.5);
  // Hair fringe peeking under the scarf.
  g.fillStyle(HAIR_BASE, 1);
  g.fillRect(cx - 4 + tiltX, headY - 3, 8, 2);
  g.fillStyle(HAIR_HI, 0.8);
  g.fillRect(cx - 3 + tiltX, headY - 3, 3, 1.2);
  // Cheeks — rosy.
  g.fillStyle(CHEEK, 0.55);
  g.fillCircle(cx - 2.6 + tiltX, headY + 1.5, 1.4);
  g.fillCircle(cx + 2.6 + tiltX, headY + 1.5, 1.4);
  // Eyes — happy crescents (small dots).
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 2.2 + tiltX, headY - 0.6, 1, 0.9);
  g.fillRect(cx + 1.2 + tiltX, headY - 0.6, 1, 0.9);
  // Smile.
  g.fillStyle(LIP, 1);
  g.fillRect(cx - 1.4 + tiltX, headY + 2.2, 2.8, 0.7);

  // Headscarf — wraps over the head and crown, stripes for tartan.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx + tiltX, headY - 3, 14, 8);
  g.fillStyle(SCARF_RED, 1);
  g.fillEllipse(cx + tiltX, headY - 3, 12, 7);
  g.fillStyle(SCARF_GREEN, 0.85);
  g.fillRect(cx - 6 + tiltX, headY - 5, 12, 0.8);
  g.fillRect(cx - 6 + tiltX, headY - 2, 12, 0.5);
  g.fillStyle(SCARF_GOLD, 0.85);
  g.fillRect(cx - 6 + tiltX, headY - 3.5, 12, 0.4);
  g.fillStyle(SCARF_LIGHT, 0.7);
  g.fillRect(cx - 5 + tiltX, headY - 6, 4, 0.8);
  // Knot under the chin.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 2 + tiltX, headY + 4, 4, 3, 1);
  g.fillStyle(SCARF_RED, 1);
  g.fillRoundedRect(cx - 1.5 + tiltX, headY + 4.3, 3, 2.2, 1);
  // Trailing scarf-tail down one side.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 1 + tiltX, headY + 6, 2, 4);
  g.fillStyle(SCARF_RED, 1);
  g.fillRect(cx - 0.5 + tiltX, headY + 6, 1.5, 4);
}

export function bakeNeighbourTextures(scene: Phaser.Scene): void {
  for (let i = 0; i < NEIGHBOUR_FRAME_COUNT; i++) {
    const g = scene.add.graphics();
    drawNeighbourFrame(g, i);
    g.generateTexture(
      NEIGHBOUR_TEXTURE_KEYS[i],
      NEIGHBOUR_CANVAS_W,
      NEIGHBOUR_CANVAS_H,
    );
    g.destroy();
  }
}
