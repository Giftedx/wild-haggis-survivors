/**
 * Shared-run welcome-banner helper — turns a parsed
 * {@link SharedRunSetup} into the toast string the recipient sees on
 * run start ("Shared run · Classic · Heavy Legs"). Pure-string so it
 * stays Phaser-free and node-env-testable per the i18n-only contract
 * documented in CLAUDE.md (Phaser imports break node-env vitest).
 *
 * The toast lands AFTER the standard run-identity toast so the player
 * first sees "Classic · The original" (the variant flavour line) and
 * then "← Shared run · Heavy Legs" — confirming both the variant they
 * inherited AND the friend's curse choice riding along with it.
 */
import { t } from '../../core/i18n';
import { getVariantByKey } from '../../data/variants';
import { getCurseByKey } from '../../data/curses';
import { formatClockTime } from '../../utils/formatClockTime';
import type { SharedRunSetup } from '../../utils/sharedRunUrl';

/**
 * Warmth-tan toast colour — matches the existing copy-action / seed
 * readout palette so the banner reads as a UX message rather than a
 * warning. Kept inline (not pulled from COLORS_CSS) to avoid an
 * import-cycle risk through the Phaser-aware config bundle.
 */
export const SHARED_RUN_TOAST_COLOR = '#e8c060';

/**
 * Format the shared-run welcome line for `meta`. Picks one of four
 * shapes based on the presence of a curse and a challenge metadata
 * block:
 *
 *   V1 (no challenge):
 *     - clean:  `"Shared run · <variant>"`
 *     - cursed: `"Shared run · <variant> · <curse>"`
 *
 *   V2 (challenge present — sharer's outcome + time):
 *     - cursed + victory: `"Shared run · <variant> · <curse> · <time> to beat"`
 *     - cursed + death:   `"Shared run · <variant> · <curse> · <time> to outlast"`
 *     - clean + victory:  `"Shared run · <variant> · <time> to beat"`
 *     - clean + death:    `"Shared run · <variant> · <time> to outlast"`
 *
 * Voice register: Hearth, not competitive — "to beat" and "to outlast"
 * frame the recipient as picking up a friend's run, not racing them.
 * Time uses `formatClockTime` so the mm:ss representation matches
 * the rest of the game's HUD / Game Over labels.
 */
export function formatSharedRunIdentityToast(meta: SharedRunSetup): string {
  const variant = getVariantByKey(meta.variantKey);
  const variantLabel = t(variant.nameKey);
  const curseDef = getCurseByKey(meta.curseKey);
  const challenge = meta.challenge;

  if (challenge) {
    const time = formatClockTime(challenge.timeSurvivedSec);
    if (curseDef) {
      const key = challenge.outcome === 'victory'
        ? 'ui.toast.shared_run_challenge_victory'
        : 'ui.toast.shared_run_challenge_death';
      return t(key, {
        variant: variantLabel,
        curse: t(curseDef.nameKey),
        time,
      });
    }
    const key = challenge.outcome === 'victory'
      ? 'ui.toast.shared_run_challenge_victory_clean'
      : 'ui.toast.shared_run_challenge_death_clean';
    return t(key, { variant: variantLabel, time });
  }

  if (curseDef) {
    return t('ui.toast.shared_run_loaded', {
      variant: variantLabel,
      curse: t(curseDef.nameKey),
    });
  }
  return t('ui.toast.shared_run_loaded_clean', { variant: variantLabel });
}
