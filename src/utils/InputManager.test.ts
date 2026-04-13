import { describe, expect, it } from 'vitest';
import { clampVectorLength, gamepadStickToMove, mergeMoveVectors } from './inputMath';

describe('unified movement math', () => {
  it('merges full keyboard + diagonal stick without exceeding unit length', () => {
    const kb = { x: 1, y: 0 };
    const gp = gamepadStickToMove(0, -1, 0);
    const m = mergeMoveVectors(kb, gp, 1);
    expect(Math.hypot(m.x, m.y)).toBeLessThanOrEqual(1 + 1e-6);
  });

  it('normalizes a diagonal raw stick past the unit circle (Steam Deck corner)', () => {
    const v = gamepadStickToMove(1, 1, 0);
    expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1 + 1e-6);
    expect(v.x).toBeCloseTo(Math.SQRT1_2, 5);
    expect(v.y).toBeCloseTo(Math.SQRT1_2, 5);
  });

  it('respects deadzone on analog sticks', () => {
    const v = gamepadStickToMove(0.05, 0.05, 0.22);
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
  });

  it('clampVectorLength caps overshoot', () => {
    const v = clampVectorLength(3, 4, 1);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 5);
  });
});
