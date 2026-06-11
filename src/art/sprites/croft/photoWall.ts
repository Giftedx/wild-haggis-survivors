/**
 * H1 M2 T14 — Photo wall drawer.
 *
 * Polaroids for each Moor Road route the player has ever picked. Six
 * slots (one per RouteKey) arranged in a 3×2 grid on the wall strip.
 * Unvisited routes show a sepia-desaturated thumbnail (a "memory still
 * to be made"); visited routes show a full-colour print with a tiny
 * tape strip pinning it to the wall.
 *
 * Draws directly in-scene — no texture-bake. CroftScene re-renders on
 * each `create()` so "first pick" reveals just work when the player
 * returns from a run.
 */

import * as Phaser from 'phaser';
import type { RouteKey } from '../../../data/routes';

/**
 * Canonical ordering — the photo wall renders in this order, left-to-
 * right, top-to-bottom. Matches the picker sequence so the wall reads
 * like a journey timeline.
 */
export const PHOTO_WALL_ROUTE_ORDER: readonly RouteKey[] = [
  'up_the_brae',
  'round_the_loch',
  'through_the_kirkyard',
  'stand_yer_ground',
  'run_for_the_hills',
  'buckie_pitstop',
];

/** Default grid width (columns) for the wall layout. */
export const PHOTO_WALL_COLUMNS = 3;

// ── Palette (full colour) ────────────────────────────────────────────
const FRAME_PAPER = 0xf4ecd8;
const FRAME_SHADOW = 0x1a1408;
const FRAME_EDGE = 0xbfa880;
const TAPE = 0xd4c484;
const CAPTION = 0x5a4828;

// Per-route colour palettes. Each pair = dominant + accent for the
// simple illustration inside the polaroid.
interface RoutePalette {
  sky: number;
  ground: number;
  accent: number;
  ink: number;
}
const PALETTES: Readonly<Record<RouteKey, RoutePalette>> = {
  up_the_brae: { sky: 0xfcb56a, ground: 0x4a6a2a, accent: 0x7a4a1a, ink: 0x1a1008 }, // sunset brae
  round_the_loch: { sky: 0x8ec8e8, ground: 0x2a5a8a, accent: 0xa8e0ff, ink: 0x10202a }, // loch
  through_the_kirkyard: { sky: 0x4a4858, ground: 0x2a2a30, accent: 0x9aa0b0, ink: 0x0a0a14 }, // stones
  stand_yer_ground: { sky: 0x8a7e68, ground: 0x4a3828, accent: 0x8a4a2a, ink: 0x1a0a06 }, // defensive ring
  run_for_the_hills: { sky: 0xb890d4, ground: 0x58406a, accent: 0xf0d090, ink: 0x20102a }, // distant hills dusk
  buckie_pitstop: { sky: 0x2a1a0a, ground: 0x4a2808, accent: 0x4a9a2a, ink: 0x0a0804 }, // Buckfast green
};

// ── Desaturate helper: approximate sepia blend of a colour ───────────
function toSepia(color: number, strength = 0.75): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  const luma = 0.299 * r + 0.587 * g + 0.114 * b;
  // Sepia tint: scale luma into warm brown bands.
  const sr = Math.min(255, Math.round(luma * 1.05 + 40));
  const sg = Math.min(255, Math.round(luma * 0.88 + 24));
  const sb = Math.min(255, Math.round(luma * 0.62));
  // Blend toward sepia at `strength`.
  const or = Math.round(r * (1 - strength) + sr * strength);
  const og = Math.round(g * (1 - strength) + sg * strength);
  const ob = Math.round(b * (1 - strength) + sb * strength);
  return (or << 16) | (og << 8) | ob;
}

/**
 * Compute one (x, y, w, h) rect per polaroid, arranged in a
 * `PHOTO_WALL_COLUMNS`-wide grid inside the photo-wall region.
 */
export function computePhotoWallSlots(
  region: { x: number; y: number; w: number; h: number },
  count: number,
  columns: number = PHOTO_WALL_COLUMNS,
): Array<{ x: number; y: number; w: number; h: number }> {
  if (count <= 0 || columns <= 0) return [];
  const rows = Math.ceil(count / columns);
  const gutter = 4;
  const cellW = (region.w - gutter * (columns + 1)) / columns;
  const cellH = (region.h - gutter * (rows + 1)) / rows;
  const slots: Array<{ x: number; y: number; w: number; h: number }> = [];
  for (let i = 0; i < count; i++) {
    const col = i % columns;
    const row = Math.floor(i / columns);
    slots.push({
      x: region.x + gutter + col * (cellW + gutter),
      y: region.y + gutter + row * (cellH + gutter),
      w: cellW,
      h: cellH,
    });
  }
  return slots;
}

/**
 * Render a single polaroid at the given cell. `visited=false` paints
 * the sepia "memory" version; `visited=true` restores full colour.
 */
export function drawPolaroid(
  g: Phaser.GameObjects.Graphics,
  cell: { x: number; y: number; w: number; h: number },
  routeKey: RouteKey,
  visited: boolean,
): void {
  const { x, y, w, h } = cell;
  const palette = PALETTES[routeKey];

  // Drop shadow.
  g.fillStyle(FRAME_SHADOW, 0.35);
  g.fillRect(x + 1.5, y + 1.5, w, h);

  // Polaroid paper — white with a slight sag at the bottom for the
  // classic captioning strip.
  g.fillStyle(FRAME_EDGE, 1);
  g.fillRect(x, y, w, h);
  g.fillStyle(visited ? FRAME_PAPER : toSepia(FRAME_PAPER, 0.4), 1);
  g.fillRect(x + 0.8, y + 0.8, w - 1.6, h - 1.6);

  // Photo window — inner rectangle (leaves the caption strip beneath).
  const photoInset = Math.max(2, Math.floor(w * 0.08));
  const px = x + photoInset;
  const py = y + photoInset;
  const pw = w - photoInset * 2;
  const ph = h - photoInset * 2 - Math.max(4, Math.floor(h * 0.18));

  const paint = (c: number) => (visited ? c : toSepia(c));

  // Sky background.
  g.fillStyle(paint(palette.sky), 1);
  g.fillRect(px, py, pw, ph);

  // Route-specific foreground illustration — kept iconic.
  drawRouteIllustration(g, px, py, pw, ph, routeKey, palette, paint);

  // Caption strip beneath the photo.
  const capY = py + ph + 1;
  const capH = (y + h - photoInset) - capY;
  g.fillStyle(paint(FRAME_PAPER), 1);
  g.fillRect(px, capY, pw, capH);
  // Hand-written caption line — a single subtle pen stroke.
  g.fillStyle(visited ? CAPTION : toSepia(CAPTION, 0.4), 0.9);
  g.fillRect(px + 2, capY + Math.floor(capH / 2), Math.max(4, pw - 4), 0.7);

  // Tape strip at top-centre (only on visited — unvisited sits loose).
  if (visited) {
    g.fillStyle(TAPE, 0.85);
    g.fillRect(x + w * 0.33, y - 2, w * 0.34, 4);
    g.fillStyle(FRAME_SHADOW, 0.2);
    g.fillRect(x + w * 0.33, y - 2, w * 0.34, 0.6);
  }

  // Outer frame outline.
  g.lineStyle(0.8, FRAME_SHADOW, 0.9);
  g.strokeRect(x + 0.4, y + 0.4, w - 0.8, h - 0.8);
}

/**
 * Draw one polaroid per canonical RouteKey inside the photo-wall rect.
 * `firstRouteVisits` is the dedup'd list of routes the player has
 * ever picked — members render in colour, non-members render sepia.
 */
export function drawPhotoWall(
  g: Phaser.GameObjects.Graphics,
  region: { x: number; y: number; w: number; h: number },
  firstRouteVisits: readonly string[],
): void {
  const slots = computePhotoWallSlots(region, PHOTO_WALL_ROUTE_ORDER.length);
  const visited = new Set(firstRouteVisits);
  PHOTO_WALL_ROUTE_ORDER.forEach((routeKey, idx) => {
    drawPolaroid(g, slots[idx], routeKey, visited.has(routeKey));
  });
}

// ── Route-specific illustrations ─────────────────────────────────────

type PaintFn = (c: number) => number;

function drawRouteIllustration(
  g: Phaser.GameObjects.Graphics,
  x: number, y: number, w: number, h: number,
  key: RouteKey,
  palette: RoutePalette,
  paint: PaintFn,
): void {
  const cx = x + w / 2;
  switch (key) {
    case 'up_the_brae': {
      // Hill silhouette under a setting sun.
      g.fillStyle(paint(palette.accent), 1);
      g.fillCircle(x + w * 0.28, y + h * 0.35, Math.min(w, h) * 0.18);
      g.fillStyle(paint(palette.ground), 1);
      g.fillTriangle(x, y + h, x + w, y + h, x + w * 0.6, y + h * 0.45);
      g.fillStyle(paint(palette.ink), 1);
      // Tiny haggis dot climbing.
      g.fillRect(x + w * 0.55, y + h * 0.6, 2, 2);
      break;
    }
    case 'round_the_loch': {
      // Loch water with ripples + small island.
      g.fillStyle(paint(palette.ground), 1);
      g.fillRect(x, y + h * 0.5, w, h * 0.5);
      g.fillStyle(paint(palette.accent), 0.9);
      for (let i = 0; i < 3; i++) {
        g.fillRect(x + w * 0.1, y + h * 0.6 + i * h * 0.1, w * 0.8, 0.8);
      }
      g.fillStyle(paint(palette.ink), 1);
      g.fillEllipse(cx, y + h * 0.5 - 1, Math.max(2, w * 0.25), 2);
      break;
    }
    case 'through_the_kirkyard': {
      // Three gravestones + a subtle cross.
      g.fillStyle(paint(palette.ground), 1);
      g.fillRect(x, y + h * 0.7, w, h * 0.3);
      g.fillStyle(paint(palette.accent), 1);
      g.fillRect(x + w * 0.2, y + h * 0.45, w * 0.1, h * 0.3);
      g.fillRect(x + w * 0.45, y + h * 0.38, w * 0.12, h * 0.37);
      g.fillRect(x + w * 0.72, y + h * 0.5, w * 0.08, h * 0.25);
      g.fillStyle(paint(palette.ink), 1);
      // Cross etched on the middle stone.
      g.fillRect(x + w * 0.51 - 0.5, y + h * 0.42, 1, h * 0.13);
      g.fillRect(x + w * 0.48, y + h * 0.5, w * 0.06, 1);
      break;
    }
    case 'stand_yer_ground': {
      // Ring of stones (defensive).
      g.fillStyle(paint(palette.ground), 1);
      g.fillRect(x, y + h * 0.65, w, h * 0.35);
      g.fillStyle(paint(palette.accent), 1);
      for (let i = 0; i < 5; i++) {
        const rx = cx + Math.cos(i * Math.PI * 0.4) * w * 0.3;
        const ry = y + h * 0.7 + Math.sin(i * Math.PI * 0.4) * h * 0.08;
        g.fillRect(rx - 1.5, ry - 2.5, 3, 5);
      }
      g.fillStyle(paint(palette.ink), 1);
      g.fillCircle(cx, y + h * 0.72, 1.5);
      break;
    }
    case 'run_for_the_hills': {
      // Layered hills receding, small runner.
      g.fillStyle(paint(palette.ground), 0.65);
      g.fillTriangle(x, y + h, x + w * 0.45, y + h * 0.55, x + w * 0.5, y + h);
      g.fillStyle(paint(palette.ground), 0.85);
      g.fillTriangle(x + w * 0.3, y + h, x + w * 0.75, y + h * 0.45, x + w * 0.9, y + h);
      g.fillStyle(paint(palette.accent), 0.7);
      g.fillCircle(x + w * 0.8, y + h * 0.25, Math.max(2, Math.min(w, h) * 0.12));
      g.fillStyle(paint(palette.ink), 1);
      g.fillRect(x + w * 0.35, y + h * 0.75, 2, 3);
      break;
    }
    case 'buckie_pitstop': {
      // Dark pub doorway + Buckfast-green bottle silhouette.
      g.fillStyle(paint(palette.ink), 1);
      g.fillRect(x + w * 0.45, y + h * 0.3, w * 0.3, h * 0.55);
      g.fillStyle(paint(palette.accent), 1);
      g.fillRect(x + w * 0.28, y + h * 0.55, w * 0.06, h * 0.3);
      g.fillCircle(x + w * 0.31, y + h * 0.52, w * 0.05);
      // Bottle label flash.
      g.fillStyle(paint(0xfff0a0), 1);
      g.fillRect(x + w * 0.28, y + h * 0.7, w * 0.06, h * 0.06);
      break;
    }
  }
}
