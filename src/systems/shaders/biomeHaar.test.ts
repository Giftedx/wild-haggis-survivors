import { describe, expect, it } from 'vitest';

import { BIOMES } from '../../data/biomes';
import { biomeHaarTarget } from './biomeHaar';

describe('biomeHaarTarget', () => {
  it('returns the biome ambient density at neutral a11y settings', () => {
    expect(
      biomeHaarTarget({ motionScale: 1, reduceParticles: false }, 'loch'),
    ).toBeCloseTo(BIOMES.loch.ambientHaarDensity, 5);
    expect(
      biomeHaarTarget({ motionScale: 1, reduceParticles: false }, 'pine'),
    ).toBe(0);
  });

  it('caps via motionScale (0 caps density at 0.4 globally — loch ambient 0.2 sits under the cap anyway)', () => {
    // Loch ambient (0.2) is already below the 0.4 cap, so motionScale 0
    // passes it through unchanged.
    expect(
      biomeHaarTarget({ motionScale: 0, reduceParticles: false }, 'loch'),
    ).toBe(0.2);
  });

  it('dry biomes always return 0 regardless of a11y settings', () => {
    for (const m of [0, 0.25, 0.5, 0.75, 1]) {
      expect(
        biomeHaarTarget({ motionScale: m, reduceParticles: false }, 'pine'),
      ).toBe(0);
      expect(
        biomeHaarTarget({ motionScale: m, reduceParticles: true }, 'heather'),
      ).toBe(0);
    }
  });

  it('reduceParticles hard-caps but loch 0.2 still passes (0.2 < 0.5)', () => {
    expect(
      biomeHaarTarget({ motionScale: 1, reduceParticles: true }, 'loch'),
    ).toBe(0.2);
    expect(
      biomeHaarTarget({ motionScale: 1, reduceParticles: true }, 'bog'),
    ).toBe(0.1);
  });

  it('is monotonic across biomes — loch >= bog >= pine', () => {
    const s = { motionScale: 1, reduceParticles: false };
    expect(biomeHaarTarget(s, 'loch')).toBeGreaterThanOrEqual(biomeHaarTarget(s, 'bog'));
    expect(biomeHaarTarget(s, 'bog')).toBeGreaterThanOrEqual(biomeHaarTarget(s, 'pine'));
  });
});
