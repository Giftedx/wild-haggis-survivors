import { describe, expect, it } from 'vitest';

import { BIOMES } from '../../data/biomes';
import { biomeHaarTarget } from './biomeHaar';
import type { HaarA11ySettings } from './haarA11y';

const NEUTRAL: HaarA11ySettings = {
  motionScale: 1,
  reduceParticles: false,
  reduceFlashing: false,
};

describe('biomeHaarTarget', () => {
  it('returns the biome ambient density at neutral a11y settings', () => {
    expect(biomeHaarTarget(NEUTRAL, 'loch')).toBeCloseTo(BIOMES.loch.ambientHaarDensity, 5);
    expect(biomeHaarTarget(NEUTRAL, 'pine')).toBe(0);
  });

  it('caps via motionScale (0 caps density at 0.4 globally — loch ambient 0.2 sits under the cap anyway)', () => {
    // Loch ambient (0.2) is already below the 0.4 cap, so motionScale 0
    // passes it through unchanged.
    expect(biomeHaarTarget({ ...NEUTRAL, motionScale: 0 }, 'loch')).toBe(0.2);
  });

  it('dry biomes always return 0 regardless of a11y settings', () => {
    for (const m of [0, 0.25, 0.5, 0.75, 1]) {
      expect(biomeHaarTarget({ ...NEUTRAL, motionScale: m }, 'pine')).toBe(0);
      expect(
        biomeHaarTarget({ ...NEUTRAL, motionScale: m, reduceParticles: true }, 'heather'),
      ).toBe(0);
    }
  });

  it('reduceParticles hard-caps but loch 0.2 still passes (0.2 < 0.5)', () => {
    expect(biomeHaarTarget({ ...NEUTRAL, reduceParticles: true }, 'loch')).toBe(0.2);
    expect(biomeHaarTarget({ ...NEUTRAL, reduceParticles: true }, 'bog')).toBe(0.1);
  });

  it('reduceFlashing hard-caps but ambient densities still sit under the cap', () => {
    // Loch (0.2) + bog (0.1) are both below the reduceFlashing 0.4 cap, so
    // they pass unchanged. The guard is still useful for the direct-apply
    // ActIntermission path where the target is 0.8.
    expect(biomeHaarTarget({ ...NEUTRAL, reduceFlashing: true }, 'loch')).toBe(0.2);
    expect(biomeHaarTarget({ ...NEUTRAL, reduceFlashing: true }, 'bog')).toBe(0.1);
    expect(biomeHaarTarget({ ...NEUTRAL, reduceFlashing: true }, 'pine')).toBe(0);
  });

  it('is monotonic across biomes — loch >= bog >= pine', () => {
    expect(biomeHaarTarget(NEUTRAL, 'loch')).toBeGreaterThanOrEqual(
      biomeHaarTarget(NEUTRAL, 'bog'),
    );
    expect(biomeHaarTarget(NEUTRAL, 'bog')).toBeGreaterThanOrEqual(
      biomeHaarTarget(NEUTRAL, 'pine'),
    );
  });
});
