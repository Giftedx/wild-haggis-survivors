import { describe, expect, it } from 'vitest';
import {
  enumerateVariantAtlasKeys,
  enumerateNonVariantAccessoryKeys,
  selectKeysNeedingBake,
} from './variantAtlasKeys';
import { ACCESSORY_REGISTRY } from '../../entities/haggisComposition/accessoryRegistry';

describe('enumerateVariantAtlasKeys', () => {
  it('returns 19 haggis keys for a variant (matches allAtlasKeysForVariant)', () => {
    const { haggis } = enumerateVariantAtlasKeys('classic');
    // 2 idle + 4 walking + 4 attacking + 2 hurt + 4 celebrating + 3 dying = 19
    expect(haggis.length).toBe(19);
    expect(haggis).toContain('haggis_classic_idle_0');
    expect(haggis).toContain('haggis_classic_dying_2');
  });

  it('handles multi-token variant slugs (peerie_shetlander) without confusing the parser', () => {
    const { haggis } = enumerateVariantAtlasKeys('peerie_shetlander');
    expect(haggis).toContain('haggis_peerie_shetlander_idle_0');
    expect(haggis).toContain('haggis_peerie_shetlander_walking_3');
  });

  it('returns variant-aware accessory keys with the variant slug embedded', () => {
    const { accessories } = enumerateVariantAtlasKeys('classic');
    // Today only `kilt` is variantAware. The helper should not hardcode that —
    // it filters off the registry — but we can still assert the shape.
    const variantAwareIds = Object.values(ACCESSORY_REGISTRY)
      .filter((d) => d.variantAware)
      .map((d) => d.id);
    expect(variantAwareIds.length).toBeGreaterThan(0);
    for (const id of variantAwareIds) {
      expect(accessories).toContain(`${id}_classic_idle_0`);
    }
    expect(accessories).not.toContain('kilt_idle_0'); // no variant slug = non-variant form
  });

  it('returns exactly two mantle keys (tier 1 + tier 2; tier 0 is intentionally unbaked)', () => {
    const { mantle } = enumerateVariantAtlasKeys('classic');
    expect(mantle).toEqual(['mantle_classic_1', 'mantle_classic_2']);
  });

  it('different variants return disjoint haggis key sets', () => {
    const classic = enumerateVariantAtlasKeys('classic');
    const runner = enumerateVariantAtlasKeys('moor_runner');
    const overlap = classic.haggis.filter((k) => runner.haggis.includes(k));
    expect(overlap).toEqual([]);
  });
});

describe('enumerateNonVariantAccessoryKeys', () => {
  it('returns no key carrying a variant slug', () => {
    const keys = enumerateNonVariantAccessoryKeys();
    // Non-variant key shape: `<id>_<state>_<frame>` (3 segments minimum).
    // Variant-aware would be 4+ segments because variant keys are non-empty.
    // We assert the absence of any registry id whose drawer is variantAware.
    const variantAwareIds = Object.values(ACCESSORY_REGISTRY)
      .filter((d) => d.variantAware)
      .map((d) => d.id);
    for (const key of keys) {
      for (const id of variantAwareIds) {
        expect(key.startsWith(`${id}_`) && key.split('_').length > 3).toBe(false);
      }
    }
  });

  it('covers every non-variant-aware accessory id in the registry', () => {
    const keys = enumerateNonVariantAccessoryKeys();
    const nonVariantIds = Object.values(ACCESSORY_REGISTRY)
      .filter((d) => !d.variantAware)
      .map((d) => d.id);
    expect(nonVariantIds.length).toBeGreaterThan(0);
    for (const id of nonVariantIds) {
      expect(keys.some((k) => k.startsWith(`${id}_`))).toBe(true);
    }
  });
});

describe('selectKeysNeedingBake', () => {
  it('returns every key when the cache is cold', () => {
    const candidates = ['a', 'b', 'c'];
    const needed = selectKeysNeedingBake(candidates, () => false);
    expect(needed).toEqual(['a', 'b', 'c']);
  });

  it('returns nothing when every candidate is already cached', () => {
    const candidates = ['a', 'b', 'c'];
    const needed = selectKeysNeedingBake(candidates, () => true);
    expect(needed).toEqual([]);
  });

  it('returns only the cold subset when the cache is partially warm', () => {
    const cache = new Set(['a', 'c']);
    const needed = selectKeysNeedingBake(['a', 'b', 'c', 'd'], (k) => cache.has(k));
    expect(needed).toEqual(['b', 'd']);
  });
});

describe('cold-vs-warm bake counts', () => {
  // The imperative bake routines (bakeHaggisAtlasForVariant et al.) all
  // delegate to selectKeysNeedingBake. We verify the integration shape
  // here by simulating the predicate: first pass = full set, second pass
  // (cache now contains everything from pass 1) = empty.
  it('a second bake pass returns nothing once the first pass has populated the cache', () => {
    const { haggis, accessories, mantle } = enumerateVariantAtlasKeys('moor_runner');
    const allCandidates = [...haggis, ...accessories, ...mantle];
    const cache = new Set<string>();

    const firstPass = selectKeysNeedingBake(allCandidates, (k) => cache.has(k));
    expect(firstPass.length).toBe(allCandidates.length);

    for (const k of firstPass) cache.add(k);
    const secondPass = selectKeysNeedingBake(allCandidates, (k) => cache.has(k));
    expect(secondPass).toEqual([]);
  });
});
