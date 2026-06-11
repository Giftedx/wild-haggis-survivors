import { describe, expect, it } from 'vitest';
import {
  atlasKey,
  allAtlasKeysForVariant,
} from './textureAtlas';

describe('atlasKey', () => {
  it('formats as <subject>_<variant>_<state>_<frame>', () => {
    expect(atlasKey('haggis', 'classic', 'walking', 2)).toBe('haggis_classic_walking_2');
  });

  it('accepts accessory subjects without variant when passed null', () => {
    expect(atlasKey('tam_o_shanter', null, 'idle', 0)).toBe('tam_o_shanter_idle_0');
  });

  it('negative or non-integer frame throws', () => {
    expect(() => atlasKey('haggis', 'classic', 'idle', -1)).toThrow();
    expect(() => atlasKey('haggis', 'classic', 'idle', 1.5)).toThrow();
  });
});

describe('allAtlasKeysForVariant', () => {
  it('enumerates every (state, frame) key for a variant — 19 frames total', () => {
    const keys = allAtlasKeysForVariant('haggis', 'classic');
    expect(keys).toContain('haggis_classic_idle_0');
    expect(keys).toContain('haggis_classic_idle_1');
    expect(keys).toContain('haggis_classic_walking_0');
    expect(keys).toContain('haggis_classic_walking_3');
    expect(keys).toContain('haggis_classic_attacking_0');
    expect(keys).toContain('haggis_classic_attacking_3');
    expect(keys).toContain('haggis_classic_hurt_0');
    expect(keys).toContain('haggis_classic_hurt_1');
    expect(keys).toContain('haggis_classic_celebrating_0');
    expect(keys).toContain('haggis_classic_celebrating_3');
    expect(keys).toContain('haggis_classic_dying_0');
    expect(keys).toContain('haggis_classic_dying_2');
    // Total: 2 + 4 + 4 + 2 + 4 + 3 = 19
    expect(keys.length).toBe(19);
  });

  it('returns a different key set per variant', () => {
    const classic = allAtlasKeysForVariant('haggis', 'classic');
    const runner = allAtlasKeysForVariant('haggis', 'moor_runner');
    expect(classic).not.toEqual(runner);
    expect(classic[0]).toMatch(/classic/);
    expect(runner[0]).toMatch(/moor_runner/);
  });
});
