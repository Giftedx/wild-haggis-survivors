import { describe, expect, it } from 'vitest';
import {
  enumerateVariantAtlasKeys,
  enumerateNonVariantAccessoryKeys,
  selectKeysNeedingBake,
} from './variantAtlasKeys';

// ---------------------------------------------------------------------------
// selectKeysNeedingBake — filter predicate
// ---------------------------------------------------------------------------

describe('selectKeysNeedingBake', () => {
  it('returns all keys when none exist', () => {
    const keys = ['a', 'b', 'c'];
    expect(selectKeysNeedingBake(keys, () => false)).toEqual(keys);
  });

  it('returns empty when all keys exist', () => {
    const keys = ['a', 'b', 'c'];
    expect(selectKeysNeedingBake(keys, () => true)).toEqual([]);
  });

  it('returns only the missing subset', () => {
    const keys = ['a', 'b', 'c', 'd'];
    const existing = new Set(['b', 'd']);
    const result = selectKeysNeedingBake(keys, (k) => existing.has(k));
    expect(result).toEqual(['a', 'c']);
  });

  it('returns empty for empty input', () => {
    expect(selectKeysNeedingBake([], () => false)).toEqual([]);
  });

  it('preserves order of keys', () => {
    const keys = ['z', 'a', 'm', 'b'];
    const result = selectKeysNeedingBake(keys, () => false);
    expect(result).toEqual(keys);
  });
});

// ---------------------------------------------------------------------------
// enumerateVariantAtlasKeys — structural integrity
// ---------------------------------------------------------------------------

describe('enumerateVariantAtlasKeys', () => {
  it('returns haggis, accessories, mantle arrays for a known variant', () => {
    const result = enumerateVariantAtlasKeys('classic');
    expect(Array.isArray(result.haggis)).toBe(true);
    expect(Array.isArray(result.accessories)).toBe(true);
    expect(Array.isArray(result.mantle)).toBe(true);
  });

  it('haggis keys are non-empty for classic variant', () => {
    const { haggis } = enumerateVariantAtlasKeys('classic');
    expect(haggis.length).toBeGreaterThan(0);
  });

  it('mantle has exactly 2 keys (tier 1 and tier 2)', () => {
    const { mantle } = enumerateVariantAtlasKeys('classic');
    expect(mantle).toHaveLength(2);
  });

  it('mantle keys follow the pattern mantle_<variant>_<tier>', () => {
    const { mantle } = enumerateVariantAtlasKeys('classic');
    expect(mantle[0]).toBe('mantle_classic_1');
    expect(mantle[1]).toBe('mantle_classic_2');
  });

  it('mantle keys differ between variants', () => {
    const a = enumerateVariantAtlasKeys('classic');
    const b = enumerateVariantAtlasKeys('moor_runner');
    expect(a.mantle[0]).not.toBe(b.mantle[0]);
  });

  it('no duplicate keys within the haggis array', () => {
    const { haggis } = enumerateVariantAtlasKeys('classic');
    expect(haggis).toHaveLength(new Set(haggis).size);
  });

  it('no duplicate keys within the accessories array', () => {
    const { accessories } = enumerateVariantAtlasKeys('classic');
    expect(accessories).toHaveLength(new Set(accessories).size);
  });

  it('produces different haggis keys for different variants', () => {
    const a = enumerateVariantAtlasKeys('classic');
    const b = enumerateVariantAtlasKeys('cailleach');
    const aSet = new Set(a.haggis);
    const overlap = b.haggis.filter((k) => aSet.has(k));
    expect(overlap).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// enumerateNonVariantAccessoryKeys — structural integrity
// ---------------------------------------------------------------------------

describe('enumerateNonVariantAccessoryKeys', () => {
  it('returns a non-empty array', () => {
    const keys = enumerateNonVariantAccessoryKeys();
    expect(keys.length).toBeGreaterThan(0);
  });

  it('has no duplicates', () => {
    const keys = enumerateNonVariantAccessoryKeys();
    expect(keys).toHaveLength(new Set(keys).size);
  });

  it('is idempotent — two calls return equal arrays', () => {
    const a = enumerateNonVariantAccessoryKeys();
    const b = enumerateNonVariantAccessoryKeys();
    expect(a).toEqual(b);
  });

  it('does not include variant-scoped keys (keys contain no variant names)', () => {
    const keys = enumerateNonVariantAccessoryKeys();
    expect(keys.some((k) => k.includes('classic') || k.includes('cailleach'))).toBe(false);
  });
});
