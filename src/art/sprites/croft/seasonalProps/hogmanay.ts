import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
// ── Hogmanay palette ──────────────────────────────────────────────

const BUN_DARK = 0x2a1408;
const BUN_MID = 0x4a2810;
const BUN_HI = 0x7a4818;
const BUN_FRUIT = 0x6a1818;
const BUN_PEEL = 0xc89030;
const DRAM_GLASS_OUTLINE = 0x1a1a22;
const DRAM_GLASS_BODY = 0x32323a;
const DRAM_GLASS_HI = 0xc0d4e8;
const DRAM_WHISKY_BASE = 0x6a3208;
const DRAM_WHISKY_MID = 0xc88830;
const DRAM_WHISKY_HI = 0xffd070;
const FOOTER_OUTLINE = 0x080208;
const FOOTER_COAT = 0x1a1a26;
const FOOTER_FACE = 0x6a4828;
const FOOTER_HAIR = 0x180408;
const FOOTER_GIFT = 0x4a2010;
const FOOTER_GIFT_HI = 0x9a5a28;
const COIN_GOLD = 0xd4a040;

/**
 * Hogmanay croft props (Dec 28 – Jan 3 window). The Scottish New
 * Year set: a small black bun (rich-fruit pastry) on the table, a
 * tumbler of whisky beside it, and a silhouette of the first-footer
 * (the dark-haired stranger bringing luck) shadowed against the
 * doorway near the croft edge.
 */
export function drawHogmanayProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawBlackBun(g, layout.table.x - 9, layout.table.y);
  drawWhiskyTumbler(g, layout.table.x + 9, layout.table.y - 1);
  // First-footer silhouette near the hearth side — uses the hearth
  // position offset to land at "the doorway" implied by the croft
  // composition.
  drawFirstFooterSilhouette(g, layout.hearth.x + 90, layout.hearth.y - 18);
}

function drawBlackBun(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 5, 13, 2);

  // Pastry shell — the dark-cooked outer crust. Three-tone gradient
  // from dark crust → mid bake → highlight.
  g.fillStyle(BUN_DARK, 1);
  g.fillRoundedRect(cx - 7, cy - 4, 14, 8, 1.5);
  g.fillStyle(BUN_MID, 1);
  g.fillRoundedRect(cx - 6, cy - 3.5, 12, 7, 1);
  g.fillStyle(BUN_HI, 0.7);
  g.fillEllipse(cx - 1, cy - 3.5, 7, 1.4);

  // Cut-face slice — exposed centre showing the dense fruit packing.
  // Drawn on the right third so the slice + intact bun read together.
  g.fillStyle(BUN_DARK, 1);
  g.fillRect(cx + 2, cy - 3.5, 5, 7);
  g.fillStyle(0x4a3a1c, 1); // Fruity packed-meal interior.
  g.fillRect(cx + 2.5, cy - 3, 4, 6);

  // Currants + raisin pips — small dark dots with brighter peel-flecks
  // suggesting candied citrus.
  g.fillStyle(BUN_FRUIT, 1);
  g.fillCircle(cx + 3, cy - 1.5, 0.5);
  g.fillCircle(cx + 4.5, cy + 0.5, 0.55);
  g.fillCircle(cx + 5.5, cy - 0.8, 0.45);
  g.fillCircle(cx + 3.5, cy + 1.5, 0.5);
  g.fillStyle(BUN_PEEL, 0.85);
  g.fillRect(cx + 3.8, cy - 0.4, 0.7, 0.4);
  g.fillRect(cx + 5.0, cy + 1.2, 0.6, 0.35);
}

function drawWhiskyTumbler(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate / coaster shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 6, 9, 1.6);

  // Glass tumbler — squat shape with curved sides, base bevel, narrow
  // neck below the rim.
  g.fillStyle(DRAM_GLASS_OUTLINE, 1);
  g.fillRoundedRect(cx - 4, cy - 5, 8, 10, 0.6);
  g.fillStyle(DRAM_GLASS_BODY, 0.55);
  g.fillRoundedRect(cx - 3.4, cy - 4.5, 6.8, 9, 0.4);

  // Whisky inside — three-tone amber gradient. Fills the bottom
  // two-thirds of the tumbler so the dram reads as a generous pour.
  g.fillStyle(DRAM_WHISKY_BASE, 1);
  g.fillRect(cx - 3.2, cy - 1, 6.4, 5.5);
  g.fillStyle(DRAM_WHISKY_MID, 1);
  g.fillRect(cx - 3, cy - 0.5, 6, 4.5);
  g.fillStyle(DRAM_WHISKY_HI, 0.8);
  g.fillRect(cx - 2.5, cy - 0.4, 5, 1.2);

  // Meniscus — single bright top edge across the whisky surface.
  g.fillStyle(0xfff0c8, 0.9);
  g.fillRect(cx - 3, cy - 1.2, 6, 0.5);

  // Glass highlight — single vertical streak on the left rim.
  g.fillStyle(DRAM_GLASS_HI, 0.6);
  g.fillRect(cx - 3.2, cy - 4, 0.6, 8);
  g.fillStyle(0xffffff, 0.8);
  g.fillRect(cx - 3.0, cy - 3, 0.3, 4);

  // Base bevel — slightly darker band at the very bottom for weight.
  g.fillStyle(DRAM_GLASS_OUTLINE, 0.85);
  g.fillRect(cx - 3.4, cy + 4, 6.8, 1);
}

function drawFirstFooterSilhouette(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Door frame hint — narrow vertical dark line on either side of the
  // figure to suggest the threshold the first-footer is crossing.
  g.fillStyle(0x080208, 0.6);
  g.fillRect(cx - 11, cy - 16, 1, 32);
  g.fillRect(cx + 10, cy - 16, 1, 32);
  // Door-floor strip below.
  g.fillStyle(0x080208, 0.3);
  g.fillRect(cx - 11, cy + 14, 22, 0.8);

  // Silhouette body — long winter coat (full-length, dark navy-black
  // so the figure reads as a near-black cutout against the warmer
  // hearth glow). Drawn as torso + flared coat hem.
  g.fillStyle(FOOTER_OUTLINE, 1);
  // Coat torso — rectangle narrowing from shoulders to waist.
  g.fillRoundedRect(cx - 4, cy - 4, 8, 14, 0.8);
  g.fillStyle(FOOTER_COAT, 1);
  g.fillRoundedRect(cx - 3.5, cy - 3.5, 7, 13, 0.6);
  // Coat hem flaring to the floor.
  g.fillStyle(FOOTER_OUTLINE, 1);
  g.fillTriangle(cx - 4, cy + 8, cx - 6, cy + 14, cx + 6, cy + 14);
  g.fillTriangle(cx - 4, cy + 8, cx + 6, cy + 14, cx + 4, cy + 8);
  g.fillStyle(FOOTER_COAT, 1);
  g.fillTriangle(cx - 3.5, cy + 8, cx - 5.2, cy + 13.6, cx + 5.2, cy + 13.6);
  g.fillTriangle(cx - 3.5, cy + 8, cx + 5.2, cy + 13.6, cx + 3.5, cy + 8);

  // Head — round, mostly silhouette with a sliver of warm-tan face.
  g.fillStyle(FOOTER_OUTLINE, 1);
  g.fillCircle(cx, cy - 7, 3);
  g.fillStyle(FOOTER_FACE, 0.55);
  g.fillCircle(cx + 0.4, cy - 7, 2.4);
  // Dark hair — the LOAD-BEARING detail per Hogmanay folk-tradition
  // (a dark-haired first-footer is the lucky one). Cap-shape on top.
  g.fillStyle(FOOTER_HAIR, 1);
  g.fillCircle(cx, cy - 8.4, 2.6);
  g.fillRect(cx - 2.4, cy - 8.5, 4.8, 1.4);

  // Gift in arms — small dark parcel held against the chest. Tied
  // with twine. Represents the traditional first-footing offerings:
  // shortbread / coal / silver.
  g.fillStyle(FOOTER_GIFT, 1);
  g.fillRoundedRect(cx - 3, cy - 1, 6, 4, 0.4);
  g.fillStyle(FOOTER_GIFT_HI, 0.7);
  g.fillRect(cx - 2.6, cy - 0.6, 5.2, 0.5);
  // Twine cross — single vertical + single horizontal stroke across
  // the parcel.
  g.fillStyle(FOOTER_HAIR, 1);
  g.fillRect(cx - 0.3, cy - 1, 0.6, 4);
  g.fillRect(cx - 3, cy + 0.7, 6, 0.4);

  // Single coin glint at the parcel edge — the silver / gold piece
  // traditionally tucked into the gift bundle.
  g.fillStyle(COIN_GOLD, 1);
  g.fillCircle(cx + 2.4, cy + 2.6, 0.7);
  g.fillStyle(0xfff0c8, 0.95);
  g.fillCircle(cx + 2.2, cy + 2.4, 0.3);
}

