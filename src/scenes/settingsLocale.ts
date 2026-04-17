import { t } from '../core/i18n';
import type { LocaleKey } from '../core/i18n';

/**
 * Order in which the Settings locale chip cycles. When adding a new
 * locale, append it here and add the matching label case below.
 */
export const LOCALE_CYCLE_ORDER: readonly LocaleKey[] = ['en', 'scs'];

/**
 * i18n label shown on the Settings locale chip for a given key.
 * Exhaustive switch — a new LocaleKey variant would fail the TS
 * compile here, catching the missing label at build time.
 */
export function labelForLocale(locale: LocaleKey): string {
  switch (locale) {
    case 'en': return t('ui.settings.locale_en');
    case 'scs': return t('ui.settings.locale_scs');
  }
}

/**
 * Step the current locale to the next entry in `LOCALE_CYCLE_ORDER`.
 * Wraps around to the first after the last. An unknown input is
 * treated as position -1 so cycling from it lands on the first entry.
 */
export function cycleLocaleKey(current: LocaleKey): LocaleKey {
  const idx = LOCALE_CYCLE_ORDER.indexOf(current);
  const next = (idx + 1) % LOCALE_CYCLE_ORDER.length;
  return LOCALE_CYCLE_ORDER[next];
}
