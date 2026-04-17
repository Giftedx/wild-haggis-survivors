import { describe, it, expect } from 'vitest';
import { resolvePassiveAbbrev } from './hudPassiveAbbrev';

describe('resolvePassiveAbbrev', () => {
  it('returns the authored abbrev for a passive with an i18n entry', () => {
    // ui.passive.hud_abbrev.sporran = 'SPR' in locale en.
    expect(resolvePassiveAbbrev('sporran')).toBe('SPR');
    expect(resolvePassiveAbbrev('whisky_flask')).toBe('WFL');
    expect(resolvePassiveAbbrev('kilt')).toBe('KLT');
  });

  it('uses hand-picked disambiguating abbrevs for the three rare passives', () => {
    // Fallback substring would collide; explicit entries pin unique pills.
    expect(resolvePassiveAbbrev('thistle_crown')).toBe('CRN');
    expect(resolvePassiveAbbrev('highland_shield')).toBe('SHD');
    expect(resolvePassiveAbbrev('tartan_sash')).toBe('SAS');
  });

  it('falls back to the first three characters uppercased for unknown keys', () => {
    expect(resolvePassiveAbbrev('not_a_real_passive')).toBe('NOT');
  });

  it('uppercases and truncates — a single-word short key still renders', () => {
    expect(resolvePassiveAbbrev('foo')).toBe('FOO');
    expect(resolvePassiveAbbrev('longer_name')).toBe('LON');
  });

  it('handles keys shorter than 3 chars by returning the full key uppercased', () => {
    expect(resolvePassiveAbbrev('ab')).toBe('AB');
    expect(resolvePassiveAbbrev('a')).toBe('A');
  });

  it('empty key produces empty string (defensive — scene never passes empty)', () => {
    expect(resolvePassiveAbbrev('')).toBe('');
  });
});
