import type { ISettingsData } from './SettingsManager';
import { setLocale, ensureLocaleReady, DEFAULT_LOCALE, type LocaleKey } from './i18n';

/**
 * W18 locale scaffolding. Pulls the persisted `localeKey` off the
 * user settings and applies it to the i18n module so future `t(...)`
 * calls resolve through the right overlay. Back-compat: an absent or
 * malformed localeKey falls back to the default locale ('en').
 *
 * Call once on game start (after the first `load()`) and again any
 * time the user picks a new language in Settings.
 *
 * Scots is code-split — `setLocale('scs')` kicks off the lazy chunk
 * load; the returned promise resolves once the overlay is cached so
 * callers that want to avoid a first-frame English flash can await it.
 * Synchronous callers can ignore the return value (the flash is small
 * — typically shorter than the Boot splash tween).
 */
export function applyLocaleFromUserSettings(s: ISettingsData): Promise<void> {
  const key: LocaleKey = s.localeKey ?? DEFAULT_LOCALE;
  setLocale(key);
  return ensureLocaleReady(key);
}
