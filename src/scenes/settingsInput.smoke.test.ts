import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE, setLocale, t } from '../core/i18n';
import { ACTION_KEYS } from '../core/actions';

/**
 * Regression fence for `SettingsInputScene`: every string the scene
 * renders must resolve in i18n. Catches missing copy when a new action
 * lands in the enum or a new UI element ships.
 */
const INPUT_REBIND_KEYS = [
  'ui.inputRebind.title',
  'ui.inputRebind.subtitle',
  'ui.inputRebind.skill_hint',
  'ui.inputRebind.unbound',
  'ui.inputRebind.gamepadPrefix',
  'ui.inputRebind.rebind_hint',
  'ui.inputRebind.conflict_warning',
  'ui.inputRebind.reset_defaults',
] as const;

describe('Settings / Input Rebind scene smoke', () => {
  afterEach(() => setLocale(DEFAULT_LOCALE));

  it('resolves every top-level inputRebind i18n key', () => {
    for (const key of INPUT_REBIND_KEYS) {
      const resolved = t(key);
      expect(resolved, key).not.toBe(key);
      expect(resolved.length, key).toBeGreaterThan(0);
    }
  });

  it('resolves an action label for every ActionKey', () => {
    for (const action of ACTION_KEYS) {
      const key = `ui.inputRebind.action.${action}`;
      const resolved = t(key);
      expect(resolved, key).not.toBe(key);
      expect(resolved.length, key).toBeGreaterThan(0);
    }
  });

  it('lists the fixed active-skill keys in both shipped locales', () => {
    for (const locale of ['en', 'scs'] as const) {
      setLocale(locale);
      const hint = t('ui.inputRebind.skill_hint');
      for (const token of ['Q', 'E', 'F', 'G']) {
        expect(hint, `${locale} missing ${token}`).toContain(token);
      }
      expect(hint.toLowerCase(), `${locale} missing dash-strike copy`).toContain('dash');
    }
  });
});
