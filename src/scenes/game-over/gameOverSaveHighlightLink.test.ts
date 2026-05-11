import { describe, expect, it, vi } from 'vitest';

vi.mock('../../core/i18n', () => ({
  t: (k: string): string => {
    const KNOWN: Record<string, string> = {
      'boss.gordon.name': 'Gordon',
      'boss.taxman.name': 'Death (The Taxman)',
      'boss.tour_bus.name': 'Tour Bus',
      // hunter_general intentionally omitted to exercise the humanise
      // fallback.
    };
    return KNOWN[k] ?? k;
  },
}));

import { resolveBossDisplayName } from './gameOverSaveHighlightLink';

describe('resolveBossDisplayName', () => {
  it('resolves a known boss key via i18n', () => {
    expect(resolveBossDisplayName('gordon')).toBe('Gordon');
  });

  it('handles the multi-token boss key', () => {
    expect(resolveBossDisplayName('tour_bus')).toBe('Tour Bus');
  });

  it('preserves the i18n flavour text for the Taxman', () => {
    expect(resolveBossDisplayName('taxman')).toBe('Death (The Taxman)');
  });

  it('humanises the key when the i18n leaf is missing (defensive)', () => {
    expect(resolveBossDisplayName('hunter_general')).toBe('Hunter General');
  });

  it('humanises a single-token unknown key', () => {
    expect(resolveBossDisplayName('beithir')).toBe('Beithir');
  });

  it('returns an empty string for an empty key without crashing', () => {
    expect(resolveBossDisplayName('')).toBe('');
  });
});
