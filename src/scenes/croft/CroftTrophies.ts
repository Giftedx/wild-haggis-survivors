/**
 * H1 M2 T12 — pure trophy-tier logic for the mantelpiece.
 *
 * Given the four counters persisted in `SaveData`
 * (`bossKillCounts` + `cursedVictoriesByBoss`), resolve each boss to
 * one of four tiers. The mantelpiece drawer (T13) looks these up and
 * picks a sprite accordingly.
 *
 *   'none'   → empty slot (no trophy, dim silhouette on the shelf).
 *   'first'  → base trophy (ladle / wheel / cap / helmet / ledger).
 *   'tenth'  → enriched trophy (apron scrap, route number, etc.).
 *   'cursed' → cursed-run trophy (singed apron, red-ink bleed, ...).
 *
 * The `cursed` tier is the *highest* — a cursed-victory beat elevates
 * the slot regardless of raw kill count. Spec §3 ties the cursed art
 * to the cursed-victory accolade, so we honour that ordering even if
 * a player has 50 gordon kills but zero cursed wins against him.
 *
 * Pure — safe to import from tests without Phaser in scope.
 */

import type { SaveData } from '../../utils/save';

export type TrophyTier = 'none' | 'first' | 'tenth' | 'cursed';

export interface Trophy {
  /** Boss key from BOSSES in `src/data/enemies.ts`. */
  readonly bossKey: TrophyBossKey;
  /** Current tier resolved from the save state. */
  readonly tier: TrophyTier;
  /** Lifetime kill count for this boss. */
  readonly killCount: number;
  /** Lifetime cursed-victory count against this boss. */
  readonly cursedWinCount: number;
}

/**
 * Five canonical boss keys aligned with `BOSSES` (src/data/enemies.ts).
 * Mantelpiece renders slots in this order, left-to-right, matching
 * the W2 act sequence (gordon / tour_bus / laird / hunter / taxman).
 */
export const TROPHY_BOSS_KEYS = [
  'gordon',
  'tour_bus',
  'the_laird',
  'hunter_general',
  'taxman',
] as const;

export type TrophyBossKey = (typeof TROPHY_BOSS_KEYS)[number];

/** Kill count required to promote from 'first' to 'tenth'. */
export const TROPHY_TIER_TENTH_THRESHOLD = 10;

/** Subset of SaveData used by the trophy logic. Keeps test setup minimal. */
export type TrophySaveView = Pick<
  SaveData,
  'bossKillCounts' | 'cursedVictoriesByBoss'
>;

export function computeTrophyTier(
  bossKey: TrophyBossKey,
  save: TrophySaveView,
): TrophyTier {
  const kills = save.bossKillCounts[bossKey] ?? 0;
  const cursedWins = save.cursedVictoriesByBoss[bossKey] ?? 0;
  if (cursedWins >= 1) return 'cursed';
  if (kills >= TROPHY_TIER_TENTH_THRESHOLD) return 'tenth';
  if (kills >= 1) return 'first';
  return 'none';
}

export function computeTrophy(
  bossKey: TrophyBossKey,
  save: TrophySaveView,
): Trophy {
  return {
    bossKey,
    tier: computeTrophyTier(bossKey, save),
    killCount: save.bossKillCounts[bossKey] ?? 0,
    cursedWinCount: save.cursedVictoriesByBoss[bossKey] ?? 0,
  };
}

/**
 * Resolve a trophy for every canonical boss. Mantelpiece drawer
 * renders these in order.
 */
export function computeAllTrophies(save: TrophySaveView): Trophy[] {
  return TROPHY_BOSS_KEYS.map((k) => computeTrophy(k, save));
}

/**
 * Count how many trophy slots have earned something (tier !== 'none').
 * Useful for UI chips like "3 / 5 mantel slots filled".
 */
export function countEarnedTrophies(save: TrophySaveView): number {
  return TROPHY_BOSS_KEYS.reduce(
    (acc, k) => (computeTrophyTier(k, save) === 'none' ? acc : acc + 1),
    0,
  );
}
