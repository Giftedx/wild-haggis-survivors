/**
 * Pure layout maths for the Curse picker tile row.
 *
 * Layout: `curseCount` tiles + 1 "clean run" opt-out tile, single
 * row along the bottom half. Row width is the viewport minus
 * symmetric margins minus the gutters between tiles.
 *
 * The Curse scene picks tile N's centre as
 *   `startX + (N + 0.5) * (tileW + gutter) - tileW / 2`
 * but we can simplify: `startX` here is the x-centre of tile 0, so
 * callers write `tileXForIndex(startX, i, tileW, gutter)`.
 */

/** Fixed pixel margin from viewport edges to the tile row. */
export const CURSE_TILE_GRID_MARGIN = 20;
/** Horizontal gap between adjacent tiles. */
export const CURSE_TILE_GUTTER = 10;
/** Standard tile height — kept here so balance/design can tune in one file. */
export const CURSE_TILE_HEIGHT = 340;
/** Y-centre of the tile row within the viewport. */
export const CURSE_TILE_Y = 260;

export interface CurseTileRowLayout {
  /** Width of each individual tile, post-clamp. */
  tileW: number;
  /** X-centre of tile 0. */
  startX: number;
  /** Y-centre shared by every tile (all tiles sit on the same row). */
  tileY: number;
  /** Height shared by every tile. */
  tileH: number;
  /** Total number of tiles rendered (curses + opt-out). */
  tilesInRow: number;
}

/**
 * Compute the tile row layout for the Curse picker given the
 * viewport width and the number of actual curses. Always adds 1 for
 * the "clean run" opt-out tile.
 */
export function curseTileRowLayout(
  viewportWidth: number,
  curseCount: number,
): CurseTileRowLayout {
  const tilesInRow = Math.max(1, Math.floor(curseCount) + 1);
  const available =
    viewportWidth - CURSE_TILE_GRID_MARGIN * 2 - CURSE_TILE_GUTTER * (tilesInRow - 1);
  const tileW = Math.max(0, available / tilesInRow);
  const startX = CURSE_TILE_GRID_MARGIN + tileW / 2;
  return {
    tileW,
    startX,
    tileY: CURSE_TILE_Y,
    tileH: CURSE_TILE_HEIGHT,
    tilesInRow,
  };
}

/** X-centre of tile `i` (zero-based). */
export function tileXForIndex(
  startX: number,
  index: number,
  tileW: number,
  gutter: number = CURSE_TILE_GUTTER,
): number {
  return startX + index * (tileW + gutter);
}
