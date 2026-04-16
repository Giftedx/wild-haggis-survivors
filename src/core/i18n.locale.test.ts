import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  SCS_STRINGS,
  getLocale,
  setLocale,
  t,
  type LocaleKey,
  type LocaleTree,
} from './i18n';

/**
 * W18 locale scaffolding regressions. Scots is a partial overlay —
 * keys it doesn't define must fall back to English, not return the raw
 * key. English stays the reference locale.
 */
describe('W18 locale scaffolding', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('defaults to en', () => {
    expect(getLocale()).toBe('en');
  });

  it('setLocale switches the active locale', () => {
    setLocale('scs');
    expect(getLocale()).toBe('scs');
    setLocale('en');
    expect(getLocale()).toBe('en');
  });

  it('ships Scots as an empty overlay (no-op scaffolding)', () => {
    expect(SCS_STRINGS).toEqual({});
  });

  it('LOCALES exposes both keys', () => {
    expect(Object.keys(LOCALES).sort()).toEqual(['en', 'scs']);
  });

  it('scs locale falls back to English for undefined keys', () => {
    setLocale('scs');
    // A known en key that scs does not override.
    const s = t('ui.menu.start_run');
    expect(s).toBe('START RUN');
    expect(s).not.toBe('ui.menu.start_run');
  });

  it('scs locale uses the overlay when a key is defined', () => {
    // Temporarily inject a scs override to verify the lookup order
    // without shipping real translations.
    const scs = LOCALES.scs as unknown as Record<string, unknown>;
    const originalUi = scs.ui;
    scs.ui = { menu: { start_run: 'GAUN' } } as unknown as LocaleTree;
    try {
      setLocale('scs');
      expect(t('ui.menu.start_run')).toBe('GAUN');
    } finally {
      if (originalUi === undefined) delete scs.ui;
      else scs.ui = originalUi;
    }
  });

  it('interpolation still works under scs with en fallback', () => {
    setLocale('scs');
    const s = t('ui.common.buy_kills', { cost: 500 });
    expect(s).toBe('500 culls');
  });

  it('unknown key returns the key itself regardless of locale', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
    setLocale('scs');
    expect(t('does.not.exist')).toBe('does.not.exist');
  });

  it('LocaleKey type narrows to en | scs at compile time', () => {
    const keys: LocaleKey[] = ['en', 'scs'];
    expect(keys).toHaveLength(2);
  });
});
