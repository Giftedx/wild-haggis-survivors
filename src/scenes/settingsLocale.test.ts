import { describe, it, expect } from 'vitest';
import {
  cycleLocaleKey,
  labelForLocale,
  LOCALE_CYCLE_ORDER,
} from './settingsLocale';
import type { LocaleKey } from '../core/i18n';

describe('labelForLocale', () => {
  it('returns a non-empty label for every locale in the cycle', () => {
    for (const key of LOCALE_CYCLE_ORDER) {
      const label = labelForLocale(key);
      expect(label.length).toBeGreaterThan(0);
      // Label must not be the raw i18n key — proves i18n resolves.
      expect(label).not.toMatch(/^ui\.settings\.locale_/);
    }
  });

  it('produces distinct labels across locales', () => {
    const labels = new Set(LOCALE_CYCLE_ORDER.map(labelForLocale));
    expect(labels.size).toBe(LOCALE_CYCLE_ORDER.length);
  });
});

describe('cycleLocaleKey', () => {
  it('advances one step through LOCALE_CYCLE_ORDER', () => {
    for (let i = 0; i < LOCALE_CYCLE_ORDER.length; i++) {
      const from = LOCALE_CYCLE_ORDER[i];
      const expected = LOCALE_CYCLE_ORDER[(i + 1) % LOCALE_CYCLE_ORDER.length];
      expect(cycleLocaleKey(from)).toBe(expected);
    }
  });

  it('wraps from the last entry back to the first', () => {
    const last = LOCALE_CYCLE_ORDER[LOCALE_CYCLE_ORDER.length - 1];
    expect(cycleLocaleKey(last)).toBe(LOCALE_CYCLE_ORDER[0]);
  });

  it('cycling through the full order returns to the starting locale', () => {
    let cur: LocaleKey = LOCALE_CYCLE_ORDER[0];
    for (let i = 0; i < LOCALE_CYCLE_ORDER.length; i++) {
      cur = cycleLocaleKey(cur);
    }
    expect(cur).toBe(LOCALE_CYCLE_ORDER[0]);
  });

  it('a locale not in the order lands on the first entry next', () => {
    // indexOf(unknown) = -1 → (-1 + 1) % len = 0.
    const unknown = 'not_a_locale' as LocaleKey;
    expect(cycleLocaleKey(unknown)).toBe(LOCALE_CYCLE_ORDER[0]);
  });
});

describe('LOCALE_CYCLE_ORDER', () => {
  it('includes at least two entries (a chip with one locale is not useful)', () => {
    expect(LOCALE_CYCLE_ORDER.length).toBeGreaterThanOrEqual(2);
  });

  it('has no duplicate entries', () => {
    const set = new Set(LOCALE_CYCLE_ORDER);
    expect(set.size).toBe(LOCALE_CYCLE_ORDER.length);
  });
});
