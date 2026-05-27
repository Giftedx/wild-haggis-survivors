/**
 * Post-Bell Retinue cadence — pure helper for Taxman's Retinue wave
 * scheduling (DESIGN_IDEAS §3 — Taxman's Retinue post-bell).
 *
 * After the Taxman falls (the bell), his accounting team continues to
 * clock in on schedule. `evaluatePostBellRetinueTick` decides whether
 * a retinue wave is due on this tick and returns the next-due anchor.
 *
 * Sister to `postBellBossCadence.ts`. No `bossCurrentlyActive` guard —
 * retinue waves spawn even alongside a post-bell boss respawn to compound
 * pressure (the bureaucracy never yields, regardless of what else is
 * happening on the moor).
 *
 * Pure — no Phaser, no scene state. Trivially testable.
 */

export interface PostBellRetinueSchedule {
  /** Should a retinue wave spawn on this tick? */
  readonly due: boolean;
  /** Game-time seconds after which the next retinue tick can fire. */
  readonly nextDueSec: number;
}

/**
 * Decide whether a retinue wave is due, and compute the next scheduled time.
 *
 * `lastSpawnSec` is anchored to the bell time on first call (same pattern
 * as `evaluatePostBellBossTick`). `cadenceSec` = 0 means "retinue inactive"
 * — used by `NEUTRAL_POST_BELL` (pre-bell state).
 */
export function evaluatePostBellRetinueTick(
  gameTimeSec: number,
  lastSpawnSec: number,
  cadenceSec: number,
): PostBellRetinueSchedule {
  if (cadenceSec <= 0) {
    return { due: false, nextDueSec: lastSpawnSec + Math.max(30, cadenceSec) };
  }
  const nextDueSec = lastSpawnSec + cadenceSec;
  return {
    due: gameTimeSec >= nextDueSec,
    nextDueSec,
  };
}
