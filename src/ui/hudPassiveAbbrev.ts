import { t } from '../core/i18n';

/**
 * Three-character abbreviation shown in the HUD passive pill.
 *
 * Preferred value is `ui.passive.hud_abbrev.<passiveKey>` — authored
 * per-passive for disambiguation (e.g. three rare passives would all
 * render "THI" / "HIG" / "TAR" under the naive substring trick, so
 * they carry explicit CRN / SHD / SAS entries).
 *
 * When no i18n entry exists (new passive added without an abbrev yet),
 * fall back to `passiveKey.slice(0, 3).toUpperCase()` so the pill is
 * never empty.
 *
 * Detection of a missing key relies on the i18n layer returning the
 * key verbatim when unresolved — that's how `t()` behaves in this
 * codebase, and the behaviour is asserted by `src/core/i18n.test.ts`.
 */
export function resolvePassiveAbbrev(passiveKey: string): string {
  const i18nKey = `ui.passive.hud_abbrev.${passiveKey}`;
  const resolved = t(i18nKey);
  if (resolved === i18nKey) {
    return passiveKey.slice(0, 3).toUpperCase();
  }
  return resolved;
}
