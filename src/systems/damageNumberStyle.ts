import { COLORS_CSS } from '../config';

/**
 * Pure styling helper for floating damage numbers. Given a raw damage
 * value + whether the hit was a crit, returns the scale factor and
 * text colour JuiceSystem should use. The scene folds in `uiScale`
 * on top of the returned scale (accessibility knob owned elsewhere).
 *
 * Extracted from JuiceSystem.showDamageNumber so the curve (and the
 * crit uplift + tier colour break) is unit-testable without a
 * Phaser env.
 *
 * Curve:
 *   sizeScale = min(2.0, 0.8 + damage * 0.04)     — capped growth
 *   final scale = isCrit ? sizeScale * 1.4 : sizeScale
 *
 * Colours (whisky-gold palette):
 *   crit        → #ffdd44 (bright gold)
 *   damage ≥ 20 → COLORS_CSS.WHISKY_GOLD (deep gold for big non-crit hits)
 *   else        → #e8c848 (warm default)
 */
export interface DamageNumberStyle {
  /** Scale factor to pass to Phaser's `.setScale(scale * uiScale)`. */
  scale: number;
  /** Hex colour string for `.setColor(...)`. */
  color: string;
}

/** Colour-break threshold for "big non-crit" gold (d4a017). */
export const DAMAGE_NUMBER_BIG_THRESHOLD = 20;
/** Crit scale multiplier on top of the base size scale. */
export const DAMAGE_NUMBER_CRIT_SCALE_MUL = 1.4;
/** Upper cap on the non-crit size scale (crits can exceed this). */
export const DAMAGE_NUMBER_SCALE_CAP = 2.0;
/** Linear growth constant in `0.8 + damage * 0.04`. */
export const DAMAGE_NUMBER_SCALE_SLOPE = 0.04;
/** Baseline scale at 0 damage (clamped by the cap at large damage). */
export const DAMAGE_NUMBER_SCALE_BASE = 0.8;

export function damageNumberStyle(damage: number, isCrit: boolean): DamageNumberStyle {
  const safe = Math.max(0, damage);
  const sizeScale = Math.min(
    DAMAGE_NUMBER_SCALE_CAP,
    DAMAGE_NUMBER_SCALE_BASE + safe * DAMAGE_NUMBER_SCALE_SLOPE,
  );
  const scale = isCrit ? sizeScale * DAMAGE_NUMBER_CRIT_SCALE_MUL : sizeScale;
  const color = isCrit
    ? '#ffdd44'
    : safe >= DAMAGE_NUMBER_BIG_THRESHOLD
      ? COLORS_CSS.WHISKY_GOLD
      : '#e8c848';
  return { scale, color };
}
