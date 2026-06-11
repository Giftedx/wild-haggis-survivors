/**
 * Phase B Endless — pure helper for the post-bell biome re-seed cadence.
 *
 * Spec §"Escalation": *"Biome re-seed every 3 min (voronoi regenerates
 * from new seeds; old regions fade out)."*
 *
 * Pure so the gameplay decision can be vitested without Phaser. The
 * actual re-seed lives on `BiomeController.reseed`.
 */

/** Minimum seconds between biome re-seeds in post-bell. */
export const POST_BELL_RESEED_INTERVAL_SEC = 180;

/**
 * True iff a re-seed should happen on this tick. `lastReseedAtSec` is
 * the post-bell-relative seconds at which the last re-seed fired (0 = no
 * re-seed yet — first window opens at INTERVAL_SEC after the bell).
 */
export function shouldReseedAtSec(
  secondsPastBell: number,
  lastReseedAtSec: number,
  intervalSec: number = POST_BELL_RESEED_INTERVAL_SEC,
): boolean {
  if (secondsPastBell <= 0) return false;
  return secondsPastBell - lastReseedAtSec >= intervalSec;
}
