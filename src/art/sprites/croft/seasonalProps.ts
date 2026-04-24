/**
 * H1 M3 T21 — Seasonal croft props.
 *
 * Props auto-swap based on the active seasonal event (E1 framework):
 *
 *   burns_night — haggis platter on the table, "Address" card pinned
 *                 by the hearth, thistle bloomed bright on the sill.
 *   hogmanay    — reserved (Phase 2 authoring, see spec §3).
 *   beltane     — reserved.
 *   samhain     — reserved.
 *
 * Off-season draws nothing. Kept as a pure Phaser drawer — CroftScene
 * calls `drawSeasonalProps` with the active event key and the layout.
 * The drawer is a no-op for unknown keys so future events merge cleanly.
 */

import * as Phaser from 'phaser';
import type { CroftLayout } from '../../../scenes/croft/CroftComposition';

export function drawSeasonalProps(
  g: Phaser.GameObjects.Graphics,
  eventKey: string | null,
  layout: CroftLayout,
): void {
  if (!eventKey) return;
  switch (eventKey) {
    case 'burns_night':
      drawBurnsNightProps(g, layout);
      return;
    // hogmanay / beltane / samhain props land when E1 phases ship them.
    default:
      return;
  }
}

// ── Burns Night ────────────────────────────────────────────────────

const PLATTER_OUTLINE = 0x0a0604;
const PLATTER_METAL = 0xc0a878;
const PLATTER_SHEEN = 0xf0e0a0;
const HAGGIS_DARK = 0x3a1e0a;
const HAGGIS_MID = 0x6a3a14;
const HAGGIS_HI = 0x9a5a28;
const PARSLEY = 0x2a7018;
const STEAM = 0xe8d8b8;
const WHISKY = 0xd48a28;
const WHISKY_HI = 0xffc668;
const GLASS_OUTLINE = 0x202028;
const CARD_PAPER = 0xeee0b8;
const CARD_EDGE = 0x7a5428;
const INK = 0x2a1808;
const TAPE = 0xd4c484;
const THISTLE_PURPLE = 0xb048d8;
const THISTLE_HI = 0xe890ff;

function drawBurnsNightProps(
  g: Phaser.GameObjects.Graphics,
  layout: CroftLayout,
): void {
  drawHaggisPlatter(g, layout.table.x, layout.table.y);
  drawAddressCard(g, layout.mantelpiece.x + 8, layout.mantelpiece.y - 18);
  drawThistleBloom(g, layout.thistle.x, layout.thistle.y);
}

function drawHaggisPlatter(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Platter base (ellipse).
  g.fillStyle(PLATTER_OUTLINE, 1);
  g.fillEllipse(cx, cy, 32, 9);
  g.fillStyle(PLATTER_METAL, 1);
  g.fillEllipse(cx, cy, 30, 7.5);
  g.fillStyle(PLATTER_SHEEN, 0.7);
  g.fillEllipse(cx - 6, cy - 1, 10, 2);

  // Haggis shape on the plate — rounded dome.
  g.fillStyle(PLATTER_OUTLINE, 1);
  g.fillEllipse(cx, cy - 4, 20, 10);
  g.fillStyle(HAGGIS_DARK, 1);
  g.fillEllipse(cx, cy - 4, 18, 8);
  g.fillStyle(HAGGIS_MID, 1);
  g.fillEllipse(cx - 1, cy - 5, 14, 5);
  g.fillStyle(HAGGIS_HI, 0.8);
  g.fillEllipse(cx - 2, cy - 6.5, 8, 2);

  // Steam curls above — three little wisps.
  g.fillStyle(STEAM, 0.45);
  g.fillCircle(cx - 4, cy - 11, 1.8);
  g.fillCircle(cx, cy - 13, 1.5);
  g.fillCircle(cx + 4, cy - 10, 1.6);

  // Parsley sprig beside the haggis.
  g.fillStyle(PARSLEY, 1);
  g.fillCircle(cx + 9, cy - 3, 1.8);
  g.fillCircle(cx + 11, cy - 4.5, 1.3);

  // Wee whisky glass to the right of the platter.
  g.fillStyle(GLASS_OUTLINE, 1);
  g.fillRect(cx + 18, cy - 7, 5, 9);
  g.fillStyle(WHISKY, 1);
  g.fillRect(cx + 18.6, cy - 3, 3.8, 5);
  g.fillStyle(WHISKY_HI, 0.8);
  g.fillRect(cx + 19, cy - 2.5, 1, 3);
  // Glass lip.
  g.fillStyle(PLATTER_SHEEN, 0.5);
  g.fillRect(cx + 18, cy - 7, 5, 0.8);
}

function drawAddressCard(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
): void {
  // Parchment rectangle pinned by a strip of tape.
  const w = 22;
  const h = 14;
  g.fillStyle(CARD_EDGE, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(CARD_PAPER, 1);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  // Five tiny ink strokes — "To a Haggis", a signature line.
  g.fillStyle(INK, 1);
  g.fillRect(x + 3, y + 3, w - 6, 0.7);
  g.fillRect(x + 3, y + 5.5, w - 8, 0.6);
  g.fillRect(x + 3, y + 8, w - 7, 0.6);
  g.fillRect(x + 3, y + 10.5, w - 10, 0.6);
  // Curlicue flourish line suggesting a Burns signature.
  g.fillStyle(INK, 0.9);
  g.fillRect(x + w - 8, y + h - 3, 5, 0.6);
  g.fillRect(x + w - 5, y + h - 4, 0.6, 2);
  // Tape at top-centre.
  g.fillStyle(TAPE, 0.85);
  g.fillRect(x + w / 2 - 3, y - 2, 6, 3);
}

function drawThistleBloom(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
): void {
  // Bloom accent — lives OVER the placeholder thistle slot in CroftScene.
  // A bright purple puff of florets with cross-hatched highlights.
  g.fillStyle(THISTLE_PURPLE, 1);
  g.fillEllipse(cx, cy - 6, 8, 4);
  g.fillStyle(THISTLE_HI, 1);
  g.fillEllipse(cx, cy - 7, 5, 2);
  g.fillStyle(THISTLE_PURPLE, 0.85);
  for (let i = 0; i < 6; i++) {
    const ax = cx - 3 + i;
    g.fillRect(ax, cy - 10, 0.6, 3);
  }
  g.fillStyle(THISTLE_HI, 1);
  g.fillRect(cx - 2, cy - 11, 0.5, 1);
  g.fillRect(cx, cy - 11.5, 0.4, 1);
  g.fillRect(cx + 2, cy - 11, 0.5, 1);
}
