import { describe, expect, it } from 'vitest';
import { WILDLIFE_DEFS, WILDLIFE_KEYS } from './wildlife';

describe('WILDLIFE_DEFS', () => {
  it('covers all three creature keys', () => {
    expect(WILDLIFE_KEYS).toEqual(['hare', 'red_deer', 'buzzard']);
    expect(Object.keys(WILDLIFE_DEFS).sort()).toEqual(['buzzard', 'hare', 'red_deer']);
  });

  it('every creature has positive scale and speeds', () => {
    for (const def of Object.values(WILDLIFE_DEFS)) {
      expect(def.scale).toBeGreaterThan(0);
      expect(def.baseSpeed).toBeGreaterThan(0);
      expect(def.fleeSpeed).toBeGreaterThanOrEqual(def.baseSpeed);
    }
  });

  it('every creature has positive total biome weight', () => {
    for (const def of Object.values(WILDLIFE_DEFS)) {
      const total = Object.values(def.biomeWeights).reduce((a, b) => a + b, 0);
      expect(total).toBeGreaterThan(0);
    }
  });

  it('aerial buzzard has zero enemy flee radius', () => {
    expect(WILDLIFE_DEFS.buzzard.aerial).toBe(true);
    expect(WILDLIFE_DEFS.buzzard.enemyFleeRadius).toBe(0);
  });

  it('terrestrial creatures are not aerial', () => {
    expect(WILDLIFE_DEFS.hare.aerial).toBe(false);
    expect(WILDLIFE_DEFS.red_deer.aerial).toBe(false);
  });

  it('flee radii are positive for terrestrial creatures', () => {
    expect(WILDLIFE_DEFS.hare.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.red_deer.fleeRadius).toBeGreaterThan(0);
  });
});
