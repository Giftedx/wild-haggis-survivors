import { describe, it, expect } from 'vitest';

import { isSporranAutoRoute, SPORRAN_AUTO_ROUTE_PARAM } from './sporranAutoRoute';

describe('sporranAutoRoute', () => {
  describe('isSporranAutoRoute', () => {
    it('returns true for the canonical ?sporran=1 form', () => {
      expect(isSporranAutoRoute('?sporran=1')).toBe(true);
      expect(isSporranAutoRoute('sporran=1')).toBe(true);
      expect(isSporranAutoRoute('https://wild-haggis-survivors.pages.dev/?sporran=1')).toBe(true);
    });

    it('accepts bare-flag form (no value) like ?quickplay', () => {
      expect(isSporranAutoRoute('?sporran')).toBe(true);
      expect(isSporranAutoRoute('?sporran=')).toBe(true);
    });

    it('accepts permissive truthy aliases (case-insensitive)', () => {
      expect(isSporranAutoRoute('?sporran=true')).toBe(true);
      expect(isSporranAutoRoute('?sporran=TRUE')).toBe(true);
      expect(isSporranAutoRoute('?sporran=yes')).toBe(true);
      expect(isSporranAutoRoute('?sporran=on')).toBe(true);
    });

    it('rejects explicit opt-out values', () => {
      expect(isSporranAutoRoute('?sporran=0')).toBe(false);
      expect(isSporranAutoRoute('?sporran=false')).toBe(false);
      expect(isSporranAutoRoute('?sporran=no')).toBe(false);
      expect(isSporranAutoRoute('?sporran=off')).toBe(false);
    });

    it('returns false when param is absent', () => {
      expect(isSporranAutoRoute('')).toBe(false);
      expect(isSporranAutoRoute('?run=ABCDEFG&v=classic')).toBe(false);
      expect(isSporranAutoRoute('?other=1')).toBe(false);
    });

    it('returns false on null / undefined / non-string input', () => {
      expect(isSporranAutoRoute(null)).toBe(false);
      expect(isSporranAutoRoute(undefined)).toBe(false);
      expect(isSporranAutoRoute('' as string)).toBe(false);
    });

    it('accepts a pre-built URLSearchParams', () => {
      const params = new URLSearchParams();
      params.set(SPORRAN_AUTO_ROUTE_PARAM, '1');
      expect(isSporranAutoRoute(params)).toBe(true);

      const empty = new URLSearchParams();
      expect(isSporranAutoRoute(empty)).toBe(false);
    });

    it('coexists with other params (utm, run, devScenes)', () => {
      // Doesn't conflict with the shared-run path — boot order is
      // checked separately; this predicate just answers "is sporran flag set".
      expect(isSporranAutoRoute('?sporran=1&utm_source=mastodon')).toBe(true);
      expect(isSporranAutoRoute('?sporran=1&run=ABCDEFG&v=classic')).toBe(true);
      expect(isSporranAutoRoute('?devScenes&sporran=1')).toBe(true);
    });

    it('does not throw on malformed URL-shaped strings', () => {
      // `new URL('not a url')` throws → fallback to query-string parse.
      expect(isSporranAutoRoute('not a url with ?sporran=1')).toBe(false);
      expect(isSporranAutoRoute('garbage')).toBe(false);
    });
  });

  describe('SPORRAN_AUTO_ROUTE_PARAM', () => {
    it('is the documented param name', () => {
      // The constant is the contract — share links + e2e specs reference it.
      // Renaming requires breaking-link comms.
      expect(SPORRAN_AUTO_ROUTE_PARAM).toBe('sporran');
    });
  });
});
