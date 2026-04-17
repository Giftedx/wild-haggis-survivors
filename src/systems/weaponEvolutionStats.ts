/**
 * Pure evolution stat-boost resolver.
 *
 * When a weapon hits level 5 and the player also holds its paired
 * passive, the weapon evolves: stats jump to a budget that's "big
 * spike but not single-slot-wins" — targeting roughly 3.5× effective
 * DPS vs the pre-evolution baseline. The previous tuning (1.8×
 * damage × 2× count × 2× fire rate ≈ 7.2× DPS) let one evolved
 * weapon solve the game.
 *
 * The five multiplicative/floor knobs are exposed as named constants
 * so tuning shows up in diffs as a number change rather than a line
 * edit buried in WeaponSystem.
 */

/** Damage multiplier applied at evolution. */
export const EVOLVED_DAMAGE_MUL = 1.35;
/** Cooldown multiplier applied at evolution — less is faster. */
export const EVOLVED_COOLDOWN_MUL = 0.72;
/** Absolute cooldown floor for evolved weapons. */
export const EVOLVED_COOLDOWN_FLOOR_MS = 220;
/** AoE radius multiplier applied at evolution. */
export const EVOLVED_AOE_MUL = 1.35;
/** Evolved weapons fire at least this many projectiles. */
export const EVOLVED_MIN_PROJECTILE_COUNT = 2;
/** Evolved weapons pierce at least this many enemies. */
export const EVOLVED_MIN_PIERCE = 3;

export interface EvolvedWeaponStats {
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  aoeRadius: number;
  pierce: number;
}

export interface EvolvableWeaponStats {
  damage: number;
  cooldownMs: number;
  projectileCount: number;
  aoeRadius: number;
  pierce: number;
}

/**
 * Apply the evolution boost on top of the weapon's current
 * (post-level-scaling) stats. Idempotent on inputs — callers pass
 * the current stats and receive the upgraded numbers; no mutation.
 */
export function applyWeaponEvolutionStats(
  current: EvolvableWeaponStats,
): EvolvedWeaponStats {
  return {
    damage: Math.ceil(current.damage * EVOLVED_DAMAGE_MUL),
    cooldownMs: Math.max(EVOLVED_COOLDOWN_FLOOR_MS, current.cooldownMs * EVOLVED_COOLDOWN_MUL),
    projectileCount: Math.max(current.projectileCount, EVOLVED_MIN_PROJECTILE_COUNT),
    aoeRadius: current.aoeRadius * EVOLVED_AOE_MUL,
    pierce: Math.max(current.pierce, EVOLVED_MIN_PIERCE),
  };
}
