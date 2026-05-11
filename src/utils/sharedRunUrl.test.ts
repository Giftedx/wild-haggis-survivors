import { describe, expect, it } from 'vitest';

import {
  buildSharedRunUrl,
  parseSharedRunUrl,
  type SharedRunSetup,
} from './sharedRunUrl';

describe('sharedRunUrl', () => {
  describe('buildSharedRunUrl', () => {
    it('encodes seed + variant + curse as query params on the supplied base URL', () => {
      const url = buildSharedRunUrl(
        { seed: 12345, variantKey: 'classic', curseKey: 'heavy_legs' },
        'https://wildhaggis.example.com/',
      );
      // The seed is encoded via the existing 7-char share codec so the
      // recipient doesn't need to know about the integer form.
      expect(url).toMatch(/^https:\/\/wildhaggis\.example\.com\/\?run=[0-9A-Z]{7}&v=classic&c=heavy_legs$/);
    });

    it('omits the curse param entirely for a clean run', () => {
      const url = buildSharedRunUrl(
        { seed: 9000, variantKey: 'moor_runner', curseKey: null },
        'https://wildhaggis.example.com/',
      );
      expect(url).toMatch(/^https:\/\/wildhaggis\.example\.com\/\?run=[0-9A-Z]{7}&v=moor_runner$/);
      expect(url).not.toContain('c=');
    });

    it('preserves an existing path on the base URL', () => {
      const url = buildSharedRunUrl(
        { seed: 1, variantKey: 'classic', curseKey: null },
        'https://wildhaggis.example.com/game/',
      );
      expect(url.startsWith('https://wildhaggis.example.com/game/?run=')).toBe(true);
    });

    it('replaces any existing run-share params instead of duplicating them', () => {
      const url = buildSharedRunUrl(
        { seed: 42, variantKey: 'classic', curseKey: null },
        'https://wildhaggis.example.com/?run=STALE12&v=old&c=heavy_legs&keepme=yes',
      );
      // The three managed params are scrubbed before re-stamping; unrelated
      // params (utm tags, devDps, etc.) are preserved so a sharer's URL
      // shape stays stable.
      expect(url).toContain('keepme=yes');
      expect(url).not.toContain('STALE12');
      expect(url).not.toContain('v=old');
      expect(url).not.toContain('c=heavy_legs');
    });
  });

  describe('parseSharedRunUrl', () => {
    it('round-trips a built URL through parse', () => {
      const setup: SharedRunSetup = {
        seed: 12345 & 0x03ffffff,
        variantKey: 'classic',
        curseKey: 'heavy_legs',
      };
      const url = buildSharedRunUrl(setup, 'https://wildhaggis.example.com/');
      const parsed = parseSharedRunUrl(url);
      expect(parsed).toEqual(setup);
    });

    it('accepts a bare query string', () => {
      const setup: SharedRunSetup = {
        seed: 7777 & 0x03ffffff,
        variantKey: 'moor_runner',
        curseKey: null,
      };
      // Use the codec to get a valid seed code (with checksum).
      const url = buildSharedRunUrl(setup, 'https://wildhaggis.example.com/');
      const query = url.slice(url.indexOf('?'));
      expect(parseSharedRunUrl(query)).toEqual(setup);
    });

    it('accepts a URLSearchParams directly', () => {
      const setup: SharedRunSetup = {
        seed: 555 & 0x03ffffff,
        variantKey: 'iron_belly',
        curseKey: null,
      };
      const url = buildSharedRunUrl(setup, 'https://wildhaggis.example.com/');
      const params = new URLSearchParams(url.slice(url.indexOf('?')));
      expect(parseSharedRunUrl(params)).toEqual(setup);
    });

    it('returns null when no run param is present', () => {
      expect(parseSharedRunUrl('https://wildhaggis.example.com/')).toBeNull();
      expect(parseSharedRunUrl('?devDps=1')).toBeNull();
      expect(parseSharedRunUrl(new URLSearchParams())).toBeNull();
    });

    it('returns null when the seed code is malformed', () => {
      expect(
        parseSharedRunUrl('?run=BAD-CODE&v=classic'),
      ).toBeNull();
    });

    it('returns null when the variant key is missing or unknown', () => {
      // Generate a valid seed code so only the variant is invalid.
      const valid = buildSharedRunUrl(
        { seed: 100, variantKey: 'classic', curseKey: null },
        'https://wildhaggis.example.com/',
      );
      const runCode = new URLSearchParams(valid.slice(valid.indexOf('?'))).get('run');
      expect(parseSharedRunUrl(`?run=${runCode}`)).toBeNull();
      expect(parseSharedRunUrl(`?run=${runCode}&v=not_a_real_variant`)).toBeNull();
    });

    it('drops an unknown curse key (returns curseKey: null, keeps the rest)', () => {
      const valid = buildSharedRunUrl(
        { seed: 100, variantKey: 'classic', curseKey: null },
        'https://wildhaggis.example.com/',
      );
      const runCode = new URLSearchParams(valid.slice(valid.indexOf('?'))).get('run');
      const parsed = parseSharedRunUrl(`?run=${runCode}&v=classic&c=does_not_exist`);
      // Unknown curse is permissive (sender's build had a curse the
      // recipient's build no longer ships) — the shared run still loads
      // with that curse silently dropped to clean.
      expect(parsed).toEqual({
        seed: 100 & 0x03ffffff,
        variantKey: 'classic',
        curseKey: null,
      });
    });

    it('accepts case-insensitive seed codes', () => {
      const url = buildSharedRunUrl(
        { seed: 99999, variantKey: 'classic', curseKey: null },
        'https://wildhaggis.example.com/',
      );
      const runCode = new URLSearchParams(url.slice(url.indexOf('?'))).get('run')!;
      const lowered = runCode.toLowerCase();
      const parsed = parseSharedRunUrl(`?run=${lowered}&v=classic`);
      expect(parsed?.seed).toBe(99999 & 0x03ffffff);
    });

    it('refuses junk input gracefully', () => {
      expect(parseSharedRunUrl('')).toBeNull();
      // @ts-expect-error — deliberately passing the wrong type
      expect(parseSharedRunUrl(null)).toBeNull();
      // @ts-expect-error — deliberately passing the wrong type
      expect(parseSharedRunUrl(undefined)).toBeNull();
    });
  });
});
