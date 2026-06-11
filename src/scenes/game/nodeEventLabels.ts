/**
 * Plain-English labels for Moor Road node event keys.
 *
 * Resolves through `t('nodes.boon.<key>.label')` / `t('nodes.offer.<key>')`
 * so the SCS locale picks up Scots overlays automatically as they land.
 * Falls back to the raw key when a translation is missing, matching the
 * tolerant shape elsewhere in the i18n layer.
 */
import { t } from '../../core/i18n';

export function shrineLabelFromKey(key: string): string {
  const resolved = t(`nodes.boon.${key}.label`);
  // `t()` returns the dot-path verbatim on miss — fall back to the raw key
  // so unauthored keys surface diagnostic-friendly text rather than a dot-path.
  return resolved.startsWith('nodes.boon.') ? key : resolved;
}

export function bargainLabelFromOfferKey(key: string): string {
  const resolved = t(`nodes.offer.${key}`);
  return resolved.startsWith('nodes.offer.') ? key : resolved;
}
