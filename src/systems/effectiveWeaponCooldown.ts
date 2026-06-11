import { BALANCE } from '../core/BalanceConfig';

/**
 * Pure resolver for a weapon's effective per-frame cooldown.
 *
 * Takes the base cooldown plus every run-scoped modifier (attack
 * speed, cooldown reduction, curse multiplier) and returns the
 * actual milliseconds between shots. Two hard clamps keep the
 * system stable:
 *
 *  - BALANCE.weapons.minEffectiveCooldownMs as an absolute floor
 *    prevents pathological stacking from crashing the projectile
 *    pool by flooding it with one shot per frame.
 *  - attackSpeedMultiplier is floored at 0.05 before division so a
 *    bugged stat feed can't produce division by zero or a negative
 *    cooldown.
 *
 * The computation is the cooldown tick's inner loop, so keeping it
 * out of Math.max-nesting in WeaponSystem.update() makes it
 * testable without spinning up a Phaser scene.
 */

/** Attack-speed multiplier is clamped at this floor before being used as a divisor. */
export const MIN_ATTACK_SPEED_MULTIPLIER = 0.05;

export function resolveEffectiveCooldownMs(
  baseCooldownMs: number,
  attackSpeedMultiplier: number,
  cooldownReduction: number,
  curseCooldownMultiplier: number,
): number {
  const asp = Math.max(MIN_ATTACK_SPEED_MULTIPLIER, attackSpeedMultiplier);
  const raw =
    (baseCooldownMs * (1 - cooldownReduction) * curseCooldownMultiplier) / asp;
  return Math.max(BALANCE.weapons.minEffectiveCooldownMs, raw);
}
