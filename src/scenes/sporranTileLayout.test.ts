import { describe, expect, it } from 'vitest';
import {
  SPORRAN_KIND_ACCENT,
  SPORRAN_TILE_COUNT,
  SPORRAN_TILE_GRID_MARGIN,
  SPORRAN_TILE_GUTTER,
  SPORRAN_TILE_HEIGHT,
  sporranKindAccent,
  sporranTileRowLayout,
  sporranTileXForIndex,
} from './sporranTileLayout';

describe('sporranTileRowLayout', () => {
  it('computes tile width that fits 7 tiles + margins + gutters at 800px', () => {
    const layout = sporranTileRowLayout(800);
    expect(layout.tilesInRow).toBe(SPORRAN_TILE_COUNT);
    expect(layout.tileH).toBe(SPORRAN_TILE_HEIGHT);
    // 800 - 40 (margin) - 36 (6 * 6 gutter) = 724, /7 = ~103.4
    expect(layout.tileW).toBeCloseTo(103.43, 1);
    expect(layout.startX).toBeCloseTo(20 + 103.43 / 2, 1);
  });

  it('first tile centre = startX', () => {
    const layout = sporranTileRowLayout(800);
    expect(sporranTileXForIndex(layout.startX, 0, layout.tileW)).toBe(layout.startX);
  });

  it('last tile centre = viewport - margin - tileW/2 (within rounding)', () => {
    const viewportW = 800;
    const layout = sporranTileRowLayout(viewportW);
    const lastIdx = SPORRAN_TILE_COUNT - 1;
    const lastCx = sporranTileXForIndex(layout.startX, lastIdx, layout.tileW);
    expect(lastCx).toBeCloseTo(viewportW - SPORRAN_TILE_GRID_MARGIN - layout.tileW / 2, 1);
  });

  it('clamps tilesInRow ≥ 1 (defensive against zero / negative counts)', () => {
    expect(sporranTileRowLayout(800, 0).tilesInRow).toBe(1);
    expect(sporranTileRowLayout(800, -3).tilesInRow).toBe(1);
  });

  it('honours an explicit count (Phase 2 hand-size growth)', () => {
    const layout = sporranTileRowLayout(800, 5);
    expect(layout.tilesInRow).toBe(5);
    // 5 tiles needs less width per tile than 7 — sanity, not exact match.
    expect(layout.tileW).toBeGreaterThan(sporranTileRowLayout(800, 9).tileW);
  });

  it('tile width never goes negative even at tiny viewports', () => {
    expect(sporranTileRowLayout(0).tileW).toBe(0);
    expect(sporranTileRowLayout(40).tileW).toBe(0);
  });

  it('SPORRAN_TILE_GUTTER is tighter than the curse-row gutter (UI calibration)', () => {
    // Sister to curseTileLayout's GUTTER=10. Sporran fits 7 tiles where
    // Curse fits 5, so the gutter has to give some pixels back.
    expect(SPORRAN_TILE_GUTTER).toBeLessThan(10);
  });
});

describe('sporranKindAccent', () => {
  it('returns a distinct hex colour per kind', () => {
    expect(sporranKindAccent('curse')).toBe(SPORRAN_KIND_ACCENT.curse);
    expect(sporranKindAccent('boon')).toBe(SPORRAN_KIND_ACCENT.boon);
    expect(sporranKindAccent('quirk')).toBe(SPORRAN_KIND_ACCENT.quirk);
    const colours = new Set([
      SPORRAN_KIND_ACCENT.curse,
      SPORRAN_KIND_ACCENT.boon,
      SPORRAN_KIND_ACCENT.quirk,
    ]);
    expect(colours.size).toBe(3);
  });

  it('curse accent matches CurseScene purple (visual continuity)', () => {
    // CurseScene tiles use 0xb35287 — sporran curse cards must read
    // identically so a player picking via the deck recognises the same
    // colour-language ("this one's a curse").
    expect(SPORRAN_KIND_ACCENT.curse).toBe(0xb35287);
  });
});
