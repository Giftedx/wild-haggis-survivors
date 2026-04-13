import { describe, expect, it } from 'vitest';
import {
  collectRequiredTextureRequirements,
  findMissingTextureKeys,
  MISSING_PLACEHOLDER_KEY,
} from './AssetValidator';

describe('AssetValidator', () => {
  it('collects non-empty requirements including core gameplay keys', () => {
    const reqs = collectRequiredTextureRequirements();
    const keys = new Set(reqs.map((r) => r.key));
    expect(keys.has('tourist')).toBe(true);
    expect(keys.has('boss_taxman')).toBe(true);
    expect(keys.has('thistle')).toBe(true);
    expect(keys.has('xp_gem')).toBe(true);
    expect(keys.has('wicon_thistle_shot')).toBe(true);
    expect(keys.has('hud_shield')).toBe(true);
    expect(keys.has('hud_dash_pip_full')).toBe(true);
    expect(keys.has(MISSING_PLACEHOLDER_KEY)).toBe(false);
  });

  it('detects missing textures via texture manager predicate', () => {
    const exists = (k: string) => k !== 'tourist' && k !== 'wicon_bagpipe_blast';
    const missing = findMissingTextureKeys(exists);
    const missingKeys = missing.map((m) => m.key);
    expect(missingKeys).toContain('tourist');
    expect(missingKeys).toContain('wicon_bagpipe_blast');
    expect(missing.every((m) => m.category.length > 0)).toBe(true);
  });

  it('reports no missing when predicate accepts all required keys', () => {
    const reqs = collectRequiredTextureRequirements();
    expect(findMissingTextureKeys(() => true, reqs)).toEqual([]);
  });
});
