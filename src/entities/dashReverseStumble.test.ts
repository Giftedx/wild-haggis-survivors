import { describe, expect, it } from 'vitest';
import {
  DASH_REVERSE_DOT_THRESHOLD,
  DASH_REVERSE_WINDOW_MS,
  STUMBLE_DURATION_MS,
  STUMBLE_SPEED_MUL,
  detectDashReverse,
} from './dashReverseStumble';

const baseInput = {
  prevDir: { x: 1, y: 0 },
  prevDashTimeMs: 0,
  newDir: { x: -1, y: 0 },
  currentTimeMs: 500,
};

describe('detectDashReverse', () => {
  it('returns false when no prior dash exists', () => {
    expect(detectDashReverse({ ...baseInput, prevDir: null })).toBe(false);
    expect(detectDashReverse({ ...baseInput, prevDashTimeMs: null })).toBe(false);
  });

  it('returns true on a clean 180° reverse within the window', () => {
    expect(detectDashReverse(baseInput)).toBe(true);
  });

  it('returns false for forward / same-direction dashes', () => {
    expect(detectDashReverse({
      ...baseInput,
      newDir: { x: 1, y: 0 },
    })).toBe(false);
  });

  it('returns false for perpendicular dashes (dot ≈ 0)', () => {
    expect(detectDashReverse({
      ...baseInput,
      newDir: { x: 0, y: 1 },
    })).toBe(false);
  });

  it('fires on a 135° turn (well past the threshold)', () => {
    // (1,0) → (-0.707, 0.707) gives dot ≈ -0.707 < -0.3.
    expect(detectDashReverse({
      ...baseInput,
      newDir: { x: -Math.SQRT1_2, y: Math.SQRT1_2 },
    })).toBe(true);
  });

  it('does NOT fire on a wide arc (~108°, just under threshold)', () => {
    // Choose a turn just shy of -0.3 dot: cos(theta) where theta ≈ 100°.
    const theta = Math.PI * (100 / 180);
    expect(detectDashReverse({
      ...baseInput,
      newDir: { x: Math.cos(theta), y: Math.sin(theta) },
    })).toBe(false);
  });

  it('returns false when the prior dash was longer ago than the window', () => {
    expect(detectDashReverse({
      ...baseInput,
      currentTimeMs: DASH_REVERSE_WINDOW_MS + 1,
    })).toBe(false);
  });

  it('returns false on negative elapsed (clock went backwards — defensive)', () => {
    expect(detectDashReverse({
      ...baseInput,
      prevDashTimeMs: 1000,
      currentTimeMs: 500,
    })).toBe(false);
  });

  it('returns false on zero-length newDir or prevDir (defensive)', () => {
    expect(detectDashReverse({
      ...baseInput,
      newDir: { x: 0, y: 0 },
    })).toBe(false);
    expect(detectDashReverse({
      ...baseInput,
      prevDir: { x: 0, y: 0 },
    })).toBe(false);
  });

  it('normalises non-unit input vectors', () => {
    expect(detectDashReverse({
      ...baseInput,
      prevDir: { x: 5, y: 0 },     // length 5
      newDir: { x: -100, y: 0 },   // length 100
    })).toBe(true);
  });

  it('exposes constants the Player wiring uses', () => {
    expect(DASH_REVERSE_WINDOW_MS).toBeGreaterThan(0);
    expect(DASH_REVERSE_DOT_THRESHOLD).toBeLessThan(0);
    expect(STUMBLE_DURATION_MS).toBeGreaterThan(0);
    expect(STUMBLE_SPEED_MUL).toBeLessThan(1);
    expect(STUMBLE_SPEED_MUL).toBeGreaterThan(0);
  });
});
