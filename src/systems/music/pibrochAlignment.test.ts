import { describe, expect, it } from 'vitest';
import {
  PIBROCH_DAMAGE_MULT,
  PIBROCH_WINDOW_MS,
  applyPibrochDamage,
  isPibrochAligned,
} from './pibrochAlignment';

describe('isPibrochAligned', () => {
  // Period at 100 BPM = 600 ms.
  const PERIOD = 600;

  it('aligns inside the ±window after a downbeat', () => {
    expect(isPibrochAligned(0, PERIOD)).toBe(true);
    expect(isPibrochAligned(50, PERIOD)).toBe(true);
    expect(isPibrochAligned(PIBROCH_WINDOW_MS, PERIOD)).toBe(true);
  });

  it('aligns inside the ±window before the next downbeat (wrap)', () => {
    expect(isPibrochAligned(PERIOD - 1, PERIOD)).toBe(true);
    expect(isPibrochAligned(PERIOD - PIBROCH_WINDOW_MS, PERIOD)).toBe(true);
  });

  it('does not align in the middle of a beat cycle', () => {
    expect(isPibrochAligned(PERIOD / 2, PERIOD)).toBe(false);
    expect(isPibrochAligned(PIBROCH_WINDOW_MS + 1, PERIOD)).toBe(false);
    expect(isPibrochAligned(PERIOD - PIBROCH_WINDOW_MS - 1, PERIOD)).toBe(false);
  });

  it('returns false when the engine is stopped (period <= 0)', () => {
    expect(isPibrochAligned(0, 0)).toBe(false);
    expect(isPibrochAligned(50, -1)).toBe(false);
  });

  it('returns false for malformed inputs (defensive)', () => {
    expect(isPibrochAligned(-10, 600)).toBe(false);
    expect(isPibrochAligned(600, 600)).toBe(false); // out of range
    expect(isPibrochAligned(0, 600, 0)).toBe(false); // zero window
  });

  it('respects custom window override', () => {
    expect(isPibrochAligned(150, PERIOD, 100)).toBe(false);
    expect(isPibrochAligned(150, PERIOD, 200)).toBe(true);
  });
});

describe('applyPibrochDamage', () => {
  it('multiplies damage on aligned hits', () => {
    expect(applyPibrochDamage(10, true)).toBeCloseTo(10 * PIBROCH_DAMAGE_MULT, 5);
    expect(applyPibrochDamage(100, true)).toBeCloseTo(115, 5);
  });

  it('passes damage through unchanged on misaligned hits', () => {
    expect(applyPibrochDamage(10, false)).toBe(10);
    expect(applyPibrochDamage(0, false)).toBe(0);
  });
});
