/**
 * Single source of truth for the kill-combo damage bonus.
 *
 * The JuiceSystem combo counter both APPLIES this bonus (via
 * getComboDamageMultiplier — read by WeaponSystem) AND DISPLAYS it on
 * the HUD combo chip (as a `+X%` tag). Previously each call site
 * encoded the formula independently — silent visual drift if either
 * side ever changed without the other.
 *
 * Formula: every 10 combo grants +5% damage, capped at +50% (i.e.
 * combo 100+ tops out the bonus). Sub-10 combo runs at base damage.
 */
export const COMBO_TIER_SIZE = 10;
export const COMBO_BONUS_PER_TIER = 0.05;
export const COMBO_BONUS_CAP = 0.5;

/**
 * Bonus damage as a fraction (0.0..0.5). Returns 0 for sub-tier
 * combos. Negative inputs clamp to 0 — defensive against a corrupted
 * resume payload that bleeds a negative comboCount in.
 */
export function comboDamageBonusFraction(comboCount: number): number {
  const tiers = Math.max(0, Math.floor(comboCount / COMBO_TIER_SIZE));
  return Math.min(COMBO_BONUS_CAP, tiers * COMBO_BONUS_PER_TIER);
}

/** Damage multiplier (1.0..1.5) consumed by WeaponSystem. */
export function comboDamageMultiplier(comboCount: number): number {
  return 1 + comboDamageBonusFraction(comboCount);
}

/** Whole-number percentage for the HUD combo chip (`+X%`). */
export function comboDamageBonusPct(comboCount: number): number {
  return Math.round(comboDamageBonusFraction(comboCount) * 100);
}
