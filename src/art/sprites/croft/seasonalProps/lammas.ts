import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../../scenes/croft/CroftComposition';
import { drawSegment } from './_shared';
// ── Lammas palette ────────────────────────────────────────────────

const SHEAF_STEM = 0xb8902c;
const SHEAF_GRAIN = 0xe6c060;
const SHEAF_HI = 0xfae898;
const SHEAF_TIE = 0x8a4810;
const BANNOCK_CRUST = 0xa05a18;
const BANNOCK_CRUMB = 0xd29a48;
const BANNOCK_HI = 0xf2c478;
const BANNOCK_BUTTER = 0xfae0a0;

/**
 * Lammas croft props (Jul 29 – Aug 4 window). Lùnastal — first
 * harvest. The kitchen table gets a small wheat sheaf bundle tied
 * with hemp twine, plus a wee bannock loaf beside it (the loaf-mass
 * tradition). Both painted modestly so the props read as
 * "set down for the supper" rather than centrepiece-heroic.
 */
export function drawLammasProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawWheatSheaf(g, layout.table.x - 10, layout.table.y);
  drawBannock(g, layout.table.x + 10, layout.table.y + 1);
}

function drawWheatSheaf(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Soft contact shadow for the sheaf base.
  g.fillStyle(0x000000, 0.22);
  g.fillEllipse(cx, cy + 6, 12, 2);

  // Tied bundle of wheat stems — thin tapered straws fanning slightly
  // upward. Drawn as 7 stems at staggered angles, base meeting at the
  // tie point, fanning ±0.25 rad at the top so the bundle reads as
  // hand-gathered, not machine-stamped.
  const tieY = cy + 2;
  const stemTopY = cy - 12;
  const stemCount = 7;
  for (let i = 0; i < stemCount; i++) {
    // Symmetric fan: −0.3 to +0.3 rad spread across the bundle.
    const t = (i - (stemCount - 1) / 2) / ((stemCount - 1) / 2); // -1..+1
    const tipX = cx + t * 5;
    g.fillStyle(SHEAF_STEM, 1);
    drawSegment(g, cx, tieY, tipX, stemTopY, 0.7);
  }

  // Grain heads at each stem tip — small ovals in three-tone gold.
  for (let i = 0; i < stemCount; i++) {
    const t = (i - (stemCount - 1) / 2) / ((stemCount - 1) / 2);
    const tipX = cx + t * 5;
    // Outer dark grain.
    g.fillStyle(SHEAF_STEM, 1);
    g.fillEllipse(tipX, stemTopY, 1.6, 3);
    // Mid grain — main wheat-gold.
    g.fillStyle(SHEAF_GRAIN, 1);
    g.fillEllipse(tipX, stemTopY, 1.2, 2.6);
    // Highlight catches the sun on top.
    g.fillStyle(SHEAF_HI, 0.85);
    g.fillEllipse(tipX, stemTopY - 0.5, 0.7, 1.4);
    // Tiny dark awn (whisker) above each grain — the hairlike spike
    // characteristic of barley/wheat ears.
    g.fillStyle(SHEAF_STEM, 1);
    g.fillRect(tipX - 0.2, stemTopY - 4, 0.4, 2);
  }

  // Hemp tie — short horizontal band wrapped around the bundle base.
  g.fillStyle(SHEAF_TIE, 1);
  g.fillRect(cx - 3, tieY, 6, 1.8);
  g.fillStyle(0xc06824, 1);
  g.fillRect(cx - 2.8, tieY + 0.3, 5.6, 0.5);
  // Two trailing tie-ends curling down from the knot.
  g.fillStyle(SHEAF_TIE, 1);
  g.fillRect(cx + 1.4, tieY + 1.6, 0.5, 2.4);
  g.fillRect(cx - 1.8, tieY + 1.6, 0.5, 2.0);
}

function drawBannock(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Plate shadow underneath.
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(cx, cy + 3, 11, 1.8);

  // Round bannock — three stacked ellipses for outline, crust, and
  // crumb. Reads as a flat oatcake-style loaf rather than a yeasted
  // bread, which is the Lammas tradition.
  g.fillStyle(BANNOCK_CRUST, 1);
  g.fillEllipse(cx, cy, 9, 4.2);
  g.fillStyle(BANNOCK_CRUMB, 1);
  g.fillEllipse(cx, cy - 0.4, 7.5, 3.4);
  // Top sheen catches the kitchen window light.
  g.fillStyle(BANNOCK_HI, 0.85);
  g.fillEllipse(cx - 1, cy - 1.2, 4, 1.2);
  // Cross-scored quarters — the traditional Scottish bannock mark
  // (folk-belief: the cross keeps the fairies out of the loaf).
  g.fillStyle(BANNOCK_CRUST, 0.85);
  g.fillRect(cx - 3.5, cy - 0.3, 7, 0.5);
  g.fillRect(cx - 0.3, cy - 1.6, 0.5, 2.6);

  // A small pat of butter melting on top — single warm dot with a
  // brighter highlight, sells "fresh from the oven."
  g.fillStyle(BANNOCK_BUTTER, 0.85);
  g.fillCircle(cx + 0.6, cy - 1.4, 0.9);
  g.fillStyle(0xfff0c8, 0.95);
  g.fillCircle(cx + 0.4, cy - 1.6, 0.4);
}

