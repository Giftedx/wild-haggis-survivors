import type { ColorblindMode } from '../../core/SettingsManager';

/**
 * A1 M2 — colorblind LUT matrices.
 *
 * Applied via an SVG `<feColorMatrix>` on the canvas element rather
 * than a Phaser shader — see `applyColorblindFilter.ts`. The SVG
 * path covers every rendered pixel across every scene without
 * per-scene wiring, and works the same under Canvas + WebGL.
 *
 * The four non-off modes are classic Brettel / Viénot simulation
 * matrices (rows from published LMS→sRGB inverses). They preview
 * how each tonal palette collapses for players missing the L, M,
 * or S cone — primarily a design-time check. The `monochrome` mode
 * is a luminance-preserving greyscale (Rec. 601 weights), which is
 * meaningful as real accommodation for severe color-vision deficits.
 */

/** Row-major 3×3 — `rgb' = matrix * rgb`. */
export const COLORBLIND_MATRICES: Record<Exclude<ColorblindMode, 'off'>, readonly number[]> = {
  protanopia: [
    0.567, 0.433, 0.0,
    0.558, 0.442, 0.0,
    0.0,   0.242, 0.758,
  ],
  deuteranopia: [
    0.625, 0.375, 0.0,
    0.7,   0.3,   0.0,
    0.0,   0.3,   0.7,
  ],
  tritanopia: [
    0.95,  0.05,  0.0,
    0.0,   0.433, 0.567,
    0.0,   0.475, 0.525,
  ],
  monochrome: [
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
    0.299, 0.587, 0.114,
  ],
};

/**
 * Convert a 3×3 row-major matrix into the 20-value feColorMatrix
 * `values=` attribute shape: four rows of five (R, G, B, A, offset).
 * Alpha row passes through unchanged; offsets are zero.
 */
export function matrixToFeColorMatrixValues(m: readonly number[]): string {
  if (m.length !== 9) throw new Error('matrixToFeColorMatrixValues expects a 9-element 3×3 matrix');
  return [
    m[0], m[1], m[2], 0, 0,
    m[3], m[4], m[5], 0, 0,
    m[6], m[7], m[8], 0, 0,
    0,    0,    0,    1, 0,
  ].join(' ');
}
