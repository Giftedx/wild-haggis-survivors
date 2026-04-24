/**
 * Pure-function effect implementations for common relics (R1 M1 T6-9).
 *
 * These helpers are Phaser-agnostic — callers pass numeric or state inputs
 * and receive transformed outputs. No side effects, no randomness, no
 * wall-clock reads. M3 wires them into the runtime via RelicInventory /
 * event handlers.
 *
 * Spec: docs/superpowers/specs/r1-relics.md §3 (common pool).
 */

/**
 * sporran_of_holding — +2 gold per pickup collected.
 */
export function applySporranOfHolding(goldFromPickup: number): number {
  return goldFromPickup + 2;
}

/**
 * oatcake_stash — Heal 2 HP when entering a healing circle.
 * Caller passes the base heal amount and receives the boosted value.
 */
export function applyOatcakeHealOnCircleEntry(healAmount: number): number {
  return healAmount + 2;
}

/**
 * grans_thimble — Critical hits deal +8% damage.
 * Caller passes the current crit multiplier (e.g. 2× base) and receives
 * the scaled value. Applied to the multiplier, not the raw damage, so the
 * bonus scales with other crit buffs.
 */
export function applyGransThimbleCritBonus(critMultiplier: number): number {
  return critMultiplier * 1.08;
}

/**
 * lucky_heather_sprig — +3% luck (card-draw rarity bias).
 * Additive with existing luck. Callers are responsible for any upper
 * clamp — the helper applies the delta unconditionally.
 */
export function applyLuckyHeatherSprigLuck(luck: number): number {
  return luck + 0.03;
}
