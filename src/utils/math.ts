/**
 * Rotate a 2D vector by an angle in degrees.
 * Used for the "uneven legs" drift mechanic.
 */
export function rotateVector(
  x: number,
  y: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = angleDeg * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: x * cos - y * sin,
    y: x * sin + y * cos,
  };
}

/** Hot-path: writes into `out` to avoid per-frame object allocation. */
export function rotateVectorInto(
  out: { x: number; y: number },
  x: number,
  y: number,
  angleDeg: number
): { x: number; y: number } {
  const rad = angleDeg * (Math.PI / 180);
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  out.x = x * cos - y * sin;
  out.y = x * sin + y * cos;
  return out;
}
