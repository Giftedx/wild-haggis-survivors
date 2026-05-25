import { describe, expect, it } from 'vitest';

import {
  buildSharedRunUrl,
  parseSharedRunUrl,
  type SharedRunChallenge,
  type SharedRunSetup,
} from './sharedRunUrl';

describe('sharedRunUrl', () => {
  describe('buildSharedRunUrl', () => {
    it('encodes seed + variant + curse as query params on the supplied base URL', () => {
      const url = buildSharedRunUrl(
        { seed: 12345, variantKey: 'classic', curseKey: 'heavy_legs' },
        'https://wildhaggis.example.com/',
      );
      // The seed is encoded via the existing checksummed share codec so the
      // recipient doesn't need to know about the integer form.
      expect(url).toMatch(/^https:\/\/wildhaggis\.example\.com\/\?run=[0-9A-Z]{8}&v=classic&c=heavy_legs$/);
    });

    it('omits the curse param entirely for a clean run', () => {
      const url = buildSharedRunUrl(
        { seed: 9000, variantKey: 'moor_runner', curseKey: null },
        'https://wildhaggis.example.com/',
      );
      expect(url).toMatch(/^https:\/\/wildhaggis\.example\.com\/\?run=[0-9A-Z]{8}&v=moor_runner$/);
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
        seed: 12345,
        variantKey: 'classic',
        curseKey: 'heavy_legs',
        challenge: null,
      };
      const url = buildSharedRunUrl(setup, 'https://wildhaggis.example.com/');
      const parsed = parseSharedRunUrl(url);
      expect(parsed).toEqual(setup);
    });

    it('accepts a bare query string', () => {
      const setup: SharedRunSetup = {
        seed: 7777,
        variantKey: 'moor_runner',
        curseKey: null,
        challenge: null,
      };
      const url = buildSharedRunUrl(setup, 'https://wildhaggis.example.com/');
      const query = url.slice(url.indexOf('?'));
      expect(parseSharedRunUrl(query)).toEqual(setup);
    });

    it('accepts a URLSearchParams directly', () => {
      const setup: SharedRunSetup = {
        seed: 555,
        variantKey: 'iron_belly',
        curseKey: null,
        challenge: null,
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
        { seed: 100, variantKey: 'classic', curseKey: null, challenge: null },
        'https://wildhaggis.example.com/',
      );
      const runCode = new URLSearchParams(valid.slice(valid.indexOf('?'))).get('run');
      expect(parseSharedRunUrl(`?run=${runCode}`)).toBeNull();
      expect(parseSharedRunUrl(`?run=${runCode}&v=not_a_real_variant`)).toBeNull();
    });

    it('drops an unknown curse key (returns curseKey: null, keeps the rest)', () => {
      const valid = buildSharedRunUrl(
        { seed: 100, variantKey: 'classic', curseKey: null, challenge: null },
        'https://wildhaggis.example.com/',
      );
      const runCode = new URLSearchParams(valid.slice(valid.indexOf('?'))).get('run');
      const parsed = parseSharedRunUrl(`?run=${runCode}&v=classic&c=does_not_exist`);
      // Unknown curse is permissive (sender's build had a curse the
      // recipient's build no longer ships) — the shared run still loads
      // with that curse silently dropped to clean.
      expect(parsed).toEqual({
        seed: 100,
        variantKey: 'classic',
        curseKey: null,
        challenge: null,
      });
    });

    it('accepts case-insensitive seed codes', () => {
      const url = buildSharedRunUrl(
        { seed: 99999, variantKey: 'classic', curseKey: null, challenge: null },
        'https://wildhaggis.example.com/',
      );
      const runCode = new URLSearchParams(url.slice(url.indexOf('?'))).get('run')!;
      const lowered = runCode.toLowerCase();
      const parsed = parseSharedRunUrl(`?run=${lowered}&v=classic`);
      expect(parsed?.seed).toBe(99999);
    });

    it('preserves full-range seeds so shared runs keep sender/recipient RNG parity', () => {
      for (const seed of [0x80000000, 0xffffffff, 0xdeadbeef, 0xcafebabe]) {
        const url = buildSharedRunUrl(
          { seed, variantKey: 'classic', curseKey: null, challenge: null },
          'https://wildhaggis.example.com/',
        );
        expect(parseSharedRunUrl(url)?.seed, `seed=${seed}`).toBe(seed >>> 0);
      }
    });

    it('refuses junk input gracefully', () => {
      expect(parseSharedRunUrl('')).toBeNull();
      // @ts-expect-error — deliberately passing the wrong type
      expect(parseSharedRunUrl(null)).toBeNull();
      // @ts-expect-error — deliberately passing the wrong type
      expect(parseSharedRunUrl(undefined)).toBeNull();
    });
  });

  describe('challenge metadata (V2 — outcome + time)', () => {
    const baseSetup: SharedRunSetup = {
      seed: 12345 & 0x03ffffff,
      variantKey: 'classic',
      curseKey: 'heavy_legs',
    };

    it('encodes outcome=victory + time as t / o params', () => {
      const challenge: SharedRunChallenge = { outcome: 'victory', timeSurvivedSec: 754 };
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/', { challenge });
      expect(url).toMatch(/\bt=754\b/);
      expect(url).toMatch(/\bo=v\b/);
    });

    it('encodes outcome=death with o=d', () => {
      const challenge: SharedRunChallenge = { outcome: 'death', timeSurvivedSec: 553 };
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/', { challenge });
      expect(url).toMatch(/\bt=553\b/);
      expect(url).toMatch(/\bo=d\b/);
    });

    it('omits t / o when no challenge is supplied', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/');
      expect(url).not.toMatch(/[?&]t=/);
      expect(url).not.toMatch(/[?&]o=/);
    });

    it('floors fractional seconds to keep the URL stable', () => {
      const challenge: SharedRunChallenge = { outcome: 'victory', timeSurvivedSec: 753.81 };
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/', { challenge });
      expect(url).toMatch(/\bt=753\b/);
    });

    it('refuses non-finite / negative times by omitting t (and the outcome alone is meaningless, drop it too)', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/', {
        challenge: { outcome: 'victory', timeSurvivedSec: -1 },
      });
      expect(url).not.toMatch(/[?&]t=/);
      expect(url).not.toMatch(/[?&]o=/);
    });

    it('scrubs stale t / o params before re-stamping', () => {
      const url = buildSharedRunUrl(
        baseSetup,
        'https://wildhaggis.example.com/?run=STALE12&t=999&o=d&keepme=yes',
        { challenge: { outcome: 'victory', timeSurvivedSec: 100 } },
      );
      expect(url).toContain('keepme=yes');
      expect(url).toMatch(/\bt=100\b/);
      expect(url).toMatch(/\bo=v\b/);
      // The stale 999 / d values are gone.
      expect(url).not.toMatch(/t=999/);
      expect(url.match(/o=d\b/)).toBeNull();
    });

    it('parses a challenge URL through to a populated challenge field', () => {
      const challenge: SharedRunChallenge = { outcome: 'death', timeSurvivedSec: 600 };
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/', { challenge });
      const parsed = parseSharedRunUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed!.challenge).toEqual(challenge);
    });

    it('parses with no t / o → challenge field is null', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/');
      const parsed = parseSharedRunUrl(url);
      expect(parsed).not.toBeNull();
      expect(parsed!.challenge).toBeNull();
    });

    it('drops the challenge if outcome is unknown but keeps the setup', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/');
      // Build the URL legitimately, then hand-stamp a bogus outcome on top.
      const tampered = url + '&t=600&o=x';
      const parsed = parseSharedRunUrl(tampered);
      expect(parsed).not.toBeNull();
      expect(parsed!.challenge).toBeNull();
      // The setup half still resolves cleanly.
      expect(parsed!.variantKey).toBe('classic');
    });

    it('drops the challenge if time is missing but outcome is present', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/');
      const tampered = url + '&o=v';
      const parsed = parseSharedRunUrl(tampered);
      expect(parsed).not.toBeNull();
      expect(parsed!.challenge).toBeNull();
    });

    it('drops the challenge if time is non-numeric', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/');
      const tampered = url + '&t=abc&o=v';
      const parsed = parseSharedRunUrl(tampered);
      expect(parsed).not.toBeNull();
      expect(parsed!.challenge).toBeNull();
    });

    it('clamps absurd times by rejecting them outright (24h cap)', () => {
      const url = buildSharedRunUrl(baseSetup, 'https://wildhaggis.example.com/');
      const tampered = url + `&t=${24 * 60 * 60 + 1}&o=v`;
      const parsed = parseSharedRunUrl(tampered);
      expect(parsed).not.toBeNull();
      // Out of range → challenge dropped (defensive cap on URL tampering).
      expect(parsed!.challenge).toBeNull();
    });
  });
});
