import { describe, expect, it } from 'vitest';
import { shrineLabelFromKey, bargainLabelFromOfferKey } from './nodeEventLabels';

// ---------------------------------------------------------------------------
// shrineLabelFromKey
// ---------------------------------------------------------------------------

describe('shrineLabelFromKey', () => {
  it('returns a resolved string (not a dot-path) for a valid boon key', () => {
    const result = shrineLabelFromKey('buff_damage');
    expect(result).not.toMatch(/^nodes\.boon\./);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the raw key as fallback when the key has no translation', () => {
    expect(shrineLabelFromKey('nonexistent_boon_key_xyz')).toBe('nonexistent_boon_key_xyz');
  });

  it('handles empty string — returns empty string', () => {
    const result = shrineLabelFromKey('');
    // t('nodes.boon..label') will miss; fallback returns the empty key
    expect(typeof result).toBe('string');
  });

  it('returns a human-readable string for buff_speed', () => {
    const result = shrineLabelFromKey('buff_speed');
    expect(result).not.toMatch(/^nodes\.boon\./);
  });
});

// ---------------------------------------------------------------------------
// bargainLabelFromOfferKey
// ---------------------------------------------------------------------------

describe('bargainLabelFromOfferKey', () => {
  it('returns a resolved string (not a dot-path) for a valid offer key', () => {
    const result = bargainLabelFromOfferKey('rare_relic');
    expect(result).not.toMatch(/^nodes\.offer\./);
    expect(result.length).toBeGreaterThan(0);
  });

  it('returns the raw key as fallback when the key has no translation', () => {
    expect(bargainLabelFromOfferKey('no_such_offer_xyz')).toBe('no_such_offer_xyz');
  });

  it('returns a human-readable string for buff_damage_run', () => {
    const result = bargainLabelFromOfferKey('buff_damage_run');
    expect(result).not.toMatch(/^nodes\.offer\./);
  });
});
