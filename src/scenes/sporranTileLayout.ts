/**
 * Pure layout maths for the Sporran picker tile row. Sister to
 * `curseTileLayout.ts` — same single-row pattern, sized for 7 tiles
 * instead of 5 (4 curses + 1 clean-run). Tighter gutter compensates
 * for the higher tile count at 800px viewport.
 *
 * Pure — no Phaser. Testable without booting the scene; the scene
 * delegates `centreXForIndex(...)` so a regression in tile arithmetic
 * is caught by `sporranTileLayout.test.ts` rather than visual QA.
 */

/** Fixed pixel margin from viewport edges to the tile row. */
export const SPORRAN_TILE_GRID_MARGIN = 20;
/** Horizontal gap between adjacent tiles. Tighter than the 5-curse row. */
export const SPORRAN_TILE_GUTTER = 6;
/** Tile height — kept here so design can tune in one place. */
export const SPORRAN_TILE_HEIGHT = 280;
/** Y-centre of the tile row within the viewport. */
export const SPORRAN_TILE_Y = 250;
/** Number of cards drawn into the hand (UI-side mirror of `SPORRAN_DRAW_COUNT`). */
export const SPORRAN_TILE_COUNT = 7;

export interface SporranTileRowLayout {
  /** Width of each individual tile, post-clamp. */
  tileW: number;
  /** X-centre of tile 0. */
  startX: number;
  /** Y-centre shared by every tile (single row). */
  tileY: number;
  /** Height shared by every tile. */
  tileH: number;
  /** Number of tiles rendered (always SPORRAN_TILE_COUNT today). */
  tilesInRow: number;
}

/**
 * Compute the tile row layout for the Sporran picker given the viewport
 * width. Tile count is fixed at SPORRAN_TILE_COUNT — the helper takes
 * `count` only for symmetry with `curseTileRowLayout` and to keep tests
 * legible at non-default counts (Phase 2 may grow the hand).
 */
export function sporranTileRowLayout(
  viewportWidth: number,
  count: number = SPORRAN_TILE_COUNT,
): SporranTileRowLayout {
  const tilesInRow = Math.max(1, Math.floor(count));
  const available =
    viewportWidth - SPORRAN_TILE_GRID_MARGIN * 2 - SPORRAN_TILE_GUTTER * (tilesInRow - 1);
  const tileW = Math.max(0, available / tilesInRow);
  const startX = SPORRAN_TILE_GRID_MARGIN + tileW / 2;
  return {
    tileW,
    startX,
    tileY: SPORRAN_TILE_Y,
    tileH: SPORRAN_TILE_HEIGHT,
    tilesInRow,
  };
}

/** X-centre of tile `i` (zero-based). */
export function sporranTileXForIndex(
  startX: number,
  index: number,
  tileW: number,
  gutter: number = SPORRAN_TILE_GUTTER,
): number {
  return startX + index * (tileW + gutter);
}

/**
 * Card-kind palette. The kind chip on each tile uses the matching
 * accent colour as background; the tile border tracks the same colour
 * at low alpha so the tile-strip reads as a colour-coded hand at a
 * glance (curse / boon / quirk groupings legible without reading).
 *
 * Curse purple matches CurseScene's purple-wine wash. Boon green is
 * Hearth-warm thistle-leaf. Quirk amber is Wild-Comedy whisky-cask.
 */
export const SPORRAN_KIND_ACCENT = {
  curse: 0xb35287,
  boon: 0x4a8e6a,
  quirk: 0xc88a3a,
} as const;

export type SporranKindAccentKey = keyof typeof SPORRAN_KIND_ACCENT;

export function sporranKindAccent(kind: SporranKindAccentKey): number {
  return SPORRAN_KIND_ACCENT[kind];
}
