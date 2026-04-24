import { describe, expect, it } from 'vitest';
import { t } from '../core/i18n';
import { ACTION_KEYS } from '../core/actions';

/**
 * Regression fence for `SettingsInputScene`: every string the scene
 * renders must resolve in i18n. Catches missing copy when a new action
 * lands in the enum or a new UI element ships.
 */
const INPUT_REBIND_KEYS = [
  'ui.inputRebind.title',
  'ui.inputRebind.subtitle',
  'ui.inputRebind.unbound',
  'ui.inputRebind.gamepadPrefix',
  'ui.inputRebind.rebind_hint',
  'ui.inputRebind.conflict_warning',
  'ui.inputRebind.reset_defaults',
] as const;

describe('Settings / Input Rebind scene smoke', () => {
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
});
