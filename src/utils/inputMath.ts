/**
 * Pure movement-vector helpers — shared by InputManager and unit tests.
 * Ensures combined keyboard + analog input stays inside the unit circle (no diagonal speed exploit).
 */

const EPS = 1e-8;

/** Clamp vector length to `maxLen` (default unit circle). */
export function clampVectorLength(
  x: number,
  y: number,
  maxLen: number = 1
): { x: number; y: number } {
  const len = Math.hypot(x, y);
  if (len <= EPS) return { x: 0, y: 0 };
  if (len > maxLen) {
    const s = maxLen / len;
    return { x: x * s, y: y * s };
  }
  return { x, y };
}

/** Merge two move inputs (e.g. keyboard + gamepad) and clamp total length to `maxLen`. */
export function mergeMoveVectors(
  a: { x: number; y: number },
  b: { x: number; y: number },
  maxLen: number = 1
): { x: number; y: number } {
  return clampVectorLength(a.x + b.x, a.y + b.y, maxLen);
}

/**
 * Map raw left-stick axes (typically −1…1) through a radial deadzone, preserve partial magnitude,
 * then clamp to the unit circle so corners stay at length 1.
 */
export function gamepadStickToMove(
  lx: number,
  ly: number,
  deadzone: number = 0.22
): { x: number; y: number } {
  const len = Math.hypot(lx, ly);
  if (len < deadzone) return { x: 0, y: 0 };
  const nx = lx / len;
  const ny = ly / len;
  const mag = Math.min(1, len);
  return clampVectorLength(nx * mag, ny * mag, 1);
}
