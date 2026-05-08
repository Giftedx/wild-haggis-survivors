import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
import { drawSegment } from './_shared';
// ── Beltane palette ───────────────────────────────────────────────

const CANDLE_BASE = 0xeacc8a;
const CANDLE_BODY = 0xf6e2b0;
const CANDLE_HI = 0xfff2d6;
const CANDLE_DRIP = 0xc8a060;
const FLAME_OUTER = 0xff5a08;
const FLAME_MID = 0xffba40;
const FLAME_HOT = 0xfff0c8;
const FLAME_CORE = 0xffffff;
const HAWTHORN_BARK = 0x4a3018;
const HAWTHORN_BARK_HI = 0x7a5028;
const HAWTHORN_LEAF = 0x3a6a18;
const HAWTHORN_LEAF_HI = 0x5a8838;
const HAWTHORN_PETAL = 0xfaf6e8;
const HAWTHORN_PETAL_HI = 0xfffafa;
const HAWTHORN_HEART = 0xe8a8c8;
const HAWTHORN_POLLEN = 0xc88830;
const VASE_CLAY_DARK = 0x4a2410;
const VASE_CLAY = 0x7a4818;
const VASE_CLAY_HI = 0xa86828;

/**
 * Beltane croft props (Apr 28 – May 4 window). The first-fire-of-
 * summer set: two short candles burning in tandem on the mantelpiece
 * (the twin Beltane bonfires the cattle pass between for purification),
 * plus a hawthorn / may-blossom branch in a clay vase on the table
 * (the May tree, hung with white flowers — the load-bearing folk
 * symbol of the festival).
 */
export function drawBeltaneProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawTwinCandles(g, layout.mantelpiece.x + 12, layout.mantelpiece.y - 4);
  drawHawthornBranch(g, layout.table.x, layout.table.y - 2);
}

function drawTwinCandles(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  const offset = 6;
  drawSingleCandle(g, cx - offset, cy);
  drawSingleCandle(g, cx + offset, cy);

  // Soft warm halo connecting the two candles — sells the "twin
  // fires the cattle pass between" diegetic at small scale. Single
  // ellipse spanning both flames.
  g.fillStyle(FLAME_OUTER, 0.10);
  g.fillEllipse(cx, cy - 5, 22, 6);
  g.fillStyle(FLAME_MID, 0.14);
  g.fillEllipse(cx, cy - 5, 14, 4);
}

function drawSingleCandle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft floor shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 5, 6, 1.4);

  // Candle body — three-tone wax cylinder.
  g.fillStyle(CANDLE_BASE, 1);
  g.fillRoundedRect(cx - 2, cy - 3, 4, 8, 0.4);
  g.fillStyle(CANDLE_BODY, 1);
  g.fillRoundedRect(cx - 1.6, cy - 2.6, 3.2, 7.2, 0.3);
  g.fillStyle(CANDLE_HI, 0.85);
  g.fillRect(cx - 1.4, cy - 2, 0.8, 6);

  // Drip down one side — small wax tear.
  g.fillStyle(CANDLE_DRIP, 1);
  g.fillEllipse(cx + 1.6, cy + 1, 0.7, 1.6);
  g.fillStyle(CANDLE_BASE, 1);
  g.fillCircle(cx + 1.6, cy + 1.8, 0.3);

  // Wick — short dark line at the top.
  g.fillStyle(0x1a0a04, 1);
  g.fillRect(cx - 0.15, cy - 4.5, 0.3, 1.6);

  // Flame — three-layer pointed teardrop. Outer warm orange, mid
  // bright amber, hot cream-white core, single-pixel pure-white
  // pinprick at the brightest spot.
  // Outer flame.
  g.fillStyle(FLAME_OUTER, 1);
  g.fillTriangle(cx - 1.4, cy - 4.8, cx + 1.4, cy - 4.8, cx, cy - 8.4);
  g.fillEllipse(cx, cy - 5.2, 2.6, 1.6);
  // Mid flame.
  g.fillStyle(FLAME_MID, 1);
  g.fillTriangle(cx - 0.9, cy - 5.0, cx + 0.9, cy - 5.0, cx, cy - 7.8);
  // Hot core.
  g.fillStyle(FLAME_HOT, 1);
  g.fillTriangle(cx - 0.5, cy - 5.2, cx + 0.5, cy - 5.2, cx, cy - 7.0);
  // Pinprick white.
  g.fillStyle(FLAME_CORE, 0.95);
  g.fillCircle(cx, cy - 5.8, 0.35);
}

function drawHawthornBranch(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate / base shadow.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 7, 11, 1.8);

  // Clay vase — narrow at top, flared base, two-tone clay body.
  g.fillStyle(VASE_CLAY_DARK, 1);
  g.fillRoundedRect(cx - 4, cy - 1, 8, 8, 1);
  g.fillStyle(VASE_CLAY, 1);
  g.fillRoundedRect(cx - 3.6, cy - 0.5, 7.2, 7, 0.8);
  // Vase rim — flared lip.
  g.fillStyle(VASE_CLAY_DARK, 1);
  g.fillRect(cx - 4.5, cy - 1.5, 9, 1.2);
  g.fillStyle(VASE_CLAY, 1);
  g.fillRect(cx - 4.2, cy - 1.2, 8.4, 0.6);
  // Single highlight band.
  g.fillStyle(VASE_CLAY_HI, 0.7);
  g.fillRect(cx - 3, cy + 0.5, 0.8, 5);

  // Main branch rising from the vase — slightly curved, knotted.
  // Two-tone bark gradient.
  g.fillStyle(HAWTHORN_BARK, 1);
  drawSegment(g, cx, cy - 1.5, cx + 1, cy - 14, 1.0);
  g.fillStyle(HAWTHORN_BARK_HI, 0.85);
  drawSegment(g, cx + 0.2, cy - 2, cx + 0.8, cy - 13.5, 0.5);

  // Two side branches splitting off.
  g.fillStyle(HAWTHORN_BARK, 1);
  drawSegment(g, cx + 0.4, cy - 8, cx - 4, cy - 12, 0.7);
  drawSegment(g, cx + 0.6, cy - 10, cx + 5, cy - 13, 0.7);

  // Compound leaves — small lobed clusters scattered along the
  // branches. Hawthorn leaves are deeply lobed.
  drawHawthornLeafCluster(g, cx - 3, cy - 11);
  drawHawthornLeafCluster(g, cx + 4, cy - 12);
  drawHawthornLeafCluster(g, cx + 1.5, cy - 7);
  drawHawthornLeafCluster(g, cx - 0.5, cy - 5);

  // May-blossoms — tight clusters of small five-petalled white
  // flowers. The signature Beltane bloom (hawthorn = "may", and
  // "ne'er cast a clout till May be out" refers to these flowers).
  drawHawthornBlossomCluster(g, cx - 4, cy - 14);
  drawHawthornBlossomCluster(g, cx + 5, cy - 14);
  drawHawthornBlossomCluster(g, cx + 1, cy - 15);
  drawHawthornBlossomCluster(g, cx + 2, cy - 9);
}

function drawHawthornLeafCluster(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Three small lobed leaves around a centre point — base dark
  // green, brighter mid-green highlight on the upper half catching
  // the kitchen window light.
  g.fillStyle(HAWTHORN_LEAF, 1);
  g.fillEllipse(cx - 1.2, cy, 1.6, 1.0);
  g.fillEllipse(cx + 1.2, cy, 1.6, 1.0);
  g.fillEllipse(cx, cy + 0.8, 1.4, 0.9);
  g.fillStyle(HAWTHORN_LEAF_HI, 0.85);
  g.fillEllipse(cx - 1.2, cy - 0.2, 1.0, 0.6);
  g.fillEllipse(cx + 1.2, cy - 0.2, 1.0, 0.6);
}

function drawHawthornBlossomCluster(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Cluster of 4-5 small five-petalled white flowers. Each flower
  // is drawn as five overlapping circles around a pink-dot centre,
  // shrunk to small size so the cluster reads as a froth.
  const flowers = [
    { x: cx - 1.2, y: cy + 0.4 },
    { x: cx + 1.2, y: cy + 0.4 },
    { x: cx, y: cy - 1.0 },
    { x: cx + 0.6, y: cy + 1.4 },
  ];
  for (const f of flowers) {
    drawSingleHawthornFlower(g, f.x, f.y);
  }
  // Pollen pip floating between the flowers — yellow speck.
  g.fillStyle(HAWTHORN_POLLEN, 0.85);
  g.fillCircle(cx + 0.3, cy + 0.2, 0.3);
}

function drawSingleHawthornFlower(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Five outer petals — small white circles around the centre.
  g.fillStyle(HAWTHORN_PETAL, 1);
  g.fillCircle(cx, cy - 0.7, 0.6);
  g.fillCircle(cx + 0.7, cy - 0.2, 0.6);
  g.fillCircle(cx + 0.4, cy + 0.6, 0.6);
  g.fillCircle(cx - 0.4, cy + 0.6, 0.6);
  g.fillCircle(cx - 0.7, cy - 0.2, 0.6);
  // Petal highlights — small bright dots on the upper edge.
  g.fillStyle(HAWTHORN_PETAL_HI, 0.95);
  g.fillCircle(cx - 0.05, cy - 0.85, 0.25);
  g.fillCircle(cx + 0.55, cy - 0.35, 0.2);
  // Pink heart-eye centre — single small dot.
  g.fillStyle(HAWTHORN_HEART, 1);
  g.fillCircle(cx, cy, 0.4);
  g.fillStyle(HAWTHORN_POLLEN, 0.85);
  g.fillCircle(cx, cy, 0.2);
}

