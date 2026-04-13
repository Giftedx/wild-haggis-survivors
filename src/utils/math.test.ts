import { describe, it, expect } from 'vitest';
import { rotateVectorIntoPrecomputed } from './math';

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
