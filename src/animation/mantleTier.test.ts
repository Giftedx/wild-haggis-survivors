import { describe, expect, it } from 'vitest';
import { computeMantleTier, MANTLE_TIERS } from './mantleTier';

describe('computeMantleTier', () => {
  it('returns tier 0 below the tier-1 threshold', () => {
    expect(computeMantleTier(0)).toBe(0);
    expect(computeMantleTier(MANTLE_TIERS.tier1KillThreshold - 1)).toBe(0);
  });

  it('returns tier 1 at the tier-1 threshold and up to just below tier 2', () => {
    expect(computeMantleTier(MANTLE_TIERS.tier1KillThreshold)).toBe(1);
    expect(computeMantleTier(MANTLE_TIERS.tier2KillThreshold - 1)).toBe(1);
  });

  it('returns tier 2 at and above the tier-2 threshold', () => {
    expect(computeMantleTier(MANTLE_TIERS.tier2KillThreshold)).toBe(2);
    expect(computeMantleTier(10_000)).toBe(2);
  });

  it('is monotonic in kills across a 300-kill sample', () => {
    let prev = 0;
    for (let k = 0; k <= 300; k++) {
      const tier = computeMantleTier(k);
      expect(tier).toBeGreaterThanOrEqual(prev);
      prev = tier;
    }
  });

  it('rejects negative kill counts by treating them as 0', () => {
    expect(computeMantleTier(-5)).toBe(0);
  });
});
