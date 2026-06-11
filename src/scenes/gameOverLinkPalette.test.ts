import { describe, it, expect } from 'vitest';
import {
  resolveCopyActionLinkPalette,
  resolveRerunLinkPalette,
  COPY_ACTION_SUCCESS_COLOR,
  COPY_ACTION_HOVER_COLOR,
} from './gameOverLinkPalette';

describe('resolveCopyActionLinkPalette — seed + postcard link', () => {
  it('non-daily idle reads quiet slate', () => {
    const p = resolveCopyActionLinkPalette(false);
    expect(p.idle).toBe('#a8b0c0');
  });

  it('daily-moor idle swaps to warm amber (so Daily runs read differently)', () => {
    const p = resolveCopyActionLinkPalette(true);
    expect(p.idle).toBe('#e2c97a');
  });

  it('hover + success are shared across isDaily (single copy-action identity)', () => {
    const a = resolveCopyActionLinkPalette(false);
    const b = resolveCopyActionLinkPalette(true);
    expect(a.hover).toBe(COPY_ACTION_HOVER_COLOR);
    expect(b.hover).toBe(COPY_ACTION_HOVER_COLOR);
    expect(a.success).toBe(COPY_ACTION_SUCCESS_COLOR);
    expect(b.success).toBe(COPY_ACTION_SUCCESS_COLOR);
  });

  it('hover ≠ idle ≠ success for both branches (three visible states)', () => {
    for (const isDaily of [false, true]) {
      const p = resolveCopyActionLinkPalette(isDaily);
      const s = new Set([p.idle, p.hover, p.success]);
      expect(s.size).toBe(3);
    }
  });
});

describe('resolveRerunLinkPalette — "↻ same seed" link', () => {
  it('returns a moss-green pair that sits apart from the copy-action palette', () => {
    const rerun = resolveRerunLinkPalette();
    const copy = resolveCopyActionLinkPalette(false);
    expect(rerun.idle).toBe('#b8d0a8');
    expect(rerun.hover).toBe('#e8fbd0');
    expect(rerun.idle).not.toBe(copy.idle);
    expect(rerun.hover).not.toBe(copy.hover);
  });

  it('hover is brighter than idle (same hue family)', () => {
    const p = resolveRerunLinkPalette();
    expect(p.idle).not.toBe(p.hover);
  });
});
