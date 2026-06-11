/**
 * Pure boss-HP time-scaling formula.
 *
 * Bosses spawned after the 5-minute mark gain HP linearly with
 * elapsed time so they keep feeling meaty as the player's DPS ramps.
 * Below 5 minutes the scale is exactly 1.0 (no change). Above, each
 * extra second adds 0.2% — a boss at minute 10 has 1.6× HP, minute 15
 * has 2.2×, and so on. Separate from the generic per-minute HP curve
 * applied to trash enemies.
 */

/** Grace period (seconds) — no boss HP scaling before this point. */
export const BOSS_HP_SCALE_GRACE_SEC = 300;
/** HP multiplier gained per second past the grace period. */
export const BOSS_HP_SCALE_PER_SEC = 0.002;

export function bossHpTimeScale(gameTimeSec: number): number {
  return 1 + Math.max(0, (gameTimeSec - BOSS_HP_SCALE_GRACE_SEC) * BOSS_HP_SCALE_PER_SEC);
}
