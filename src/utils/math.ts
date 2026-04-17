/**
 * Hot-path 2D rotation with pre-baked cos/sin. Used when the rotation angle
 * is constant across many calls (e.g., the player's drift, which only
 * changes on recalcStats). Per-frame work collapses to four multiplies and
 * two adds — `Math.cos`/`Math.sin` only fire when the angle actually changes.
 */
export function rotateVectorIntoPrecomputed(
  out: { x: number; y: number },
  x: number,
  y: number,
  cos: number,
  sin: number
): { x: number; y: number } {
  out.x = x * cos - y * sin;
  out.y = x * sin + y * cos;
  return out;
}

/**
 * Clamp a value to the closed [0, 1] range. Replaces the
 * `Math.max(0, Math.min(1, x))` pattern that was duplicated across
 * volume mixers, HP fractions, fade progress, and cooldown
 * normalisers. NaN inputs stay NaN (Math.max/min already do that);
 * callers needing a default should handle it before calling.
 */
export function clamp01(x: number): number {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

/**
 * Clamp a value to the closed [lo, hi] range. The two-argument
 * ceiling + floor variants were private helpers in menuLayout and
 * nearbySpawn — sharing here lets any pure layout / pickup module
 * reach for the same one.
 */
export function clamp(v: number, lo: number, hi: number): number {
  if (v < lo) return lo;
  if (v > hi) return hi;
  return v;
}
