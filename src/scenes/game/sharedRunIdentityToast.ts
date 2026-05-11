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
import type { SharedRunSetup } from '../../utils/sharedRunUrl';

/**
 * Warmth-tan toast colour — matches the existing copy-action / seed
 * readout palette so the banner reads as a UX message rather than a
 * warning. Kept inline (not pulled from COLORS_CSS) to avoid an
 * import-cycle risk through the Phaser-aware config bundle.
 */
export const SHARED_RUN_TOAST_COLOR = '#e8c060';

/**
 * Format the shared-run welcome line for `meta`. Returns one of two
 * shapes depending on whether the shared run carried a curse:
 *
 *   - clean:  `"Shared run · <variant>"`
 *   - cursed: `"Shared run · <variant> · <curse>"`
 */
export function formatSharedRunIdentityToast(meta: SharedRunSetup): string {
  const variant = getVariantByKey(meta.variantKey);
  const variantLabel = t(variant.nameKey);
  const curseDef = getCurseByKey(meta.curseKey);
  if (curseDef) {
    return t('ui.toast.shared_run_loaded', {
      variant: variantLabel,
      curse: t(curseDef.nameKey),
    });
  }
  return t('ui.toast.shared_run_loaded_clean', { variant: variantLabel });
}
