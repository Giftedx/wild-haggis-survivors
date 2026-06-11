/**
 * Pure helper for the lava-patch damage formula used by HazardZones.
 *
 * The scene tick scales the base lava damage by the player's current
 * `damageTakenMult` (curse + boon modifier) and floors the result at
 * 1 so a curse-inverted lava zone still stings for something instead
 * of being a free heal-patch walk.
 *
 * Formula: `max(1, round(baseDmg × mult))`
 *
 * Base damage constant lives here too — single source of truth so a
 * balance pass touches one file, and tests can assert the floor
 * behaviour independently of the base.
 */

/** Base lava damage per 500ms tick, pre-multiplier. */
export const LAVA_BASE_DAMAGE = 3;

/** Per-tick healing circles restore this much HP per 1000ms tick. */
export const HEAL_ZONE_HEAL_AMOUNT = 2;

/**
 * Compute the final lava damage for one tick, given the base and the
 * current `damageTakenMult`. Always ≥ 1 — a 0× or negative multiplier
 * still lands a single point of damage (we don't want hazards to ever
 * reward standing in them).
 */
export function computeHazardDamage(baseDmg: number, damageTakenMult: number): number {
  const safeMult = Number.isFinite(damageTakenMult) ? damageTakenMult : 1;
  return Math.max(1, Math.round(baseDmg * safeMult));
}
