import type { ISettingsData } from './SettingsManager';
import { setLocale, DEFAULT_LOCALE } from './i18n';

/**
 * W18 locale scaffolding. Pulls the persisted `localeKey` off the
 * user settings and applies it to the i18n module so future `t(...)`
 * calls resolve through the right overlay. Back-compat: an absent or
 * malformed localeKey falls back to the default locale ('en').
 *
 * Call once on game start (after the first `load()`) and again any
 * time the user picks a new language in Settings.
 */
export function applyLocaleFromUserSettings(s: ISettingsData): void {
  setLocale(s.localeKey ?? DEFAULT_LOCALE);
}
