import { describe, it, expect } from 'vitest';
import {
  resolveMinimapPalette,
  resolveMinimapEdgeWarn,
  MINIMAP_WARN_BOUNDARY_MARGIN,
  MINIMAP_WARN_MIN_ALPHA,
  MINIMAP_WARN_MAX_ALPHA,
} from './minimapPalette';

describe('resolveMinimapPalette — 2-state bg/border', () => {
  it('default mode has lower bg alpha + warmer dim border', () => {
    const p = resolveMinimapPalette(false);
    expect(p.bgAlpha).toBe(0.55);
    expect(p.borderColor).toBe(0x6a7390);
  });

  it('high-contrast bumps bg alpha up and shifts border to a punchier blue', () => {
    const p = resolveMinimapPalette(true);
    expect(p.bgAlpha).toBe(0.7);
    expect(p.borderColor).toBe(0x8fb4ff);
  });

  it('HC always has higher bgAlpha than default (invariant)', () => {
    expect(resolveMinimapPalette(true).bgAlpha).toBeGreaterThan(resolveMinimapPalette(false).bgAlpha);
  });
});

const W = 3000;
const H = 3000;

describe('resolveMinimapEdgeWarn', () => {
  it('player deep in the middle is not active', () => {
    const r = resolveMinimapEdgeWarn(W / 2, H / 2, W, H);
    expect(r.active).toBe(false);
    expect(r.alpha).toBe(0);
  });

  it('player exactly at the boundary margin is not active yet (just on the edge of the band)', () => {
    const r = resolveMinimapEdgeWarn(MINIMAP_WARN_BOUNDARY_MARGIN, H / 2, W, H);
    expect(r.active).toBe(false);
  });

  it('just inside the boundary margin activates at the min alpha', () => {
    const r = resolveMinimapEdgeWarn(MINIMAP_WARN_BOUNDARY_MARGIN - 1, H / 2, W, H);
    expect(r.active).toBe(true);
    expect(r.alpha).toBeGreaterThanOrEqual(MINIMAP_WARN_MIN_ALPHA);
  });

  it('right at the edge (distToEdge = 0) hits the max alpha', () => {
    const r = resolveMinimapEdgeWarn(0, H / 2, W, H);
    expect(r.alpha).toBeCloseTo(MINIMAP_WARN_MAX_ALPHA, 5);
  });

  it('any wall triggers the warn (min over all four axes)', () => {
    expect(resolveMinimapEdgeWarn(50, H / 2, W, H).active).toBe(true);
    expect(resolveMinimapEdgeWarn(W - 50, H / 2, W, H).active).toBe(true);
    expect(resolveMinimapEdgeWarn(W / 2, 50, W, H).active).toBe(true);
    expect(resolveMinimapEdgeWarn(W / 2, H - 50, W, H).active).toBe(true);
  });

  it('alpha is monotonically non-decreasing as the player approaches the edge', () => {
    let prev = -1;
    for (let d = MINIMAP_WARN_BOUNDARY_MARGIN; d >= 0; d -= 5) {
      const r = resolveMinimapEdgeWarn(d, H / 2, W, H);
      if (r.active) {
        expect(r.alpha).toBeGreaterThanOrEqual(prev);
        prev = r.alpha;
      }
    }
  });
});
