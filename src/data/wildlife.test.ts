import { describe, expect, it } from 'vitest';
import { WILDLIFE_DEFS, WILDLIFE_KEYS } from './wildlife';

describe('WILDLIFE_DEFS', () => {
  it('covers all Scottish wildlife creature keys', () => {
    expect(WILDLIFE_KEYS).toEqual([
      'hare',
      'red_deer',
      'buzzard',
      'red_squirrel',
      'pine_marten',
      'capercaillie',
      'otter',
      'puffin',
      'golden_eagle',
      'scottish_wildcat',
      'rook',
      'sheep',
      'grey_seal',
      'ptarmigan',
      'common_frog',
      'pipistrelle_bat',
      'field_mouse',
      'salmon',
    ]);
    expect(Object.keys(WILDLIFE_DEFS).sort()).toEqual([
      'buzzard',
      'capercaillie',
      'common_frog',
      'field_mouse',
      'golden_eagle',
      'grey_seal',
      'hare',
      'otter',
      'pine_marten',
      'pipistrelle_bat',
      'ptarmigan',
      'puffin',
      'red_deer',
      'red_squirrel',
      'rook',
      'salmon',
      'scottish_wildcat',
      'sheep',
    ]);
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

  it.each(['puffin', 'golden_eagle', 'rook', 'pipistrelle_bat'] as const)(
    '%s is aerial and has zero enemy flee radius',
    (key) => {
      expect(WILDLIFE_DEFS[key].aerial).toBe(true);
      expect(WILDLIFE_DEFS[key].enemyFleeRadius).toBe(0);
    }
  );

  it('terrestrial creatures are not aerial', () => {
    expect(WILDLIFE_DEFS.hare.aerial).toBe(false);
    expect(WILDLIFE_DEFS.red_deer.aerial).toBe(false);
    expect(WILDLIFE_DEFS.red_squirrel.aerial).toBe(false);
    expect(WILDLIFE_DEFS.pine_marten.aerial).toBe(false);
    expect(WILDLIFE_DEFS.capercaillie.aerial).toBe(false);
    expect(WILDLIFE_DEFS.otter.aerial).toBe(false);
    expect(WILDLIFE_DEFS.scottish_wildcat.aerial).toBe(false);
    expect(WILDLIFE_DEFS.sheep.aerial).toBe(false);
    expect(WILDLIFE_DEFS.grey_seal.aerial).toBe(false);
    expect(WILDLIFE_DEFS.ptarmigan.aerial).toBe(false);
    expect(WILDLIFE_DEFS.common_frog.aerial).toBe(false);
    expect(WILDLIFE_DEFS.field_mouse.aerial).toBe(false);
    expect(WILDLIFE_DEFS.salmon.aerial).toBe(false);
  });

  it('flee radii are positive for terrestrial creatures', () => {
    expect(WILDLIFE_DEFS.hare.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.red_deer.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.red_squirrel.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.pine_marten.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.capercaillie.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.otter.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.scottish_wildcat.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.sheep.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.grey_seal.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.ptarmigan.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.common_frog.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.field_mouse.fleeRadius).toBeGreaterThan(0);
    expect(WILDLIFE_DEFS.salmon.fleeRadius).toBeGreaterThan(0);
  });

  it.each(['red_squirrel', 'pine_marten', 'capercaillie'] as const)(
    '%s prefers pine over bog',
    (key) => {
      expect(WILDLIFE_DEFS[key].biomeWeights.pine)
        .toBeGreaterThan(WILDLIFE_DEFS[key].biomeWeights.bog);
    }
  );

  it.each(['otter', 'puffin'] as const)('%s prefers loch over pine', (key) => {
    expect(WILDLIFE_DEFS[key].biomeWeights.loch)
      .toBeGreaterThan(WILDLIFE_DEFS[key].biomeWeights.pine);
  });

  it('upland eagle and wildcat prefer open highland biomes', () => {
    expect(WILDLIFE_DEFS.golden_eagle.biomeWeights.heather)
      .toBeGreaterThan(WILDLIFE_DEFS.golden_eagle.biomeWeights.loch);
    expect(WILDLIFE_DEFS.scottish_wildcat.biomeWeights.heather)
      .toBeGreaterThan(WILDLIFE_DEFS.scottish_wildcat.biomeWeights.bog);
  });

  it.each(['grey_seal', 'salmon'] as const)('%s prefers loch over heather', (key) => {
    expect(WILDLIFE_DEFS[key].biomeWeights.loch)
      .toBeGreaterThan(WILDLIFE_DEFS[key].biomeWeights.heather);
  });

  it('common frog prefers bog over pine', () => {
    expect(WILDLIFE_DEFS.common_frog.biomeWeights.bog)
      .toBeGreaterThan(WILDLIFE_DEFS.common_frog.biomeWeights.pine);
  });

  it('small field creatures prefer open moor or pine cover', () => {
    expect(WILDLIFE_DEFS.sheep.biomeWeights.heather)
      .toBeGreaterThan(WILDLIFE_DEFS.sheep.biomeWeights.pine);
    expect(WILDLIFE_DEFS.field_mouse.biomeWeights.heather)
      .toBeGreaterThan(WILDLIFE_DEFS.field_mouse.biomeWeights.bog);
    expect(WILDLIFE_DEFS.ptarmigan.biomeWeights.heather)
      .toBeGreaterThan(WILDLIFE_DEFS.ptarmigan.biomeWeights.loch);
  });
});
