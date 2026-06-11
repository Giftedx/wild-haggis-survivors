import { describe, expect, it } from 'vitest';
import { euclidean, percussionKickHatGainScales } from './PercussionLayer';

// ---------------------------------------------------------------------------
// euclidean — Bjorklund rhythm distribution
// ---------------------------------------------------------------------------

describe('euclidean', () => {
  it('returns all false for 0 hits', () => {
    const result = euclidean(0, 8);
    expect(result).toHaveLength(8);
    expect(result.every((v) => v === false)).toBe(true);
  });

  it('returns all true when hits equal slots', () => {
    const result = euclidean(8, 8);
    expect(result).toHaveLength(8);
    expect(result.every((v) => v === true)).toBe(true);
  });

  it('returns all true when hits exceed slots', () => {
    const result = euclidean(12, 8);
    expect(result).toHaveLength(8);
    expect(result.every((v) => v === true)).toBe(true);
  });

  it('always returns an array of length equal to slots', () => {
    for (const [hits, slots] of [[1, 4], [2, 8], [3, 16], [5, 7]] as [number, number][]) {
      expect(euclidean(hits, slots)).toHaveLength(slots);
    }
  });

  it('returns exactly `hits` true values (when hits < slots)', () => {
    for (const [hits, slots] of [[1, 4], [2, 8], [3, 8], [5, 8]] as [number, number][]) {
      const result = euclidean(hits, slots);
      expect(result.filter(Boolean)).toHaveLength(hits);
    }
  });

  it('euclidean(1, 4) places hit at index 0', () => {
    const result = euclidean(1, 4);
    expect(result[0]).toBe(true);
    expect(result.slice(1).every((v) => !v)).toBe(true);
  });

  it('euclidean(2, 4) distributes hits evenly — alternating', () => {
    const result = euclidean(2, 4);
    expect(result[0]).toBe(true);
    expect(result[2]).toBe(true);
    expect(result[1]).toBe(false);
    expect(result[3]).toBe(false);
  });

  it('euclidean(3, 8) distributes 3 hits across 8 slots', () => {
    const result = euclidean(3, 8);
    expect(result).toHaveLength(8);
    expect(result.filter(Boolean)).toHaveLength(3);
    // This implementation produces hits at 0, 2, 4 (Bjorklund front-loaded variant)
    expect(result[0]).toBe(true);
    expect(result[2]).toBe(true);
    expect(result[4]).toBe(true);
  });

  it('euclidean(5, 8) distributes 5 hits — standard clave-adjacent pattern', () => {
    const result = euclidean(5, 8);
    expect(result).toHaveLength(8);
    expect(result.filter(Boolean)).toHaveLength(5);
  });

  it('euclidean(4, 8) distributes hits at even intervals', () => {
    const result = euclidean(4, 8);
    expect(result[0]).toBe(true);
    expect(result[2]).toBe(true);
    expect(result[4]).toBe(true);
    expect(result[6]).toBe(true);
    expect(result[1]).toBe(false);
    expect(result[3]).toBe(false);
  });

  it('is idempotent — same inputs always produce same pattern', () => {
    const a = euclidean(5, 13);
    const b = euclidean(5, 13);
    expect(a).toEqual(b);
  });
});

// ---------------------------------------------------------------------------
// percussionKickHatGainScales
// ---------------------------------------------------------------------------

describe('percussionKickHatGainScales', () => {
  it('returns kick = 1.0 and hat = 1.0 at pulse count 1', () => {
    const { kick, hat } = percussionKickHatGainScales(1);
    expect(kick).toBeCloseTo(1.0);
    expect(hat).toBeCloseTo(1.0);
  });

  it('returns defined kick and hat for all pulse counts 1–8', () => {
    for (let n = 1; n <= 8; n++) {
      const { kick, hat } = percussionKickHatGainScales(n);
      expect(typeof kick).toBe('number');
      expect(typeof hat).toBe('number');
      expect(kick).toBeGreaterThan(0);
      expect(hat).toBeGreaterThan(0);
    }
  });

  it('kick and hat values decrease as pulse count increases (higher density = softer)', () => {
    const low = percussionKickHatGainScales(1);
    const high = percussionKickHatGainScales(8);
    expect(low.kick).toBeGreaterThan(high.kick);
    expect(low.hat).toBeGreaterThan(high.hat);
  });

  it('clamps pulse count below 1 to 1', () => {
    expect(percussionKickHatGainScales(0)).toEqual(percussionKickHatGainScales(1));
    expect(percussionKickHatGainScales(-5)).toEqual(percussionKickHatGainScales(1));
  });

  it('clamps pulse count above 8 to 8', () => {
    expect(percussionKickHatGainScales(9)).toEqual(percussionKickHatGainScales(8));
    expect(percussionKickHatGainScales(100)).toEqual(percussionKickHatGainScales(8));
  });

  it('rounds fractional pulse counts to nearest integer', () => {
    expect(percussionKickHatGainScales(3.4)).toEqual(percussionKickHatGainScales(3));
    expect(percussionKickHatGainScales(3.6)).toEqual(percussionKickHatGainScales(4));
  });

  it('returns expected kick value at pulse count 4', () => {
    const { kick } = percussionKickHatGainScales(4);
    expect(kick).toBeCloseTo(0.72);
  });

  it('returns expected hat value at pulse count 6', () => {
    const { hat } = percussionKickHatGainScales(6);
    expect(hat).toBeCloseTo(0.55);
  });
});
