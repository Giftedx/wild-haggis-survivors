import { describe, it, expect } from 'vitest';
import { clampVectorLength, mergeMoveVectors, gamepadStickToMove } from './inputMath';

const EPSILON = 1e-6;

function expectVec(v: { x: number; y: number }, ex: number, ey: number) {
  expect(v.x).toBeCloseTo(ex, 5);
  expect(v.y).toBeCloseTo(ey, 5);
}

function vecLen(v: { x: number; y: number }): number {
  return Math.hypot(v.x, v.y);
}

describe('clampVectorLength', () => {
  it('returns zero for zero input', () => {
    expectVec(clampVectorLength(0, 0), 0, 0);
  });

  it('returns zero for sub-epsilon input', () => {
    expectVec(clampVectorLength(1e-10, 1e-10), 0, 0);
  });

  it('passes through vector within max length', () => {
    expectVec(clampVectorLength(0.5, 0.3), 0.5, 0.3);
  });

  it('clamps diagonal to unit circle', () => {
    const v = clampVectorLength(1, 1);
    expect(vecLen(v)).toBeCloseTo(1, 5);
    expect(v.x).toBeCloseTo(v.y, 5);
  });

  it('clamps to custom max length', () => {
    const v = clampVectorLength(3, 4, 2);
    expect(vecLen(v)).toBeCloseTo(2, 5);
    expect(v.x).toBeCloseTo(3 / 5 * 2, 5);
    expect(v.y).toBeCloseTo(4 / 5 * 2, 5);
  });

  it('preserves direction when clamping', () => {
    const v = clampVectorLength(0, -5, 1);
    expectVec(v, 0, -1);
  });
});

describe('mergeMoveVectors', () => {
  it('adds two vectors and clamps', () => {
    const v = mergeMoveVectors({ x: 0.7, y: 0 }, { x: 0.7, y: 0 });
    expect(vecLen(v)).toBeCloseTo(1, 5);
    expectVec(v, 1, 0);
  });

  it('returns sum when within max', () => {
    const v = mergeMoveVectors({ x: 0.2, y: 0 }, { x: 0.1, y: 0.3 });
    expectVec(v, 0.3, 0.3);
  });

  it('handles opposing vectors (cancel out)', () => {
    const v = mergeMoveVectors({ x: 1, y: 0 }, { x: -1, y: 0 });
    expectVec(v, 0, 0);
  });

  it('respects custom maxLen', () => {
    const v = mergeMoveVectors({ x: 3, y: 0 }, { x: 3, y: 0 }, 2);
    expect(vecLen(v)).toBeCloseTo(2, 5);
    expectVec(v, 2, 0);
  });
});

describe('gamepadStickToMove', () => {
  it('returns zero inside deadzone', () => {
    expectVec(gamepadStickToMove(0.1, 0.1), 0, 0);
  });

  it('returns zero at exactly deadzone boundary', () => {
    const dz = 0.22;
    expectVec(gamepadStickToMove(dz * 0.99, 0), 0, 0);
  });

  it('returns non-zero just past deadzone', () => {
    const v = gamepadStickToMove(0.3, 0);
    expect(v.x).toBeGreaterThan(0);
    expect(v.y).toBeCloseTo(0, 5);
    expect(vecLen(v)).toBeLessThanOrEqual(1 + EPSILON);
  });

  it('clamps corner (1,1) to unit circle', () => {
    const v = gamepadStickToMove(1, 1);
    expect(vecLen(v)).toBeCloseTo(1, 5);
  });

  it('preserves full-tilt magnitude on axis', () => {
    const v = gamepadStickToMove(1, 0);
    expect(vecLen(v)).toBeCloseTo(1, 5);
    expectVec(v, 1, 0);
  });

  it('handles negative axes', () => {
    const v = gamepadStickToMove(-0.8, -0.6);
    expect(v.x).toBeLessThan(0);
    expect(v.y).toBeLessThan(0);
    expect(vecLen(v)).toBeLessThanOrEqual(1 + EPSILON);
  });

  it('uses custom deadzone', () => {
    expectVec(gamepadStickToMove(0.4, 0, 0.5), 0, 0);
    const v = gamepadStickToMove(0.6, 0, 0.5);
    expect(v.x).toBeGreaterThan(0);
  });

  it.each(
    [-1, -0.5, 0, 0.5, 1].flatMap((lx) =>
      [-1, -0.5, 0, 0.5, 1].map((ly) => [lx, ly] as const)
    )
  )('magnitude ≤ 1 for stick position (%s, %s)', (lx, ly) => {
    expect(vecLen(gamepadStickToMove(lx, ly))).toBeLessThanOrEqual(1 + EPSILON);
  });
});
