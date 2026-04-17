import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  EN_STRINGS,
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

  it('ships Scots as a non-empty overlay (W18 Phase B content)', () => {
    expect(Object.keys(SCS_STRINGS).length).toBeGreaterThan(0);
    // Spot-check: a high-visibility key is overridden in Scots.
    setLocale('scs');
    expect(t('ui.menu.start_run')).toBe('GAUN');
    expect(t('ui.curseScene.title')).toBe('CURSE O\' THA MOOR');
    expect(t('ui.bossWarning.gordon')).toContain('mairchin');
  });

  it('scs overlay still falls back to English for keys it does not define', () => {
    setLocale('scs');
    // Pick a key the overlay does not currently translate (a passive name).
    const s = t('ui.passive.pause_short.sporran');
    expect(s).toBe('Sporran (+15% Luck)');
  });

  it('LOCALES exposes both keys', () => {
    expect(Object.keys(LOCALES).sort()).toEqual(['en', 'scs']);
  });

  it('scs locale falls back to English for undefined keys', () => {
    setLocale('scs');
    // A known en key that scs does not currently override.
    const s = t('ui.passive.hud_abbrev.sporran');
    expect(s).toBe('SPR');
    expect(s).not.toBe('ui.passive.hud_abbrev.sporran');
  });

  it('scs locale uses the overlay when a key is defined', () => {
    setLocale('scs');
    // ui.menu.start_run is defined in the Scots overlay (Phase B content).
    expect(t('ui.menu.start_run')).toBe('GAUN');
  });

  it('interpolation still works under scs', () => {
    setLocale('scs');
    // buy_kills happens to be the same template in both locales — the
    // contract under test is that {cost} interpolation still fires.
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

  /**
   * Catches the bossWarning / tutorial nesting bug class: every SCS leaf
   * key path must exist in EN, otherwise the Scots translation is dead
   * code (the call site reads a different path). Walks both trees in
   * parallel and reports any orphan keys present in scs but missing in en.
   */
  it('every SCS key path also exists in EN (no orphan overlays)', () => {
    const orphans: string[] = [];
    const walk = (scs: LocaleTree, en: LocaleTree | undefined, path: string) => {
      for (const [k, v] of Object.entries(scs)) {
        const next = path ? `${path}.${k}` : k;
        const enChild = en && typeof en === 'object' ? (en as Record<string, unknown>)[k] : undefined;
        if (typeof v === 'string') {
          if (typeof enChild !== 'string') orphans.push(next);
        } else if (v && typeof v === 'object') {
          walk(v as LocaleTree, enChild as LocaleTree | undefined, next);
        }
      }
    };
    walk(SCS_STRINGS, EN_STRINGS, '');
    expect(orphans).toEqual([]);
  });
});
