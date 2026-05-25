import { describe, expect, it } from 'vitest';
import { BOSSES } from '../../data/enemies';
import { resolveBossDisplayName } from './gameOverSaveHighlightLink';

describe('resolveBossDisplayName', () => {
  it('resolves a known boss key via i18n', () => {
    expect(resolveBossDisplayName('gordon')).toBe('Gordon the Chef');
  });

  it('handles the multi-token boss key', () => {
    expect(resolveBossDisplayName('tour_bus')).toBe('The Tour Bus');
  });

  it('preserves the i18n flavour text for the Taxman', () => {
    expect(resolveBossDisplayName('taxman')).toBe('Death (The Taxman)');
  });

  it('has a localized, non-raw display name for every shipped boss', () => {
    for (const boss of BOSSES) {
      const label = resolveBossDisplayName(boss.key);
      expect(label, `label for ${boss.key}`).toBeTruthy();
      expect(label, `label for ${boss.key}`).not.toBe(boss.key);
      expect(label, `label for ${boss.key}`).not.toBe(boss.nameKey);
      expect(label, `label for ${boss.key}`).not.toBe('boss');
    }
  });

  it('uses a generic fallback for unknown keys instead of leaking raw identifiers', () => {
    expect(resolveBossDisplayName('future_internal_boss')).toBe('boss');
  });

  it('returns the generic fallback for an empty key without crashing', () => {
    expect(resolveBossDisplayName('')).toBe('boss');
  });
});
