/**
 * Pure XP curve calculator — single source of truth for "how much XP
 * does the next level need".
 *
 * Formula: ceil(BASE_REQUIREMENT × SCALING_FACTOR^(level-2))
 *   - level 2 = ceil(BASE_REQUIREMENT × 1) = BASE_REQUIREMENT (12)
 *   - level 3 = BASE_REQUIREMENT × 1.17 → 15
 *   - level N = exponential ramp up to MAX_LEVEL (30)
 *
 * Extracted from XPSystem so the curve shape is unit-testable. A
 * silent SCALING_FACTOR drift would otherwise show up only as
 * mid-run pacing feel — much harder to catch in review.
 */
import { XP } from '../config';

/**
 * XP needed to advance from `level - 1` to `level`. Defined for
 * level 2..MAX_LEVEL; returns 0 for level <= 1 (no XP required to
 * be at level 1, the starting state).
 */
export function xpRequiredForLevel(level: number): number {
  const L = Math.floor(level);
  if (L <= 1) return 0;
  return Math.ceil(XP.BASE_REQUIREMENT * Math.pow(XP.SCALING_FACTOR, L - 2));
}

/**
 * Total cumulative XP a fresh-from-level-1 run must collect to reach
 * `targetLevel`. Sums xpRequiredForLevel from 2..targetLevel.
 */
export function totalXpToReachLevel(targetLevel: number): number {
  const T = Math.floor(targetLevel);
  if (T <= 1) return 0;
  let sum = 0;
  for (let L = 2; L <= T; L++) {
    sum += xpRequiredForLevel(L);
  }
  return sum;
}
