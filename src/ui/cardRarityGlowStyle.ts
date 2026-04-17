import type { Rarity } from '../data/upgrades';

/**
 * Pure style resolver for the glow rectangle drawn behind an upgrade
 * card. Legendary cards get the biggest, brightest wash tinted with
 * the rarity's border colour (later animated by the scene). Rare
 * drops get a smaller but still-tinted wash. Common and uncommon
 * cards get a tiny warm-gold wash regardless of their own border
 * colour — the goal on those is "these still feel hand-made" rather
 * than "this is a rare pull".
 *
 * Pulling the three-branch selector out of UpgradeCards keeps the
 * visual recipe readable at a glance and lets the scene stay focused
 * on tween wiring / sparkle creation.
 */

/** Warm-gold wash used on the low-rarity "still hand-made" glow. */
export const LOW_RARITY_GLOW_COLOR = 0xd4a017;

export interface CardRarityGlowStyle {
  /** Pixels of padding around the card the glow rectangle extends. */
  padExpand: number;
  /** Fill colour for the glow rectangle. */
  color: number;
  /** Base alpha (the scene may tween from/to this for legendary). */
  alpha: number;
}

export function resolveCardRarityGlowStyle(
  rarity: Rarity,
  borderColor: number,
): CardRarityGlowStyle {
  if (rarity === 'legendary') {
    return { padExpand: 8, color: borderColor, alpha: 0.15 };
  }
  if (rarity === 'rare') {
    return { padExpand: 4, color: borderColor, alpha: 0.1 };
  }
  // common / uncommon: small warm wash, ignores border colour.
  return { padExpand: 2, color: LOW_RARITY_GLOW_COLOR, alpha: 0.04 };
}
