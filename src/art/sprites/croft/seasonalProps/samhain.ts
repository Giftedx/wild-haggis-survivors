import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
// ── Samhain palette ───────────────────────────────────────────────

const TURNIP_OUTLINE = 0x180a02;
const TURNIP_PURPLE = 0x4a2848;
const TURNIP_FLESH = 0xc8b078;
const TURNIP_FLESH_HI = 0xe8d090;
const TURNIP_LEAF_DARK = 0x1a3810;
const TURNIP_LEAF_MID = 0x3a6a18;
const TURNIP_GLOW = 0xff8a20;
const TURNIP_GLOW_HOT = 0xffd060;
const TURNIP_GLOW_CORE = 0xfff0c8;
const SOUL_CAKE_CRUST = 0xa06a30;
const SOUL_CAKE_CRUMB = 0xd6a85a;
const SOUL_CAKE_HI = 0xf2d088;
const SOUL_CAKE_CROSS = 0x6a3818;

/**
 * Samhain croft props (Oct 28 – Nov 3 window). The veil-thinning
 * folk-set: a carved turnip lantern (the Scottish predecessor to
 * the modern pumpkin jack-o-lantern — load-bearing folk-detail per
 * SCOTTISH_RESEARCH §1) with a flickering candle inside, plus a
 * soul cake on a plate (left out for the wandering dead, per
 * Samhain tradition).
 */
export function drawSamhainProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawTurnipLantern(g, layout.mantelpiece.x + 12, layout.mantelpiece.y - 8);
  drawSoulCake(g, layout.table.x, layout.table.y + 1);
}

function drawTurnipLantern(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow under the turnip — slightly warm-tinted by
  // the candle glow inside.
  g.fillStyle(0x000000, 0.28);
  g.fillEllipse(cx, cy + 7, 14, 2);
  g.fillStyle(TURNIP_GLOW, 0.18);
  g.fillEllipse(cx, cy + 6, 18, 3);

  // Turnip body — squat onion-shape with purple-shaded shoulder and
  // pale-cream lower bulb. Real Scottish neeps have this gradient.
  g.fillStyle(TURNIP_OUTLINE, 1);
  g.fillEllipse(cx, cy, 13, 11);
  // Lower (pale) flesh.
  g.fillStyle(TURNIP_FLESH, 1);
  g.fillEllipse(cx, cy + 0.4, 11.5, 9.6);
  // Upper (purple) shoulder — overlapping ellipse on top half.
  g.fillStyle(TURNIP_PURPLE, 1);
  g.fillEllipse(cx, cy - 2, 11.2, 5.5);
  // Highlight catches the candle glow — bright cream sweep across
  // the lower curve.
  g.fillStyle(TURNIP_FLESH_HI, 0.85);
  g.fillEllipse(cx - 1.5, cy + 1.5, 6, 2);

  // Carved face — triangular eyes + jagged grin cut INTO the flesh.
  // Drawn as warm-orange glow-rectangles so the cuts read as "lit
  // from within" (the candle inside).
  // Eyes: two triangular cuts.
  g.fillStyle(TURNIP_GLOW_HOT, 1);
  g.fillTriangle(cx - 4, cy - 2, cx - 2, cy - 4, cx - 2, cy - 1.5);
  g.fillTriangle(cx + 2, cy - 4, cx + 4, cy - 2, cx + 2, cy - 1.5);
  // Eye-cores — bright cream pinprick at each pupil.
  g.fillStyle(TURNIP_GLOW_CORE, 0.95);
  g.fillCircle(cx - 3, cy - 2.4, 0.6);
  g.fillCircle(cx + 3, cy - 2.4, 0.6);

  // Mouth — jagged grin (5 teeth-cuts).
  g.fillStyle(TURNIP_GLOW_HOT, 1);
  g.fillRect(cx - 4, cy + 1, 8, 1.6);
  // Tooth gaps — small dark rects breaking up the grin.
  g.fillStyle(TURNIP_OUTLINE, 1);
  g.fillRect(cx - 3, cy + 1, 0.6, 1.6);
  g.fillRect(cx - 1.4, cy + 1, 0.6, 1.6);
  g.fillRect(cx + 0.2, cy + 1, 0.6, 1.6);
  g.fillRect(cx + 1.8, cy + 1, 0.6, 1.6);
  // Mouth glow centre — brightest cream where the candle backlight
  // is strongest.
  g.fillStyle(TURNIP_GLOW_CORE, 0.85);
  g.fillRect(cx - 1.4, cy + 1.3, 2.6, 0.8);

  // Candle glow halo emanating from the cuts — soft warm-orange
  // ellipse around the turnip suggesting the lantern's reach.
  g.fillStyle(TURNIP_GLOW, 0.18);
  g.fillEllipse(cx, cy - 1, 22, 14);

  // Leafy stem stub on top — short curled greens fae the cut crown.
  g.fillStyle(TURNIP_LEAF_DARK, 1);
  g.fillRoundedRect(cx - 1.5, cy - 8, 3, 2.5, 0.5);
  g.fillStyle(TURNIP_LEAF_MID, 1);
  g.fillEllipse(cx - 1.4, cy - 8.5, 2, 1.5);
  g.fillEllipse(cx + 1.4, cy - 8.5, 2, 1.5);
  g.fillEllipse(cx, cy - 9.5, 2.5, 1.5);
}

function drawSoulCake(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate shadow.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 4, 12, 1.8);

  // Pale plate underneath — small hint of porcelain rim.
  g.fillStyle(0xa89a82, 0.85);
  g.fillEllipse(cx, cy + 2.4, 11, 2.4);
  g.fillStyle(0xc8baa0, 0.85);
  g.fillEllipse(cx, cy + 2, 9, 1.6);

  // Soul cake — round flat pastry. Three-tone crust → crumb gradient.
  g.fillStyle(SOUL_CAKE_CRUST, 1);
  g.fillEllipse(cx, cy, 8, 4);
  g.fillStyle(SOUL_CAKE_CRUMB, 1);
  g.fillEllipse(cx, cy - 0.4, 6.5, 3.2);
  g.fillStyle(SOUL_CAKE_HI, 0.85);
  g.fillEllipse(cx - 1, cy - 1.2, 3.5, 1.2);

  // Cross score — load-bearing detail per Samhain folk-tradition
  // (the cross on a soul cake marked it as one for the dead, distinct
  // from the bread for the living).
  g.fillStyle(SOUL_CAKE_CROSS, 0.9);
  g.fillRect(cx - 3, cy - 0.3, 6, 0.5);
  g.fillRect(cx - 0.3, cy - 1.4, 0.5, 2.4);

  // Single currant pressed into the centre — the soul-pip.
  g.fillStyle(0x2a0408, 1);
  g.fillCircle(cx, cy - 0.6, 0.6);
  g.fillStyle(0x4a1818, 0.85);
  g.fillCircle(cx - 0.2, cy - 0.8, 0.3);
}

