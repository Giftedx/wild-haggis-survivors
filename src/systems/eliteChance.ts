import { BALANCE } from '../core/BalanceConfig';

/**
 * Pure resolver for the elite-enemy spawn roll probability.
 *
 * Blends three inputs into a single [0, ELITE_CHANCE_CAP] chance:
 *  - The base elite rate from BALANCE.enemy.ELITE_SPAWN_CHANCE (10%).
 *  - The "kill pressure" nudge — rewards players who are clearing fast
 *    with slightly more elites (caps at killPressureEliteBonusMax).
 *  - A run-scoped eliteWeightMultiplier from the W2 Moor Road route
 *    picks (some branches tilt elite frequency up or down).
 *
 * The cap at 24% prevents runaway stacking if all three sources spike
 * at once — past that, an elite-heavy run stops feeling varied and
 * starts feeling like an elite-only run.
 */

/**
 * Absolute upper bound on elite chance, regardless of pressure /
 * route stacking. 24% keeps regular-elite variety readable.
 */
export const ELITE_CHANCE_CAP = 0.24;

export function resolveEliteChance(
  killPressure: number,
  eliteWeightMultiplier: number,
): number {
  const raw =
    (BALANCE.enemy.ELITE_SPAWN_CHANCE +
      killPressure * BALANCE.director.killPressureEliteBonusMax) *
    eliteWeightMultiplier;
  return Math.min(ELITE_CHANCE_CAP, raw);
}
