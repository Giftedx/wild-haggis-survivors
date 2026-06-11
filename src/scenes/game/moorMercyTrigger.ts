/**
 * Pure threshold-crossing check for the Moor Mercy luck grant.
 *
 * Returns true when a damage tick has just dragged the player from above
 * the mercy HP fraction down to or below it, while still alive. The
 * caller is responsible for the once-per-run latch.
 *
 * Defensive zeros: a non-positive maxHp (degenerate) or a non-positive
 * hpAfter (dead — death flow handles it instead) both suppress the
 * trigger so the mercy bonus never lands at the same instant as a
 * game-over.
 */
export function crossesMoorMercyHpFrac(
  hpBefore: number,
  hpAfter: number,
  maxHp: number,
  fracThreshold: number,
): boolean {
  if (maxHp <= 0) return false;
  if (hpAfter <= 0) return false;
  return hpBefore / maxHp > fracThreshold && hpAfter / maxHp <= fracThreshold;
}
