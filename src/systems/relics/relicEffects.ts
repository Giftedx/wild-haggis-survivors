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
