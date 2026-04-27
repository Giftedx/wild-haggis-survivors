/**
 * A second haggis arriving back at the croft — your pal home from the
 * moor. Body palette echoes haggis_classic (warm browns + tartan-gold
 * accent) but proportions read as smaller and plumper: a wee-cousin
 * silhouette, not a colour-swap of the player. The "you're not alone"
 * warmth beat. Anchored by three specific personal touches: a chunky
 * knitted scarf cosy round the neck, a tartan travel bag at the feet,
 * and a single tartan-gold ribbon tag tied to the bag handle. Single
 * frame — the whole figure reads as freshly-arrived and settled.
 */

import * as Phaser from 'phaser';

export const RETURNING_PAL_CANVAS_W = 36;
export const RETURNING_PAL_CANVAS_H = 32;
export const RETURNING_PAL_TEXTURE_KEY = 'croft_returning_pal';

const OUTLINE = 0x3a2808;
const BODY_DARK = 0x6b4e0a;
const BODY_LIGHT = 0x8b6914;
const FUR = 0xa07818;
const FUR_HI = 0xc89438;
const SNOUT = 0xd4956b;
const SNOUT_SHADE = 0xa86848;
const ACCENT = 0xd4a017;
const SCARF_RED = 0x8a1418;
const SCARF_RED_HI = 0xc83040;
const SCARF_GREEN = 0x1a4a1a;
const SCARF_CREAM = 0xe8d8a8;
const BAG_LEATHER = 0x4a2810;
const BAG_LEATHER_HI = 0x7a4828;
const BAG_TARTAN_RED = 0x7a1418;
const BAG_TARTAN_GREEN = 0x224f28;
const BAG_TARTAN_GOLD = 0xd4a017;
const HOOF = 0x2a1808;
const EYE_WHITE = 0xf4ecd8;
const CHEEK = 0xc04848;

export function drawReturningPal(g: Phaser.GameObjects.Graphics): void {
  const cx = RETURNING_PAL_CANVAS_W / 2;

  // Ground shadow under the pal — anchors him as standing, not floating.
  g.fillStyle(OUTLINE, 0.32);
  g.fillEllipse(cx, 28, 22, 3);

  // Travel bag at the feet — to the right, leather + tartan strap.
  const bagCx = cx + 8;
  const bagCy = 26;
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(bagCx - 5, bagCy - 4, 10, 7, 2);
  g.fillStyle(BAG_LEATHER, 1);
  g.fillRoundedRect(bagCx - 4, bagCy - 3, 8, 5, 1.5);
  g.fillStyle(BAG_LEATHER_HI, 1);
  g.fillRect(bagCx - 4, bagCy - 3, 8, 1);
  // Tartan stripe across the bag body.
  g.fillStyle(BAG_TARTAN_RED, 1);
  g.fillRect(bagCx - 4, bagCy - 1.5, 8, 1.6);
  g.fillStyle(BAG_TARTAN_GREEN, 0.85);
  g.fillRect(bagCx - 4, bagCy - 0.5, 8, 0.5);
  g.fillStyle(BAG_TARTAN_GOLD, 0.9);
  g.fillRect(bagCx - 4, bagCy - 1.4, 8, 0.4);
  // Bag handle — arched.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(bagCx, bagCy - 5, 8, 3);
  g.fillStyle(BAG_LEATHER_HI, 1);
  g.fillEllipse(bagCx, bagCy - 5, 6.5, 2);
  g.fillStyle(0x000000, 0);
  // Tag tied to the handle — gold ribbon.
  g.fillStyle(BAG_TARTAN_GOLD, 1);
  g.fillRect(bagCx + 2, bagCy - 6.5, 1.6, 2.4);
  g.fillStyle(OUTLINE, 0.5);
  g.fillRect(bagCx + 2, bagCy - 6.5, 1.6, 0.6);

  // Body — plumper, lower-slung. Two tiny hooves under.
  g.fillStyle(HOOF, 1);
  g.fillRect(cx - 7, 25, 3, 2.5);
  g.fillRect(cx + 4, 25, 3, 2.5);

  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx - 1, 18, 22, 16);
  g.fillStyle(BODY_DARK, 1);
  g.fillEllipse(cx - 1, 18, 20, 14);
  g.fillStyle(BODY_LIGHT, 1);
  g.fillEllipse(cx - 1, 17, 17, 11);
  g.fillStyle(FUR, 1);
  g.fillEllipse(cx - 2, 16, 13, 8);
  g.fillStyle(FUR_HI, 0.85);
  g.fillEllipse(cx - 3, 15, 8, 4);

  // Tail tuft — small, rear-left.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx - 11, 17, 2.4);
  g.fillStyle(BODY_DARK, 1);
  g.fillCircle(cx - 11, 17, 1.8);
  g.fillStyle(FUR, 1);
  g.fillCircle(cx - 11.5, 16.5, 1.1);

  // Fur tufts along the back — three small spikes, gives him texture.
  for (const dx of [-5, -1, 3]) {
    g.fillStyle(OUTLINE, 1);
    g.fillTriangle(cx + dx - 1.4, 11, cx + dx, 8.5, cx + dx + 1.4, 11);
    g.fillStyle(FUR, 1);
    g.fillTriangle(cx + dx - 1, 11, cx + dx, 9.2, cx + dx + 1, 11);
  }

  // Snout — to the right, lifted slightly (he's looking up, happy).
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx + 7, 17, 8, 6);
  g.fillStyle(SNOUT, 1);
  g.fillEllipse(cx + 7, 17, 6.5, 4.8);
  g.fillStyle(SNOUT_SHADE, 0.7);
  g.fillEllipse(cx + 7, 18.5, 5, 1.8);
  // Nose tip.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx + 9.5, 16.5, 1.2);

  // Eye — happy, with sparkle. He's GLAD to be back.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx + 3, 14.5, 1.8);
  g.fillStyle(EYE_WHITE, 1);
  g.fillCircle(cx + 3, 14.5, 1.3);
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx + 3.3, 14.5, 0.8);
  g.fillStyle(0xffffff, 0.9);
  g.fillCircle(cx + 3.6, 14.2, 0.4);

  // Smile crease at the snout join — the "he's grinning" tell.
  g.fillStyle(OUTLINE, 0.7);
  g.fillRect(cx + 5, 18.5, 3, 0.5);

  // Cheek warmth.
  g.fillStyle(CHEEK, 0.45);
  g.fillCircle(cx + 1.5, 18, 1.3);

  // Knitted scarf — chunky, loops twice, cream + red stripes.
  // Loop 1: front of body.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 4, 11, 12, 4, 1.5);
  g.fillStyle(SCARF_RED, 1);
  g.fillRoundedRect(cx - 3.5, 11.3, 11, 3.4, 1.2);
  g.fillStyle(SCARF_CREAM, 0.9);
  g.fillRect(cx - 3.5, 12.4, 11, 0.7);
  g.fillStyle(SCARF_GREEN, 0.85);
  g.fillRect(cx - 3.5, 13.4, 11, 0.5);
  g.fillStyle(SCARF_RED_HI, 0.7);
  g.fillRect(cx - 3.5, 11.5, 11, 0.4);
  // Hint of knit grain — short vertical ticks across the scarf.
  g.fillStyle(OUTLINE, 0.35);
  for (let i = 0; i < 11; i += 1.5) {
    g.fillRect(cx - 3 + i, 11.5, 0.3, 2.4);
  }
  // Tail of the scarf hanging down the side.
  g.fillStyle(OUTLINE, 1);
  g.fillRoundedRect(cx - 6, 13, 3.5, 7, 1);
  g.fillStyle(SCARF_RED, 1);
  g.fillRoundedRect(cx - 5.5, 13.3, 2.5, 6.4, 0.8);
  g.fillStyle(SCARF_CREAM, 0.9);
  g.fillRect(cx - 5.5, 15, 2.5, 0.6);
  g.fillRect(cx - 5.5, 17, 2.5, 0.6);
  // Tiny fringe at the very tip.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 5.5, 19.6, 0.6, 1);
  g.fillRect(cx - 4.4, 19.6, 0.6, 1);
  g.fillRect(cx - 3.3, 19.6, 0.6, 1);

  // Tartan-gold ribbon detail on the body — accent stripe like the player carries.
  g.fillStyle(ACCENT, 0.85);
  g.fillRect(cx - 5, 19, 9, 0.6);
  g.fillStyle(OUTLINE, 0.5);
  g.fillRect(cx - 5, 19.6, 9, 0.3);
}

export function bakeReturningPalTexture(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  drawReturningPal(g);
  g.generateTexture(
    RETURNING_PAL_TEXTURE_KEY,
    RETURNING_PAL_CANVAS_W,
    RETURNING_PAL_CANVAS_H,
  );
  g.destroy();
}
