import { describe, it, expect } from 'vitest';
import { COLORBLIND_MATRICES, matrixToFeColorMatrixValues } from './colorblindMatrices';

describe('colorblind matrices', () => {
  it.each(['protanopia', 'deuteranopia', 'tritanopia', 'monochrome'] as const)(
    '%s has a 9-element matrix',
    (mode) => {
      expect(COLORBLIND_MATRICES[mode].length).toBe(9);
    }
  );

  it('monochrome matrix rows are identical (grayscale)', () => {
    const m = COLORBLIND_MATRICES.monochrome;
    expect(m.slice(0, 3)).toEqual(m.slice(3, 6));
    expect(m.slice(3, 6)).toEqual(m.slice(6, 9));
  });
});

describe('matrixToFeColorMatrixValues', () => {
  it('expands a 3×3 matrix into the 20-slot RGBA+offset shape', () => {
    const m = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    const s = matrixToFeColorMatrixValues(m);
    expect(s.split(' ').length).toBe(20);
    expect(s).toBe([
      '1 0 0 0 0',
      '0 1 0 0 0',
      '0 0 1 0 0',
      '0 0 0 1 0',
    ].join(' '));
  });

  it('throws on non-9-element input', () => {
    expect(() => matrixToFeColorMatrixValues([1, 2, 3])).toThrow(/9-element/);
  });

  it('produces the expected string for the deuteranopia matrix', () => {
    const s = matrixToFeColorMatrixValues(COLORBLIND_MATRICES.deuteranopia);
    const parts = s.split(' ');
    // Row 2: 0.7, 0.3, 0 — M-cone absent → green row redirects through R.
    expect(Number(parts[5])).toBe(0.7);
    expect(Number(parts[6])).toBe(0.3);
    expect(Number(parts[8])).toBe(0);
  });
});
