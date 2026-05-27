/**
 * Post-Bell escalation — how the moor turns on a victorious haggis.
 *
 * "Bell" is the Taxman kill (the normal victory condition). When the
 * player chooses to keep going afterward, this module produces the
 * multipliers and cadence shifts that make every surviving minute
 * meaningfully harder.
 *
 * Pure functions, no Phaser. Trivially testable — if the curve feels
 * wrong we tune it here without touching the scene.
 */

export interface PostBellMultipliers {
  /** Applied to enemy max HP on spawn. */
  readonly enemyHpMul: number;
  /** Applied to enemy move speed on spawn. */
  readonly enemySpeedMul: number;
  /** Extra simultaneous elite slots beyond the base budget. */
  readonly bonusEliteSlots: number;
  /** Boss spawn cadence in seconds. Falls from 300 → 180 → 120. */
  readonly bossCadenceSec: number;
  /** Chance 0..1 that a spawned enemy becomes "Cursed" (aura + damage bonus). */
  readonly cursedChance: number;
  /**
   * Taxman's Retinue wave cadence in seconds. 0 = inactive (pre-bell).
   * Falls from 90 → 75 → 60 → 45 → 30 across five post-bell steps.
   * Evaluated by `evaluatePostBellRetinueTick` in SpawnSystem.
   */
  readonly retinueCadenceSec: number;
  /**
   * Total enemies in each retinue wave (split ledger_wraith + auditor_priest).
   * 0 = inactive. Grows from 2 → 4 across post-bell steps.
   */
  readonly retinueWaveSize: number;
}

/** Neutral state — what the game uses while still in the normal 20-minute run. */
export const NEUTRAL_POST_BELL: PostBellMultipliers = {
  enemyHpMul: 1,
  enemySpeedMul: 1,
  bonusEliteSlots: 0,
  bossCadenceSec: 300,
  cursedChance: 0,
  retinueCadenceSec: 0,
  retinueWaveSize: 0,
};

/** Hard caps so late-endless doesn't become one-shot-everything-impossible. */
const HP_CAP = 5;
const SPEED_CAP = 1.8;
const CURSED_CAP = 0.4;
const ELITE_CAP = 4;

/**
 * Produce the escalation multipliers for a given number of seconds past
 * the Bell. Step function on 120s intervals — feels more authored than
 * a smooth ramp, and gives players a clear "I survived another wave"
 * beat rather than invisible creep.
 */
export function computePostBellMultipliers(secondsPastBell: number): PostBellMultipliers {
  if (secondsPastBell <= 0) return NEUTRAL_POST_BELL;

  const steps = Math.floor(secondsPastBell / 120);

  const enemyHpMul = Math.min(HP_CAP, Math.pow(1.10, steps));
  const enemySpeedMul = Math.min(SPEED_CAP, Math.pow(1.05, steps));
  const bonusEliteSlots = Math.min(ELITE_CAP, steps);
  // Cursed chance: 0 until first step, then +8% per step, capped.
  const cursedChance = steps === 0 ? 0 : Math.min(CURSED_CAP, 0.08 * steps);

  let bossCadenceSec = 300;
  if (steps >= 2) bossCadenceSec = 180;
  if (steps >= 4) bossCadenceSec = 120;

  // Retinue cadence: 90 → 75 → 60 → 45 → 30 seconds per wave.
  const RETINUE_CADENCES = [90, 75, 60, 45, 30] as const;
  const retinueCadenceSec = RETINUE_CADENCES[Math.min(steps, RETINUE_CADENCES.length - 1)];
  // Retinue wave size: 2 → 2 → 3 → 3 → 4 enemies per wave.
  const RETINUE_WAVE_SIZES = [2, 2, 3, 3, 4] as const;
  const retinueWaveSize = RETINUE_WAVE_SIZES[Math.min(steps, RETINUE_WAVE_SIZES.length - 1)];

  return {
    enemyHpMul,
    enemySpeedMul,
    bonusEliteSlots,
    bossCadenceSec,
    cursedChance,
    retinueCadenceSec,
    retinueWaveSize,
  };
}
