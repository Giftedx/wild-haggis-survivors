/**
 * Pure tier resolver for an XP gem's visual presentation.
 *
 * Gems come in three visual tiers keyed on their xp value:
 *
 *   boss (value ≥ 5)   → bright white, big aura, value label
 *   elite (value ≥ 3)  → pale gold, medium aura, value label
 *   regular (value < 3) → uncoloured, no aura, no label
 *
 * The scale is a continuous formula (0.8 + value × 0.15, capped at
 * 2.0) — no tier needed, but it lives here so the XPGem.spawn() body
 * can read its whole visual recipe from one call.
 *
 * Extracted so the "value ≥ 3 / ≥ 5" thresholds are in one place
 * (they were duplicated across tint, aura, and label branches) and
 * the bright-white boss gem can never drift away from the 14px aura
 * pairing.
 */

export const XP_GEM_ELITE_THRESHOLD = 3;
export const XP_GEM_BOSS_THRESHOLD = 5;

/** Boss-tier colour — bright white, very eye-catching. */
export const XP_GEM_BOSS_COLOR = 0xffffff;
/** Elite-tier colour — pale gold. */
export const XP_GEM_ELITE_COLOR = 0xffee66;

/** Continuous scale cap for very high-value gems. */
export const XP_GEM_MAX_SCALE = 2;
const XP_GEM_SCALE_BASE = 0.8;
const XP_GEM_SCALE_PER_VALUE = 0.15;

export interface XpGemAura {
  color: number;
  radius: number;
}

export interface XpGemTierStyle {
  /** Sprite scale — continuous, capped at XP_GEM_MAX_SCALE. */
  scale: number;
  /** Tint to apply to the sprite (null means clear any prior tint). */
  tint: number | null;
  /** Aura circle behind the gem (null for regular gems). */
  aura: XpGemAura | null;
  /** Whether to render the value label next to the gem. */
  showLabel: boolean;
}

export function resolveXpGemTier(value: number): XpGemTierStyle {
  const scale = Math.min(XP_GEM_MAX_SCALE, XP_GEM_SCALE_BASE + value * XP_GEM_SCALE_PER_VALUE);

  if (value >= XP_GEM_BOSS_THRESHOLD) {
    return {
      scale,
      tint: XP_GEM_BOSS_COLOR,
      aura: { color: XP_GEM_BOSS_COLOR, radius: 14 },
      showLabel: true,
    };
  }
  if (value >= XP_GEM_ELITE_THRESHOLD) {
    return {
      scale,
      tint: XP_GEM_ELITE_COLOR,
      aura: { color: XP_GEM_ELITE_COLOR, radius: 10 },
      showLabel: true,
    };
  }
  return { scale, tint: null, aura: null, showLabel: false };
}
