/**
 * Pure drop-rate resolvers for enemy kills.
 *
 * All authored rates + amounts live here so balance edits touch one
 * file. Scene passes the `rng` call to the helper that needs one;
 * flat-value helpers are trivially pure.
 */

/** Health orb drop chance for normal enemies (bosses always drop). */
export const HEALTH_ORB_DROP_CHANCE_BASE = 0.05;
/** Health orb healing amount, normal enemy drop. */
export const HEALTH_ORB_AMOUNT_BASE = 5;
/** Health orb healing amount, boss drop. */
export const HEALTH_ORB_AMOUNT_BOSS = 25;

/** Gold coin drop chance, normal enemies. */
export const GOLD_DROP_CHANCE_BASE = 0.02;
/** Gold coin drop chance, elite enemies. */
export const GOLD_DROP_CHANCE_ELITE = 0.1;
/** Gold coin drop chance, bosses (always drop). */
export const GOLD_DROP_CHANCE_BOSS = 1;

/** Gold coin value range for normal/elite drops [min, max]. */
export const GOLD_COIN_AMOUNT_BASE: readonly [number, number] = [1, 3];
/** Gold coin value range for boss drops [min, max]. */
export const GOLD_COIN_AMOUNT_BOSS: readonly [number, number] = [5, 15];

/** Chance an enemy of this kind drops a health orb. Bosses always drop. */
export function healthOrbDropRate(wasBoss: boolean): number {
  return wasBoss ? 1 : HEALTH_ORB_DROP_CHANCE_BASE;
}

/** HP healed by the orb this enemy drops. */
export function healthOrbAmount(wasBoss: boolean): number {
  return wasBoss ? HEALTH_ORB_AMOUNT_BOSS : HEALTH_ORB_AMOUNT_BASE;
}

/**
 * Gold coin drop chance — bosses always, elites more often than
 * normal enemies. Three authored rates, one branching resolver.
 */
export function goldCoinDropRate(wasBoss: boolean, wasElite: boolean): number {
  if (wasBoss) return GOLD_DROP_CHANCE_BOSS;
  if (wasElite) return GOLD_DROP_CHANCE_ELITE;
  return GOLD_DROP_CHANCE_BASE;
}

/**
 * Inclusive value range for a gold coin drop. Bosses drop bigger
 * coins (5..15) than normal/elite enemies (1..3).
 */
export function goldCoinAmountRange(wasBoss: boolean): readonly [number, number] {
  return wasBoss ? GOLD_COIN_AMOUNT_BOSS : GOLD_COIN_AMOUNT_BASE;
}
