/**
 * Pure helpers for the run-start / run-resume identity toast.
 *
 * The toast surfaces the active variant's `name` plus a flavor blurb,
 * trimmed so a wordy flavor line can't overflow the toast plate. The
 * cap is loose (52 chars) — most flavor lines fit comfortably; only the
 * occasional verbose variant gets ellipsised.
 *
 * Kept separate from GameScene so the truncation + branching i18n
 * lookup can be unit-tested without spinning up a Phaser scene.
 */
import { t } from '../../core/i18n';

export const RUN_IDENTITY_FLAVOR_MAX = 52;

/**
 * Trim a flavor line to fit the toast plate. Strips outer whitespace
 * first, then truncates with a single-character ellipsis (rather than
 * three dots) so the visible char budget stays tight.
 *
 * Strings shorter than `maxLen` are returned unchanged after the trim.
 */
export function truncateRunIdentityFlavor(raw: string, maxLen = RUN_IDENTITY_FLAVOR_MAX): string {
  const t = raw.trim();
  if (t.length <= maxLen) return t;
  return `${t.slice(0, maxLen - 1).trimEnd()}…`;
}

/**
 * Compose the toast body string for either a fresh run start or a
 * resumed run. The boolean branch picks one of two i18n keys; the
 * trim + ellipsis lives in `truncateRunIdentityFlavor` above.
 */
export function formatRunIdentityToast(
  isResume: boolean,
  name: string,
  rawFlavor: string,
  maxLen = RUN_IDENTITY_FLAVOR_MAX,
): string {
  const flavor = truncateRunIdentityFlavor(rawFlavor, maxLen);
  return isResume
    ? t('ui.run.resume_identity', { name, flavor })
    : t('ui.run.start_identity', { name, flavor });
}
