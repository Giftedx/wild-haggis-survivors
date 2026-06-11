/**
 * Phase B Endless — pure helper for post-bell boss respawn cadence.
 *
 * `computePostBellMultipliers().bossCadenceSec` shrinks from 300 → 180 →
 * 120 as the run progresses past the bell. This helper decides whether
 * the next post-bell boss tick is due and computes the next-due time.
 *
 * Pure so the gameplay decision can be vitested without Phaser. The
 * actual spawn lives in SpawnSystem.tickPostBellBoss.
 */

export interface PostBellBossSchedule {
  /** Should a boss spawn on this tick? */
  readonly due: boolean;
  /** Game-time seconds after which the next boss tick can fire. */
  readonly nextDueSec: number;
}

/**
 * Decide whether a post-bell boss respawn is due, and compute the next
 * scheduled time.
 *
 * `lastSpawnSec` is the game-time of the most recent post-bell boss spawn
 * (initialised to `bellTimeSec` so the first respawn fires `cadence` seconds
 * after the bell, not on the very next tick). `cadenceSec` is read from
 * the post-bell multipliers and shrinks over time.
 */
export function evaluatePostBellBossTick(
  gameTimeSec: number,
  lastSpawnSec: number,
  cadenceSec: number,
  bossCurrentlyActive: boolean,
): PostBellBossSchedule {
  if (cadenceSec <= 0) {
    return { due: false, nextDueSec: lastSpawnSec + Math.max(60, cadenceSec) };
  }
  const nextDueSec = lastSpawnSec + cadenceSec;
  // Guard rail: never stack a respawn on top of a still-living boss; wait
  // for the kill before the cadence resumes.
  if (bossCurrentlyActive) {
    return { due: false, nextDueSec };
  }
  return {
    due: gameTimeSec >= nextDueSec,
    nextDueSec,
  };
}
