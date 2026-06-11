import { describe, it, expect } from 'vitest';
import { buildLivingWorldRunContext } from './buildLivingWorldRunContext';

describe('buildLivingWorldRunContext', () => {
  it('builds a complete snapshot from thunks', () => {
    const ctx = buildLivingWorldRunContext({
      getRunSeed: () => 42,
      getVariantKey: () => 'classic',
      getCurseKey: () => 'heavy_legs',
      getSeasonalEventKey: () => 'samhain',
      getBiomeId: () => 'loch',
      getHpFraction: () => 0.5,
      getGameTimeSec: () => 12.34,
      getReduceParticles: () => true,
      getReduceFlashing: () => false,
    });
    expect(ctx).toEqual({
      runSeed: 42,
      variantKey: 'classic',
      curseKey: 'heavy_legs',
      seasonalEventKey: 'samhain',
      biomeId: 'loch',
      hpFraction: 0.5,
      gameTimeSec: 12.34,
      reduceParticles: true,
      reduceFlashing: false,
    });
  });

  it('falls back to a heather biome when none is available', () => {
    const ctx = buildLivingWorldRunContext({
      getRunSeed: () => 1,
      getVariantKey: () => 'classic',
      getCurseKey: () => null,
      getSeasonalEventKey: () => null,
      getBiomeId: () => null,
      getHpFraction: () => 1,
      getGameTimeSec: () => 0,
      getReduceParticles: () => false,
      getReduceFlashing: () => false,
    });
    expect(ctx.biomeId).toBe('heather');
  });

  it('clamps invalid hp fractions and negative times', () => {
    const ctx = buildLivingWorldRunContext({
      getRunSeed: () => 1,
      getVariantKey: () => 'classic',
      getCurseKey: () => null,
      getSeasonalEventKey: () => null,
      getBiomeId: () => 'bog',
      getHpFraction: () => Number.NaN,
      getGameTimeSec: () => -5,
      getReduceParticles: () => false,
      getReduceFlashing: () => false,
    });
    expect(ctx.hpFraction).toBe(0);
    expect(ctx.gameTimeSec).toBe(0);
  });

  it('coerces accessibility flags to strict booleans', () => {
    const ctx = buildLivingWorldRunContext({
      getRunSeed: () => 1,
      getVariantKey: () => 'classic',
      getCurseKey: () => null,
      getSeasonalEventKey: () => null,
      getBiomeId: () => 'bog',
      getHpFraction: () => 1,
      getGameTimeSec: () => 0,
      // Simulate a sloppy caller that returns truthy/falsy non-booleans.
      getReduceParticles: () => (1 as unknown as boolean),
      getReduceFlashing: () => (0 as unknown as boolean),
    });
    expect(ctx.reduceParticles).toBe(true);
    expect(ctx.reduceFlashing).toBe(false);
  });
});
