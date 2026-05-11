import { describe, it, expect } from 'vitest';
import {
  PIBROCH_ALIGNED_MULT,
  PIBROCH_CRESCENDO_MULT,
  PIBROCH_CRESCENDO_PERIOD,
  WAULKING_ALIGNED_MULT,
  WAULKING_WINDOW_MS,
  applyPibrochHammerRhythm,
  applyWaulkingRhythm,
  isWaulkingBeatAligned,
} from './waulkingRhythm';

describe('applyWaulkingRhythm', () => {
  it('returns damage unchanged when not aligned', () => {
    expect(applyWaulkingRhythm(10, false)).toBe(10);
  });

  it('boosts damage by the aligned multiplier when on a beat', () => {
    expect(applyWaulkingRhythm(10, true)).toBeCloseTo(10 * WAULKING_ALIGNED_MULT);
  });

  it('never returns less than baseline damage', () => {
    expect(applyWaulkingRhythm(7, false)).toBeGreaterThanOrEqual(7);
    expect(applyWaulkingRhythm(7, true)).toBeGreaterThan(7);
  });
});

describe('isWaulkingBeatAligned', () => {
  // Choose a period that makes the boundary math obvious.
  const period = 600; // 100 BPM quarter note ≈ 600 ms.

  it('returns false when the engine is stopped (period <= 0)', () => {
    expect(isWaulkingBeatAligned(50, 0)).toBe(false);
    expect(isWaulkingBeatAligned(50, -1)).toBe(false);
  });

  it('returns false for non-finite inputs (mute / blocked audio)', () => {
    expect(isWaulkingBeatAligned(Number.NaN, period)).toBe(false);
    expect(isWaulkingBeatAligned(50, Number.NaN)).toBe(false);
  });

  it('aligns within the window after a beat', () => {
    expect(isWaulkingBeatAligned(0, period)).toBe(true);
    expect(isWaulkingBeatAligned(WAULKING_WINDOW_MS - 1, period)).toBe(true);
  });

  it('aligns within the window before the next beat', () => {
    expect(isWaulkingBeatAligned(period - 1, period)).toBe(true);
    expect(isWaulkingBeatAligned(period - WAULKING_WINDOW_MS, period)).toBe(true);
  });

  it('misses outside the window', () => {
    expect(isWaulkingBeatAligned(period / 2, period)).toBe(false);
    expect(isWaulkingBeatAligned(WAULKING_WINDOW_MS + 10, period)).toBe(false);
  });

  it('rejects ms outside [0, periodMs)', () => {
    expect(isWaulkingBeatAligned(-5, period)).toBe(false);
    expect(isWaulkingBeatAligned(period, period)).toBe(false);
    expect(isWaulkingBeatAligned(period + 50, period)).toBe(false);
  });
});

describe('Waulking Mallet fallback behaviour', () => {
  it('mute-audio path collapses to baseline damage', () => {
    // Engine returning period 0 means alignment is always false; the
    // weapon should still output its rolled damage.
    const aligned = isWaulkingBeatAligned(50, 0);
    expect(aligned).toBe(false);
    expect(applyWaulkingRhythm(20, aligned)).toBe(20);
  });
});

describe('applyPibrochHammerRhythm', () => {
  it('returns baseline damage when not aligned', () => {
    expect(applyPibrochHammerRhythm(10, false, 0)).toBe(10);
    expect(applyPibrochHammerRhythm(10, false, 1)).toBe(10);
    expect(applyPibrochHammerRhythm(10, false, 99)).toBe(10);
  });

  it('applies the aligned multiplier on non-crescendo beats', () => {
    expect(applyPibrochHammerRhythm(10, true, 1)).toBeCloseTo(10 * PIBROCH_ALIGNED_MULT);
    expect(applyPibrochHammerRhythm(10, true, 2)).toBeCloseTo(10 * PIBROCH_ALIGNED_MULT);
    expect(applyPibrochHammerRhythm(10, true, 3)).toBeCloseTo(10 * PIBROCH_ALIGNED_MULT);
  });

  it('applies the crescendo multiplier on every fourth beat', () => {
    expect(applyPibrochHammerRhythm(10, true, 0)).toBeCloseTo(10 * PIBROCH_CRESCENDO_MULT);
    expect(applyPibrochHammerRhythm(10, true, PIBROCH_CRESCENDO_PERIOD)).toBeCloseTo(
      10 * PIBROCH_CRESCENDO_MULT,
    );
    expect(applyPibrochHammerRhythm(10, true, PIBROCH_CRESCENDO_PERIOD * 3)).toBeCloseTo(
      10 * PIBROCH_CRESCENDO_MULT,
    );
  });

  it('falls through to baseline on malformed beat indices', () => {
    expect(applyPibrochHammerRhythm(10, true, Number.NaN)).toBeCloseTo(10 * PIBROCH_ALIGNED_MULT);
    expect(applyPibrochHammerRhythm(10, true, -1)).toBeCloseTo(10 * PIBROCH_ALIGNED_MULT);
  });

  it('never reduces damage below baseline', () => {
    expect(applyPibrochHammerRhythm(7, true, 0)).toBeGreaterThan(7);
    expect(applyPibrochHammerRhythm(7, true, 1)).toBeGreaterThan(7);
    expect(applyPibrochHammerRhythm(7, false, 0)).toBeGreaterThanOrEqual(7);
  });

  it('crescendo > aligned > baseline', () => {
    const baseline = applyPibrochHammerRhythm(10, false, 0);
    const aligned = applyPibrochHammerRhythm(10, true, 1);
    const crescendo = applyPibrochHammerRhythm(10, true, 0);
    expect(crescendo).toBeGreaterThan(aligned);
    expect(aligned).toBeGreaterThan(baseline);
  });
});
