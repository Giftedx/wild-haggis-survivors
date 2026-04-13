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
