import { describe, it, expect } from 'vitest';
import {
  resolveWeaponIconKey,
  HUD_WEAPON_ICON_FALLBACK,
} from './hudWeaponIcon';

/** Test helper: whitelist a set of texture keys as "existing". */
function texturesExist(...keys: string[]): (k: string) => boolean {
  const set = new Set(keys);
  return (k) => set.has(k);
}

describe('resolveWeaponIconKey', () => {
  it('returns the evolved icon when evolved + evolutionKey + texture all present', () => {
    const out = resolveWeaponIconKey(
      { key: 'thistle_shot', evolved: true, evolutionKey: 'thistle_storm' },
      texturesExist('wicon_thistle_shot', 'wicon_thistle_storm'),
    );
    expect(out).toBe('wicon_thistle_storm');
  });

  it('falls back to the base icon when evolved but evolution texture is missing', () => {
    const out = resolveWeaponIconKey(
      { key: 'thistle_shot', evolved: true, evolutionKey: 'thistle_storm' },
      texturesExist('wicon_thistle_shot'), // evolution missing
    );
    expect(out).toBe('wicon_thistle_shot');
  });

  it('falls back to the base icon when evolved = true but evolutionKey is missing', () => {
    const out = resolveWeaponIconKey(
      { key: 'caber_toss', evolved: true },
      texturesExist('wicon_caber_toss'),
    );
    expect(out).toBe('wicon_caber_toss');
  });

  it('uses the base icon when the weapon is not evolved', () => {
    const out = resolveWeaponIconKey(
      { key: 'thistle_shot', evolved: false, evolutionKey: 'thistle_storm' },
      texturesExist('wicon_thistle_shot', 'wicon_thistle_storm'),
    );
    // evolved = false → we never look at the evolution texture.
    expect(out).toBe('wicon_thistle_shot');
  });

  it('falls through to the thistle_shot fallback when neither evo nor base exist', () => {
    const out = resolveWeaponIconKey(
      { key: 'never_rendered', evolved: true, evolutionKey: 'also_missing' },
      texturesExist('wicon_thistle_shot'),
    );
    expect(out).toBe(HUD_WEAPON_ICON_FALLBACK);
  });

  it('returns the fallback constant even when the fallback texture is missing', () => {
    // Real renderer always has wicon_thistle_shot from BootScene — but the
    // helper's contract is to return the key, not to verify its existence.
    const out = resolveWeaponIconKey(
      { key: 'never_rendered' },
      texturesExist(), // nothing exists
    );
    expect(out).toBe(HUD_WEAPON_ICON_FALLBACK);
  });

  it('handles missing evolved field as "not evolved"', () => {
    const out = resolveWeaponIconKey(
      { key: 'caber_toss' },
      texturesExist('wicon_caber_toss'),
    );
    expect(out).toBe('wicon_caber_toss');
  });
});
