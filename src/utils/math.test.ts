import { describe, it, expect } from 'vitest';
import { rotateVectorIntoPrecomputed, clamp01, clamp } from './math';

function expectVec(v: { x: number; y: number }, ex: number, ey: number) {
  expect(v.x).toBeCloseTo(ex, 8);
  expect(v.y).toBeCloseTo(ey, 8);
}

describe('rotateVectorIntoPrecomputed', () => {
  it('identity rotation (0 deg) preserves vector', () => {
    const out = { x: 0, y: 0 };
    const r = rotateVectorIntoPrecomputed(out, 3, 4, Math.cos(0), Math.sin(0));
    expectVec(r, 3, 4);
    expect(r).toBe(out);
  });

  it('90 deg CCW rotates (1,0) to (0,1)', () => {
    const out = { x: 0, y: 0 };
    const angle = Math.PI / 2;
    rotateVectorIntoPrecomputed(out, 1, 0, Math.cos(angle), Math.sin(angle));
    expectVec(out, 0, 1);
  });

  it('90 deg CCW rotates (0,1) to (-1,0)', () => {
    const out = { x: 0, y: 0 };
    const angle = Math.PI / 2;
    rotateVectorIntoPrecomputed(out, 0, 1, Math.cos(angle), Math.sin(angle));
    expectVec(out, -1, 0);
  });

  it('180 deg negates vector', () => {
    const out = { x: 0, y: 0 };
    const angle = Math.PI;
    rotateVectorIntoPrecomputed(out, 2, 3, Math.cos(angle), Math.sin(angle));
    expectVec(out, -2, -3);
  });

  it('negative angle rotates clockwise', () => {
    const out = { x: 0, y: 0 };
    const angle = -Math.PI / 2;
    rotateVectorIntoPrecomputed(out, 1, 0, Math.cos(angle), Math.sin(angle));
    expectVec(out, 0, -1);
  });

  it('preserves vector length', () => {
    const out = { x: 0, y: 0 };
    const angle = 0.7;
    rotateVectorIntoPrecomputed(out, 3, 4, Math.cos(angle), Math.sin(angle));
    expect(Math.hypot(out.x, out.y)).toBeCloseTo(5, 8);
  });

  it('zero vector stays zero regardless of angle', () => {
    const out = { x: 0, y: 0 };
    rotateVectorIntoPrecomputed(out, 0, 0, Math.cos(1.5), Math.sin(1.5));
    expectVec(out, 0, 0);
  });

  it('mutates and returns out param', () => {
    const out = { x: 99, y: 99 };
    const r = rotateVectorIntoPrecomputed(out, 1, 0, 1, 0);
    expect(r).toBe(out);
    expectVec(out, 1, 0);
  });
});

describe('clamp01', () => {
  it('values in [0, 1] pass through unchanged', () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(0.5)).toBe(0.5);
    expect(clamp01(1)).toBe(1);
  });

  it('negative values clamp to 0', () => {
    expect(clamp01(-0.1)).toBe(0);
    expect(clamp01(-1000)).toBe(0);
  });

  it('values above 1 clamp to 1', () => {
    expect(clamp01(1.0001)).toBe(1);
    expect(clamp01(9999)).toBe(1);
  });

  it('edges are inclusive', () => {
    expect(clamp01(0)).toBe(0);
    expect(clamp01(1)).toBe(1);
  });

  it('matches the Math.max(0, Math.min(1, x)) pattern for normal inputs', () => {
    for (const x of [-5, -1, -0.5, 0, 0.25, 0.5, 0.75, 1, 1.5, 10]) {
      expect(clamp01(x)).toBe(Math.max(0, Math.min(1, x)));
    }
  });

  it('NaN stays NaN (matches the old pattern)', () => {
    expect(Number.isNaN(clamp01(NaN))).toBe(true);
  });
});

describe('clamp', () => {
  it('values in [lo, hi] pass through', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(0, 0, 10)).toBe(0);
    expect(clamp(10, 0, 10)).toBe(10);
  });

  it('below-lo clamps to lo', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('above-hi clamps to hi', () => {
    expect(clamp(999, 0, 10)).toBe(10);
  });

  it('supports negative ranges', () => {
    expect(clamp(-5, -10, -1)).toBe(-5);
    expect(clamp(-100, -10, -1)).toBe(-10);
    expect(clamp(50, -10, -1)).toBe(-1);
  });

  it('clamp(x, 0, 1) matches clamp01(x)', () => {
    for (const x of [-1, 0, 0.25, 0.75, 1, 2]) {
      expect(clamp(x, 0, 1)).toBe(clamp01(x));
    }
  });
});
