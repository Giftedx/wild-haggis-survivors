import { describe, it, expect } from 'vitest';
import { playerGrowthScale } from './playerGrowthScale';
import { PLAYER } from '../config';

describe('playerGrowthScale', () => {
  it('level 1 returns exactly 1.0 (no growth applied to fresh spawn)', () => {
    expect(playerGrowthScale(1)).toBe(1);
  });

  it('each level adds PLAYER.GROWTH_PER_LEVEL until the cap', () => {
    expect(playerGrowthScale(2)).toBeCloseTo(1 + PLAYER.GROWTH_PER_LEVEL, 10);
    expect(playerGrowthScale(5)).toBeCloseTo(1 + 4 * PLAYER.GROWTH_PER_LEVEL, 10);
  });

  it('clamps at PLAYER.MAX_SCALE for very high levels', () => {
    expect(playerGrowthScale(1000)).toBe(PLAYER.MAX_SCALE);
  });

  it('is monotonically non-decreasing across levels', () => {
    let prev = -Infinity;
    for (let level = 1; level < 200; level++) {
      const s = playerGrowthScale(level);
      expect(s).toBeGreaterThanOrEqual(prev);
      prev = s;
    }
  });

  it('returns <= PLAYER.MAX_SCALE for every sampled level', () => {
    for (let level = 1; level < 500; level++) {
      expect(playerGrowthScale(level)).toBeLessThanOrEqual(PLAYER.MAX_SCALE);
    }
  });
});
