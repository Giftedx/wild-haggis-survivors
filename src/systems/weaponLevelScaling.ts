import type { WeaponDef } from '../data/weapons';

/**
 * Pure level-scaling resolver for weapon stats.
 *
 * Takes a weapon definition and a target level, returns the four
 * numeric stats that apply each level-up: damage, cooldownMs, pierce,
 * and aoeRadius. The computation replays the scaling formula from
 * level 1 up to the target — given a level it's idempotent, so
 * WeaponSystem can use it for both incremental level-ups and for
 * hydrating a weapon from a saved state.
 *
 * The projectileCount bump (`countAt`) is a list of levels at which
 * to increment, so it stays in WeaponSystem (caller decides whether
 * to +1 or replay).
 */

/** Absolute cooldown floor — no weapon can fire faster than 200ms/shot at level 5. */
export const WEAPON_COOLDOWN_FLOOR_MS = 200;

export interface LevelScaledWeaponStats {
  damage: number;
  cooldownMs: number;
  pierce: number;
  aoeRadius: number;
}

export function computeLevelScaledWeaponStats(
  config: WeaponDef,
  level: number,
): LevelScaledWeaponStats {
  const s = config.levelScaling;
  const exponent = level - 1;
  return {
    damage: Math.ceil(config.damage * Math.pow(s.damage, exponent)),
    cooldownMs: Math.max(WEAPON_COOLDOWN_FLOOR_MS, config.cooldownMs * Math.pow(s.cooldown, exponent)),
    pierce: config.pierce + s.pierce * exponent,
    aoeRadius: config.aoeRadius * Math.pow(s.radius, exponent),
  };
}
