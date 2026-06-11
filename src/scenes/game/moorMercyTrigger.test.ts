import { describe, expect, it } from 'vitest';
import { crossesMoorMercyHpFrac } from './moorMercyTrigger';

describe('crossesMoorMercyHpFrac', () => {
  const TH = 0.4;

  it('fires when a hit drags the player from above the threshold to below', () => {
    expect(crossesMoorMercyHpFrac(80, 30, 100, TH)).toBe(true);
  });

  it('fires when a hit lands exactly on the threshold (<= boundary)', () => {
    expect(crossesMoorMercyHpFrac(80, 40, 100, TH)).toBe(true);
  });

  it('does not fire when hpBefore was already at or below the threshold (> boundary)', () => {
    expect(crossesMoorMercyHpFrac(40, 30, 100, TH)).toBe(false);
    expect(crossesMoorMercyHpFrac(35, 20, 100, TH)).toBe(false);
  });

  it('does not fire when hp stays above the threshold', () => {
    expect(crossesMoorMercyHpFrac(80, 60, 100, TH)).toBe(false);
  });

  it('does not fire on death (hpAfter <= 0) — game-over flow owns that beat', () => {
    expect(crossesMoorMercyHpFrac(80, 0, 100, TH)).toBe(false);
    expect(crossesMoorMercyHpFrac(80, -5, 100, TH)).toBe(false);
  });

  it('does not fire with degenerate maxHp', () => {
    expect(crossesMoorMercyHpFrac(80, 30, 0, TH)).toBe(false);
    expect(crossesMoorMercyHpFrac(80, 30, -1, TH)).toBe(false);
  });

  it('does not fire on a heal (hpAfter > hpBefore)', () => {
    // A heal can't "cross down" through the threshold — both checks are
    // strictly directional, so a recovery from 30 to 50 stays silent.
    expect(crossesMoorMercyHpFrac(30, 50, 100, TH)).toBe(false);
  });

  it('respects custom thresholds', () => {
    // 25% threshold — only triggers when crossing the quarter-HP line.
    expect(crossesMoorMercyHpFrac(50, 24, 100, 0.25)).toBe(true);
    expect(crossesMoorMercyHpFrac(50, 30, 100, 0.25)).toBe(false);
  });
});
