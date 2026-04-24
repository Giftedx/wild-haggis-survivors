/**
 * H1 M2 T13 — Mantelpiece drawer.
 *
 * Renders the mantelpiece shelf inside the croft plus one trophy slot
 * per canonical boss. Each slot shows:
 *   - 'none'   → dim dusty silhouette (empty shelf outline)
 *   - 'first'  → base trophy art
 *   - 'tenth'  → base + enriched attachment
 *   - 'cursed' → cursed variant (burns, cracks, red ink)
 *
 * Trophies draw directly in-scene — no texture-bake; the shelf and the
 * trophy cells redraw whenever the scene is re-entered (Gran's Croft
 * doesn't load-cycle often enough to matter). Kept Phaser-side only
 * because the test suite covers the pure tier logic (CroftTrophies)
 * and spatial layout (shelf row maths below).
 */

import * as Phaser from 'phaser';
import type { Trophy, TrophyBossKey, TrophyTier } from '../../../scenes/croft/CroftTrophies';

const SHELF_WOOD_DARK = 0x3a2414;
const SHELF_WOOD_MID = 0x5a3a20;
const SHELF_WOOD_HI = 0x7a5a38;
const SHELF_SHADOW = 0x000000;
const OUTLINE = 0x0a0604;
const DUST = 0x8a7a60;

// ── Per-boss palettes ──────────────────────────────────────────────

const PALETTE_GORDON = {
  metal: 0xa0a0a8,
  metalHi: 0xd8d8e0,
  apron: 0xeeeeee,
  apronDirt: 0x9a8a70,
  burn: 0x1a0a06,
};
const PALETTE_TOUR_BUS = {
  tyre: 0x1a1a1a,
  hub: 0x606870,
  hubHi: 0xa0a8b0,
  route: 0xd8c020,
  crack: 0xffffff,
};
const PALETTE_LAIRD = {
  tweedDark: 0x3a2810,
  tweedMid: 0x5a3e20,
  tweedHi: 0x8a6830,
  stick: 0x4a2a10,
  stickHi: 0x7a4a20,
  ring: 0xd8b040,
};
const PALETTE_HUNTER = {
  helmet: 0xc8b878,
  helmetHi: 0xe8d89a,
  brim: 0x8a7a48,
  journal: 0x5a2a18,
  journalPage: 0xe8d8b0,
  rifle: 0x3a2a1a,
  rifleMetal: 0x9a9aa0,
};
const PALETTE_TAXMAN = {
  ledgerDark: 0x2a1a08,
  ledgerMid: 0x4a2a10,
  ledgerPage: 0xe8d8a8,
  quill: 0x5a3a20,
  quillTip: 0xeeeeee,
  redInk: 0xcc2222,
  redInkHi: 0xff4444,
};

/**
 * Compute per-slot X positions across a mantelpiece shelf rect.
 * Pure helper — unit-testable without Phaser.
 */
export function computeTrophySlotXs(
  shelfX: number,
  shelfW: number,
  slotCount: number,
): number[] {
  if (slotCount <= 0) return [];
  const sideGutter = Math.max(8, shelfW * 0.06);
  const usable = shelfW - sideGutter * 2;
  const step = usable / slotCount;
  return Array.from({ length: slotCount }, (_, i) => shelfX + sideGutter + step * (i + 0.5));
}

/**
 * Draw the mantelpiece shelf strip as a thick wooden plank with a
 * soft shadow underneath. Trophies ride on top.
 */
export function drawMantelpieceShelf(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  w: number,
  h: number,
): void {
  // Drop-shadow underneath.
  g.fillStyle(SHELF_SHADOW, 0.3);
  g.fillRect(x + 2, y + h - 1, w - 4, 3);

  // Plank.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(SHELF_WOOD_DARK, 1);
  g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle(SHELF_WOOD_MID, 1);
  g.fillRect(x + 2, y + 2, w - 4, Math.max(2, h - 5));
  g.fillStyle(SHELF_WOOD_HI, 0.7);
  g.fillRect(x + 2, y + 2, w - 4, 1);

  // Grain streaks.
  g.fillStyle(SHELF_WOOD_DARK, 0.7);
  for (let i = 0; i < Math.floor(w / 28); i++) {
    const gx = x + 6 + i * 28 + (i % 2 === 0 ? 0 : 5);
    g.fillRect(gx, y + 2, 1.2, h - 4);
  }
}

/**
 * Draw one trophy cell at the given center (cx, cy). The baseline of
 * the sprite sits near `cy` so it visually stands on the shelf.
 */
export function drawTrophyCell(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  trophy: Trophy,
): void {
  const tier = trophy.tier;
  if (tier === 'none') {
    drawDustySilhouette(g, cx, cy);
    return;
  }
  switch (trophy.bossKey as TrophyBossKey) {
    case 'gordon': drawGordonTrophy(g, cx, cy, tier); break;
    case 'tour_bus': drawTourBusTrophy(g, cx, cy, tier); break;
    case 'the_laird': drawLairdTrophy(g, cx, cy, tier); break;
    case 'hunter_general': drawHunterTrophy(g, cx, cy, tier); break;
    case 'taxman': drawTaxmanTrophy(g, cx, cy, tier); break;
  }
}

/**
 * Render every trophy for the composed SaveData view as a row across
 * the given mantel rect. CroftScene calls this once per create().
 */
export function drawMantelpieceTrophies(
  g: Phaser.GameObjects.Graphics,
  trophies: readonly Trophy[],
  shelf: { x: number; y: number; w: number; h: number },
): void {
  drawMantelpieceShelf(g, shelf.x, shelf.y, shelf.w, shelf.h);
  const xs = computeTrophySlotXs(shelf.x, shelf.w, trophies.length);
  const baseline = shelf.y + 2; // tops of trophies sit just above the shelf
  trophies.forEach((t, i) => drawTrophyCell(g, xs[i], baseline, t));
}

// ── Empty slot ─────────────────────────────────────────────────────

function drawDustySilhouette(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
  // A small oval of dust with a faint outline — "nothing here yet".
  g.fillStyle(DUST, 0.25);
  g.fillEllipse(cx, cy - 1, 10, 3);
  g.fillStyle(OUTLINE, 0.25);
  g.fillEllipse(cx, cy - 1, 10, 3);
}

// ── Gordon — chef's ladle ──────────────────────────────────────────

function drawGordonTrophy(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  tier: TrophyTier,
): void {
  const p = PALETTE_GORDON;
  // Ladle handle (vertical).
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 0.5, cy - 13, 1.5, 11);
  g.fillStyle(p.metal, 1);
  g.fillRect(cx, cy - 13, 0.8, 10);
  // Ladle bowl (oval).
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx, cy - 2, 7, 4);
  g.fillStyle(p.metal, 1);
  g.fillEllipse(cx, cy - 2, 6, 3);
  g.fillStyle(p.metalHi, 1);
  g.fillEllipse(cx - 1, cy - 3, 2, 1);

  if (tier === 'first') return;

  // Apron scrap draped beside the ladle.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 3, cy - 8, 6, 9);
  const apronFill = tier === 'cursed' ? p.apronDirt : p.apron;
  g.fillStyle(apronFill, 1);
  g.fillRect(cx + 4, cy - 7, 4, 7);

  if (tier === 'tenth') return;

  // Cursed — scorch marks on the apron + burnt spoon crossing the ladle.
  g.fillStyle(p.burn, 1);
  g.fillRect(cx + 5, cy - 5, 2, 2);
  g.fillRect(cx + 4, cy - 2, 3, 1);
  // Burnt spoon (crossing the handle).
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 5, cy - 8, 9, 1.5);
  g.fillStyle(p.burn, 1);
  g.fillCircle(cx - 5, cy - 8, 1.2);
}

// ── Tour Bus — wheel ───────────────────────────────────────────────

function drawTourBusTrophy(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  tier: TrophyTier,
): void {
  const p = PALETTE_TOUR_BUS;
  // Tyre.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, cy - 6, 6);
  g.fillStyle(p.tyre, 1);
  g.fillCircle(cx, cy - 6, 5.2);
  // Hub.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx, cy - 6, 2.6);
  g.fillStyle(p.hub, 1);
  g.fillCircle(cx, cy - 6, 2.1);
  g.fillStyle(p.hubHi, 1);
  g.fillCircle(cx - 0.7, cy - 6.8, 0.8);
  // Spokes (4).
  g.fillStyle(p.hub, 1);
  g.fillRect(cx - 0.4, cy - 10, 0.8, 4);
  g.fillRect(cx - 0.4, cy - 2, 0.8, 4);
  g.fillRect(cx - 4, cy - 6.4, 4, 0.8);
  g.fillRect(cx, cy - 6.4, 4, 0.8);

  if (tier === 'first') return;

  // Route-number plate beside the wheel.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 4, cy - 5, 6, 4);
  g.fillStyle(p.route, 1);
  g.fillRect(cx + 4.5, cy - 4.5, 5, 3);
  // "No." glyph — a tiny dark hyphen.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 5, cy - 3.2, 3, 0.6);

  if (tier === 'tenth') return;

  // Cursed — cracked windshield shard overlay on the wheel.
  g.fillStyle(p.crack, 1);
  g.lineStyle(0.7, p.crack, 0.95);
  g.beginPath();
  g.moveTo(cx - 3, cy - 9);
  g.lineTo(cx + 1, cy - 5);
  g.lineTo(cx + 4, cy - 7);
  g.strokePath();
  g.beginPath();
  g.moveTo(cx + 1, cy - 5);
  g.lineTo(cx - 2, cy - 3);
  g.strokePath();
}

// ── Laird — tweed cap ──────────────────────────────────────────────

function drawLairdTrophy(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  tier: TrophyTier,
): void {
  const p = PALETTE_LAIRD;
  // Cap crown.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx, cy - 8, 12, 8);
  g.fillStyle(p.tweedDark, 1);
  g.fillEllipse(cx, cy - 8, 10.6, 6.5);
  g.fillStyle(p.tweedMid, 1);
  g.fillEllipse(cx, cy - 9, 8, 4);
  g.fillStyle(p.tweedHi, 0.7);
  g.fillEllipse(cx - 1, cy - 10, 4, 1.5);
  // Cap peak (flat brim jutting forward).
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 7, cy - 5, 14, 2);
  g.fillStyle(p.tweedMid, 1);
  g.fillRect(cx - 6.5, cy - 4.5, 13, 1);

  if (tier === 'first') return;

  // Walking stick propped beside the cap.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 6, cy - 13, 1.5, 15);
  g.fillStyle(p.stick, 1);
  g.fillRect(cx + 6.4, cy - 12.5, 0.8, 14);
  // Crook at the top.
  g.fillStyle(p.stickHi, 1);
  g.fillCircle(cx + 8, cy - 13, 1.2);

  if (tier === 'tenth') return;

  // Cursed — signet ring loose on the shelf next to the stick.
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx - 6, cy - 1, 2.1);
  g.fillStyle(p.ring, 1);
  g.fillCircle(cx - 6, cy - 1, 1.6);
  g.fillStyle(OUTLINE, 1);
  g.fillCircle(cx - 6, cy - 1, 0.7);
}

// ── Hunter General — pith helmet ───────────────────────────────────

function drawHunterTrophy(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  tier: TrophyTier,
): void {
  const p = PALETTE_HUNTER;
  // Dome.
  g.fillStyle(OUTLINE, 1);
  g.fillEllipse(cx, cy - 8, 11, 9);
  g.fillStyle(p.helmet, 1);
  g.fillEllipse(cx, cy - 8, 9.5, 7.5);
  g.fillStyle(p.helmetHi, 0.9);
  g.fillEllipse(cx - 1, cy - 10, 3, 1.5);
  // Brim.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 7, cy - 4, 14, 2);
  g.fillStyle(p.brim, 1);
  g.fillRect(cx - 6.5, cy - 3.5, 13, 1);

  if (tier === 'first') return;

  // Leather journal beside the helmet.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx + 4, cy - 6, 7, 8);
  g.fillStyle(p.journal, 1);
  g.fillRect(cx + 4.5, cy - 5.5, 6, 7);
  // Pages (light edge along the open side).
  g.fillStyle(p.journalPage, 1);
  g.fillRect(cx + 10, cy - 5, 0.8, 6);

  if (tier === 'tenth') return;

  // Cursed — broken rifle lying across the front.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 7, cy - 1, 14, 2);
  g.fillStyle(p.rifle, 1);
  g.fillRect(cx - 6.5, cy - 0.5, 13, 1);
  // Broken section in the middle.
  g.fillStyle(p.rifleMetal, 1);
  g.fillRect(cx - 1.5, cy - 1.5, 2, 3);
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 0.5, cy - 2.5, 0.8, 5);
}

// ── Taxman — ledger ────────────────────────────────────────────────

function drawTaxmanTrophy(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  tier: TrophyTier,
): void {
  const p = PALETTE_TAXMAN;
  // Ledger — tall leather-bound book.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 5, cy - 12, 10, 12);
  g.fillStyle(p.ledgerDark, 1);
  g.fillRect(cx - 4.5, cy - 11.5, 9, 11);
  g.fillStyle(p.ledgerMid, 1);
  g.fillRect(cx - 4, cy - 11, 8, 10);
  // Pages showing at the top.
  g.fillStyle(p.ledgerPage, 1);
  g.fillRect(cx - 4, cy - 11, 8, 0.8);
  // Binding band horizontal.
  g.fillStyle(p.ledgerDark, 1);
  g.fillRect(cx - 5, cy - 6, 10, 1.5);

  if (tier === 'first') return;

  // Quill propped against the ledger spine.
  g.fillStyle(OUTLINE, 1);
  g.fillRect(cx - 10, cy - 13, 1.5, 12);
  g.fillStyle(p.quill, 1);
  g.fillRect(cx - 9.5, cy - 12.5, 0.8, 11);
  // Feather vane along the quill.
  g.fillStyle(p.quillTip, 1);
  g.fillEllipse(cx - 9, cy - 12, 3, 4);
  g.fillStyle(p.quill, 0.8);
  g.fillRect(cx - 9.2, cy - 13, 0.4, 5);

  if (tier === 'tenth') return;

  // Cursed — crimson ink bleed splashed across the cover.
  g.fillStyle(p.redInk, 1);
  g.fillCircle(cx + 2, cy - 3, 2.3);
  g.fillCircle(cx - 1, cy - 7, 1.5);
  g.fillStyle(p.redInkHi, 1);
  g.fillCircle(cx + 2, cy - 3, 1.1);
  // A single drip running down the spine.
  g.fillStyle(p.redInk, 1);
  g.fillRect(cx + 1.5, cy - 2, 0.8, 3);
}
