import { describe, it, expect } from 'vitest';
import {
  curseTileRowLayout,
  tileXForIndex,
  resolveCurseTileBestedStyle,
  CURSE_TILE_BESTED,
  CURSE_TILE_FRESH,
  CURSE_TILE_GRID_MARGIN,
  CURSE_TILE_GUTTER,
  CURSE_TILE_HEIGHT,
  CURSE_TILE_Y,
} from './curseTileLayout';

describe('curseTileRowLayout', () => {
  it('always reserves 1 tile slot for the "clean run" opt-out', () => {
    // 4 curses → 5 tiles in the row.
    expect(curseTileRowLayout(800, 4).tilesInRow).toBe(5);
    // 0 curses (edge case) → 1 tile (just the opt-out).
    expect(curseTileRowLayout(800, 0).tilesInRow).toBe(1);
  });

  it('tileW fills (viewport - 2*margin - gutters) evenly across tiles', () => {
    const { tileW, tilesInRow } = curseTileRowLayout(800, 4);
    // 800 - 40 (margins) - 40 (4 gutters @ 10) = 720; 720/5 = 144
    expect(tilesInRow).toBe(5);
    expect(tileW).toBeCloseTo(144, 6);
  });

  it('startX puts the first tile centre at left-margin + tileW/2', () => {
    const { tileW, startX } = curseTileRowLayout(800, 4);
    expect(startX).toBe(CURSE_TILE_GRID_MARGIN + tileW / 2);
  });

  it('row spans symmetrically — last tile\'s right edge equals viewport - margin', () => {
    const vp = 800;
    const { tileW, startX, tilesInRow } = curseTileRowLayout(vp, 4);
    const lastCentre = tileXForIndex(startX, tilesInRow - 1, tileW);
    const lastRightEdge = lastCentre + tileW / 2;
    expect(lastRightEdge).toBeCloseTo(vp - CURSE_TILE_GRID_MARGIN, 6);
  });

  it('tileY and tileH come from the exported constants', () => {
    const out = curseTileRowLayout(800, 4);
    expect(out.tileY).toBe(CURSE_TILE_Y);
    expect(out.tileH).toBe(CURSE_TILE_HEIGHT);
  });

  it('floors negative curse counts to 1 slot (defensive)', () => {
    expect(curseTileRowLayout(800, -3).tilesInRow).toBe(1);
  });

  it('floors fractional curse counts', () => {
    // 4.9 floors to 4 curses → 5 tiles in row.
    expect(curseTileRowLayout(800, 4.9).tilesInRow).toBe(5);
  });

  it('clamps tileW to ≥ 0 when the viewport is too narrow', () => {
    const { tileW } = curseTileRowLayout(50, 4);
    expect(tileW).toBeGreaterThanOrEqual(0);
  });
});

describe('tileXForIndex', () => {
  it('index 0 returns startX itself', () => {
    expect(tileXForIndex(100, 0, 50)).toBe(100);
  });

  it('advances by (tileW + gutter) per index', () => {
    const startX = 100;
    const tileW = 50;
    const gutter = 10;
    expect(tileXForIndex(startX, 1, tileW, gutter)).toBe(160);
    expect(tileXForIndex(startX, 2, tileW, gutter)).toBe(220);
  });

  it('default gutter matches CURSE_TILE_GUTTER', () => {
    expect(tileXForIndex(0, 1, 50)).toBe(50 + CURSE_TILE_GUTTER);
  });
});

describe('resolveCurseTileBestedStyle', () => {
  it('bested tiles get the warmer plum fill + full opacity border', () => {
    expect(resolveCurseTileBestedStyle(true)).toBe(CURSE_TILE_BESTED);
    expect(CURSE_TILE_BESTED.borderAlpha).toBe(1);
  });

  it('fresh tiles get the cool fill + slightly dimmed border', () => {
    expect(resolveCurseTileBestedStyle(false)).toBe(CURSE_TILE_FRESH);
    expect(CURSE_TILE_FRESH.borderAlpha).toBeLessThan(1);
  });

  it('bested and fresh palettes differ on every field', () => {
    expect(CURSE_TILE_BESTED.fillColor).not.toBe(CURSE_TILE_FRESH.fillColor);
    expect(CURSE_TILE_BESTED.borderAlpha).not.toBe(CURSE_TILE_FRESH.borderAlpha);
  });
});
