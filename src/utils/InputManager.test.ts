import { describe, expect, it } from 'vitest';
import { clampVectorLength, gamepadStickToMove, mergeMoveVectors, clampJoystickOrigin } from './inputMath';

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

describe('clampJoystickOrigin', () => {
  const viewport = { width: 400, height: 800 };
  const insets = { top: 50, right: 0, bottom: 34, left: 0 };  // iPhone-ish
  const radius = 60;

  it('passes through points already inside the safe region', () => {
    const result = clampJoystickOrigin({ x: 200, y: 400 }, viewport, insets, radius);
    expect(result).toEqual({ x: 200, y: 400 });
  });

  it('clamps points under the notch (top inset)', () => {
    const result = clampJoystickOrigin({ x: 100, y: 20 }, viewport, insets, radius);
    expect(result.y).toBe(50 + 60);
  });

  it('clamps points in the gesture-bar zone (bottom inset)', () => {
    const result = clampJoystickOrigin({ x: 100, y: 790 }, viewport, insets, radius);
    expect(result.y).toBe(800 - 34 - 60);
  });

  it('clamps points off the left edge', () => {
    const result = clampJoystickOrigin({ x: 10, y: 400 }, viewport, insets, radius);
    expect(result.x).toBe(60);
  });

  it('clamps points off the right edge', () => {
    const result = clampJoystickOrigin({ x: 395, y: 400 }, viewport, insets, radius);
    expect(result.x).toBe(340);
  });

  it('handles zero insets (non-notched device)', () => {
    const flat = { top: 0, right: 0, bottom: 0, left: 0 };
    const result = clampJoystickOrigin({ x: 10, y: 10 }, viewport, flat, radius);
    expect(result).toEqual({ x: 60, y: 60 });
  });
});
