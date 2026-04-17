/**
 * Elite affixes — one modifier per gold elite after `markAsElite()`, gated by
 * behaviour so we never roll impossible or unfair pairings (e.g. Volatile on dive).
 *
 * Weighted rolls use the run RNG — deterministic per seed.
 */
import type { EnemyBehavior } from './enemies';
import type { RNG } from '../utils/rng';

export type EliteAffixId = 'swift' | 'bulwark' | 'relentless' | 'wealthy' | 'volatile';

export interface EliteAffixDef {
  id: EliteAffixId;
  /** Relative weight within the allowed set for this behaviour. */
  weight: number;
  /** Screen/minimap indicator tint (distinct from default elite gold). */
  indicatorTint: number;
  /**
   * Behaviour keys that cannot roll this affix. Volatile excludes dive (unfair
   * off-screen impact) and spawner (minion churn amplifies explosions).
   */
  disallowedBehaviors: readonly EnemyBehavior[];
}

export const ELITE_AFFIXES: Record<EliteAffixId, EliteAffixDef> = {
  swift: {
    id: 'swift',
    weight: 24,
    indicatorTint: 0x44ddff,
    disallowedBehaviors: [],
  },
  bulwark: {
    id: 'bulwark',
    weight: 24,
    indicatorTint: 0x8899ff,
    disallowedBehaviors: [],
  },
  relentless: {
    id: 'relentless',
    weight: 22,
    indicatorTint: 0xdd66aa,
    disallowedBehaviors: [],
  },
  wealthy: {
    id: 'wealthy',
    weight: 18,
    indicatorTint: 0xffee66,
    disallowedBehaviors: [],
  },
  volatile: {
    id: 'volatile',
    weight: 16,
    indicatorTint: 0xff7722,
    disallowedBehaviors: ['dive', 'hazard', 'spawner'],
  },
};

const ALL_IDS = Object.keys(ELITE_AFFIXES) as EliteAffixId[];

/** Stable order for UI lists (pause reference, etc.). */
export const ELITE_AFFIX_DISPLAY_ORDER: readonly EliteAffixId[] = [
  'swift', 'bulwark', 'relentless', 'wealthy', 'volatile',
];

/** Speed mult applied on top of elite baked speed (after markAsElite). */
export const AFFIX_SWIFT_SPEED_MULT = 1.14;
/** HP mult applied after elite HP doubling. */
export const AFFIX_BULWARK_HP_MULT = 1.22;
/** Incoming knockback impulse multiplier (lower = heavier). */
export const AFFIX_RELENTLESS_KNOCKBACK_MUL = 0.52;
/** XP value multiplier on top of elite ×3. */
export const AFFIX_WEALTHY_XP_MULT = 1.38;
/** Volatile death splash — enemy-only, radius px, damage. */
export const AFFIX_VOLATILE_RADIUS = 68;
export const AFFIX_VOLATILE_SPLASH_DAMAGE = 16;

/**
 * Weighted pick from affixes legal for `behavior`. Returns null only if the
 * filter removes every affix (should not happen with current table).
 */
export function pickEliteAffixId(behavior: EnemyBehavior, rng: RNG): EliteAffixId | null {
  const allowed = ALL_IDS.filter((id) => !ELITE_AFFIXES[id].disallowedBehaviors.includes(behavior));
  if (allowed.length === 0) return null;
  return rng.weighted(allowed, (id) => ELITE_AFFIXES[id].weight);
}
