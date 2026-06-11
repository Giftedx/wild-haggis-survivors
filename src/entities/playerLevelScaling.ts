import { PLAYER } from '../config';

/**
 * Pure level-reduction multipliers for player speed and drift.
 *
 * The core fantasy — "the haggis grows fatter, slower, and slightly
 * less crooked as it levels" — is expressed as two linear ramps with
 * floor clamps. Both start at 1.0 on level 1 and reduce by a per-
 * level fraction, bottoming out so the player is never frozen or
 * perfectly straight.
 *
 * Extracted so the ramps read as named pieces of balance instead of
 * inline Math.max ternaries, and so the floor values (0.7 for speed,
 * 0.3 for drift) are unit-testable in one spot.
 */

/** Speed never drops below 70% of the base no matter how high the player levels. */
export const SPEED_FLOOR_MUL = 0.7;
/** Drift never drops below 30% of base — the clockwise pull is part of the identity. */
export const DRIFT_FLOOR_MUL = 0.3;

export function playerLevelSpeedMul(level: number): number {
  return Math.max(SPEED_FLOOR_MUL, 1 - PLAYER.SPEED_REDUCTION_PER_LEVEL * (level - 1));
}

export function playerLevelDriftMul(level: number): number {
  return Math.max(DRIFT_FLOOR_MUL, 1 - PLAYER.DRIFT_REDUCTION_PER_LEVEL * (level - 1));
}
