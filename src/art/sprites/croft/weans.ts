/**
 * Pair of weans tearing about the croft yard — the "kids playing"
 * warmth beat that says home is loud in the best way. One in a red
 * tartan kilt, cream shirt, and a stick mid-shinty-swing. The other in
 * green dungarees clutching a wee haggis plushie like it's the most
 * precious thing on earth. Both with rosy cheeks, scruffy hair, and
 * tartan ribbons on the kilted one. Hearth register at full volume.
 * Single frame, wider canvas (40×32) so they read as a duo, not as a
 * single character pair-bonded into one cell.
 */

import * as Phaser from 'phaser';

export const WEANS_CANVAS_W = 40;
export const WEANS_CANVAS_H = 32;
export const WEANS_TEXTURE_KEY = 'croft_weans';

const OUTLINE = 0x1a0808;
const SKIN = 0xe8b890;
const SKIN_SHADE = 0xb88868;
const CHEEK = 0xc04848;
const LIP = 0x9a3030;
const HAIR_GINGER = 0xc05818;
const HAIR_GINGER_HI = 0xe88838;
const HAIR_BROWN = 0x4a2810;
const HAIR_BROWN_HI = 0x7a4828;
const KILT_RED = 0x8a1418;
const KILT_RED_HI = 0xc83040;
const KILT_GREEN = 0x1a4a1a;
const KILT_GOLD = 0xd4a017;
const SHIRT_CREAM = 0xf0e0c0;
const SHIRT_SHADE = 0xc8a878;
const DUNGAREE = 0x2a5a28;
const DUNGAREE_HI = 0x4a8048;
const DUNGAREE_BTN = 0xd4a017;
const SHIRT_RED = 0xa01820;
const STICK = 0x7a4828;
const STICK_HI = 0xa86838;
const SHOE = 0x2a1810;
const PLUSH_BODY = 0x6b4e0a;
const PLUSH_BODY_HI = 0x8b6914;
const PLUSH_NOSE = 0xd4956b;
const PLUSH_GOLD = 0xd4a017;
const PLUSH_STITCH = 0x3a2808;

function drawKiltedWean(g: Phaser.GameObjects.Graphics, cx: number): void {
  // Shoes.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 5, 28, 4, 4, 1);
  g.fillRoundedRect(cx + 1, 28, 4, 4, 1);
  g.fillStyle(SHOE, 1);
  g.fillRoundedRect(cx - 4.5, 28, 3, 3, 1);
  g.fillRoundedRect(cx + 1.5, 28, 3, 3, 1);

  // Bare wee legs poking from kilt.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 4, 22, 3, 7);
  g.fillRect(cx + 1, 22, 3, 7);
  g.fillStyle(SKIN, 1);
  g.fillRect(cx - 3.5, 22, 2, 6);
  g.fillRect(cx + 1.5, 22, 2, 6);

  // Kilt — pleated tartan.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 7, 18, 14, 6);
  g.fillStyle(KILT_RED, 1);
  g.fillRect(cx - 6, 18, 12, 5);
  g.fillStyle(KILT_RED_HI, 0.85);
  g.fillRect(cx - 6, 18, 12, 1);
  // Tartan stripes.
  g.fillStyle(KILT_GREEN, 0.9);
  g.fillRect(cx - 6, 19.5, 12, 0.7);
  g.fillRect(cx - 4, 18, 0.6, 5);
  g.fillRect(cx + 1, 18, 0.6, 5);
  g.fillStyle(KILT_GOLD, 0.9);
  g.fillRect(cx - 6, 21, 12, 0.5);
  g.fillRect(cx - 1, 18, 0.4, 5);
  // Pleat shadow lines.
  g.fillStyle(OUTLINE, 0.4);
  g.fillRect(cx - 4, 18, 0.4, 5);
  g.fillRect(cx + 2, 18, 0.4, 5);

  // Cream shirt.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 6, 11, 12, 8, 1.5);
  g.fillStyle(SHIRT_CREAM, 1);
  g.fillRoundedRect(cx - 5, 12, 10, 6, 1);
  g.fillStyle(SHIRT_SHADE, 0.5);
  g.fillRect(cx - 5, 17, 10, 1);
  // Collar.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(cx - 2, 12, cx + 2, 12, cx, 14.5);

  // Right arm raised, holding the stick aloft mid-swing.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx + 4, 8, 4, 7, 1);
  g.fillStyle(SHIRT_CREAM, 1);
  g.fillRoundedRect(cx + 4.5, 8.5, 3, 6, 1);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx + 6, 7.5, 1.4);
  // Shinty stick — diagonal up and to the right.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 5, 1, 1.4, 7);
  g.fillRect(cx + 4, 0.5, 4, 1.6);
  g.fillStyle(STICK, 1);
  g.fillRect(cx + 5.3, 1.5, 0.9, 6);
  g.fillRect(cx + 4.3, 1, 3.5, 1.1);
  g.fillStyle(STICK_HI, 1);
  g.fillRect(cx + 5.3, 1.5, 0.4, 5);

  // Left arm — at side.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 8, 12, 3.5, 6, 1);
  g.fillStyle(SHIRT_CREAM, 1);
  g.fillRoundedRect(cx - 7.5, 12.5, 2.5, 5, 1);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx - 6.5, 18, 1.3);

  // Head.
  const headY = 6;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, headY, 5);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, headY, 4.3);
  g.fillStyle(SKIN_SHADE, 0.5);
  g.fillEllipse(cx, headY + 1.5, 7, 2);
  // Cheeks.
  g.fillStyle(CHEEK, 0.6);
  g.fillCircle(cx - 2.3, headY + 1.2, 1.2);
  g.fillCircle(cx + 2.3, headY + 1.2, 1.2);
  // Eyes — wide, gleeful.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 2, headY - 1, 1, 1.2);
  g.fillRect(cx + 1, headY - 1, 1, 1.2);
  // Open grin.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 1.5, headY + 2, 3, 1);
  g.fillStyle(LIP, 1);
  g.fillRect(cx - 1.2, headY + 2.2, 2.4, 0.5);

  // Scruffy ginger hair — sticks out in tufts.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx, headY - 3, 11, 5);
  g.fillStyle(HAIR_GINGER, 1);
  g.fillEllipse(cx, headY - 3, 9.5, 4);
  g.fillStyle(HAIR_GINGER_HI, 0.85);
  g.fillEllipse(cx - 1, headY - 4, 5, 2);
  // Side tufts.
  g.fillStyle(OUTLINE, 1);
  g.fillTriangle(cx - 5, headY - 3, cx - 7, headY - 6, cx - 4, headY - 4);
  g.fillTriangle(cx + 5, headY - 3, cx + 7, headY - 6, cx + 4, headY - 4);
  g.fillStyle(HAIR_GINGER, 1);
  g.fillTriangle(cx - 4.5, headY - 3, cx - 6, headY - 5.5, cx - 3.6, headY - 4);
  g.fillTriangle(cx + 4.5, headY - 3, cx + 6, headY - 5.5, cx + 3.6, headY - 4);
  // Two tartan ribbons tied at the temples.
  g.fillStyle(KILT_RED, 1);
  g.fillRect(cx - 6, headY - 4, 1.5, 1.2);
  g.fillRect(cx + 4.5, headY - 4, 1.5, 1.2);
  g.fillStyle(KILT_GOLD, 0.9);
  g.fillRect(cx - 5.7, headY - 3.7, 0.7, 0.6);
  g.fillRect(cx + 4.8, headY - 3.7, 0.7, 0.6);
}

function drawDungareeWean(g: Phaser.GameObjects.Graphics, cx: number): void {
  // Shoes.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 5, 28, 4, 4, 1);
  g.fillRoundedRect(cx + 1, 28, 4, 4, 1);
  g.fillStyle(SHOE, 1);
  g.fillRoundedRect(cx - 4.5, 28, 3, 3, 1);
  g.fillRoundedRect(cx + 1.5, 28, 3, 3, 1);

  // Dungaree legs.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 5, 19, 4, 10);
  g.fillRect(cx + 1, 19, 4, 10);
  g.fillStyle(DUNGAREE, 1);
  g.fillRect(cx - 4.5, 19, 3, 9);
  g.fillRect(cx + 1.5, 19, 3, 9);
  g.fillStyle(DUNGAREE_HI, 0.7);
  g.fillRect(cx - 4, 20, 1, 7);
  g.fillRect(cx + 2, 20, 1, 7);

  // Red shirt under the dungarees.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 6, 11, 12, 9, 2);
  g.fillStyle(SHIRT_RED, 1);
  g.fillRoundedRect(cx - 5, 12, 10, 8, 1.5);
  // Dungaree bib over chest.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 4, 13, 8, 7);
  g.fillStyle(DUNGAREE, 1);
  g.fillRect(cx - 3.5, 13.5, 7, 6);
  // Bib straps over shoulders.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 4.5, 11, 1.6, 4);
  g.fillRect(cx + 2.9, 11, 1.6, 4);
  g.fillStyle(DUNGAREE, 1);
  g.fillRect(cx - 4, 11, 1, 4);
  g.fillRect(cx + 3, 11, 1, 4);
  // Brass buttons on the bib.
  g.fillStyle(DUNGAREE_BTN, 1);
  g.fillCircle(cx - 3, 14.5, 0.6);
  g.fillCircle(cx + 3, 14.5, 0.6);

  // Arms — both forward, cradling the haggis plushie at chest height.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 8, 13, 4, 7, 1);
  g.fillRoundedRect(cx + 4, 13, 4, 7, 1);
  g.fillStyle(SHIRT_RED, 1);
  g.fillRoundedRect(cx - 7.5, 13.5, 3, 6, 1);
  g.fillRoundedRect(cx + 4.5, 13.5, 3, 6, 1);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx - 6, 19.5, 1.4);
  g.fillCircle(cx + 6, 19.5, 1.4);

  // Haggis plushie cradled in arms — mini haggis_classic palette.
  const plushCx = cx;
  const plushCy = 19;
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(plushCx, plushCy, 9, 6);
  g.fillStyle(PLUSH_BODY, 1);
  g.fillEllipse(plushCx, plushCy, 8, 5);
  g.fillStyle(PLUSH_BODY_HI, 1);
  g.fillEllipse(plushCx - 1, plushCy - 1, 5, 2.5);
  // Snout.
  g.fillStyle(PLUSH_NOSE, 1);
  g.fillCircle(plushCx + 3, plushCy, 1.5);
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(plushCx + 3.5, plushCy - 0.3, 0.4);
  // Stitched smile + button eye.
  g.fillStyle(PLUSH_STITCH, 1);
  g.fillRect(plushCx - 1, plushCy - 1.4, 0.6, 0.6);
  g.fillRect(plushCx + 2.2, plushCy + 0.6, 1.2, 0.4);
  // Tiny gold ribbon round the neck — that "loved" touch.
  g.fillStyle(PLUSH_GOLD, 1);
  g.fillRect(plushCx - 3, plushCy - 1.8, 4, 0.7);
  g.fillRect(plushCx + 0.5, plushCy - 2.4, 0.8, 1.2);

  // Head.
  const headY = 6;
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, headY, 5);
  g.fillStyle(SKIN, 1);
  g.fillCircle(cx, headY, 4.3);
  g.fillStyle(SKIN_SHADE, 0.5);
  g.fillEllipse(cx, headY + 1.5, 7, 2);
  // Cheeks.
  g.fillStyle(CHEEK, 0.6);
  g.fillCircle(cx - 2.3, headY + 1.2, 1.2);
  g.fillCircle(cx + 2.3, headY + 1.2, 1.2);
  // Eyes — bright.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 2, headY - 1, 1, 1.2);
  g.fillRect(cx + 1, headY - 1, 1, 1.2);
  g.fillStyle(0xffffff, 0.7);
  g.fillRect(cx - 1.8, headY - 0.9, 0.4, 0.4);
  g.fillRect(cx + 1.2, headY - 0.9, 0.4, 0.4);
  // Closed-mouth wee smile.
  g.fillStyle(LIP, 1);
  g.fillRect(cx - 1.3, headY + 2.2, 2.6, 0.6);

  // Scruffy brown hair — bowl-cut feel with a cowlick.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx, headY - 3, 11, 5);
  g.fillStyle(HAIR_BROWN, 1);
  g.fillEllipse(cx, headY - 3, 9.5, 4);
  g.fillStyle(HAIR_BROWN_HI, 0.85);
  g.fillEllipse(cx - 1, headY - 4, 5, 2);
  // Cowlick.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 1, headY - 7, 1.4, 3);
  g.fillStyle(HAIR_BROWN, 1);
  g.fillRect(cx + 1.3, headY - 6.5, 0.8, 2.5);
}

export function drawWeans(g: Phaser.GameObjects.Graphics): void {
  // Two weans, side by side. Kilted ginger on the left, dungaree on the right.
  drawKiltedWean(g, 11);
  drawDungareeWean(g, 28);

  // Tiny shared shadow ground tone tying them together.
  g.fillStyle(OUTLINE, 0.18);
  g.fillEllipse(11, 31.5, 12, 1.6);
  g.fillEllipse(28, 31.5, 12, 1.6);
}

export function bakeWeansTexture(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawWeans(g);
  g.generateTexture(WEANS_TEXTURE_KEY, WEANS_CANVAS_W, WEANS_CANVAS_H);
  g.destroy();
}
