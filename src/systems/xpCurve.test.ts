import { describe, expect, it } from 'vitest';
import { totalXpToReachLevel, xpRequiredForLevel } from './xpCurve';
import { XP } from '../config';

describe('xpRequiredForLevel', () => {
  it('returns 0 for level <= 1 (level-1 is the starting state)', () => {
    expect(xpRequiredForLevel(1)).toBe(0);
    expect(xpRequiredForLevel(0)).toBe(0);
    expect(xpRequiredForLevel(-3)).toBe(0);
  });

  it('returns BASE_REQUIREMENT exactly at level 2', () => {
    // SCALING_FACTOR^0 = 1 → ceil(BASE × 1) = BASE
    expect(xpRequiredForLevel(2)).toBe(XP.BASE_REQUIREMENT);
  });

  it('grows monotonically across the curve', () => {
    let prev = -1;
    for (let L = 2; L <= XP.MAX_LEVEL; L++) {
      const cur = xpRequiredForLevel(L);
      expect(cur, `level ${L} should be > ${prev}`).toBeGreaterThan(prev);
      prev = cur;
    }
  });

  it('matches the BASE × SCALING^(L-2) formula at a sample mid-level', () => {
    // Spot-check level 10: ceil(12 × 1.17^8) = ceil(43.84..) = 44.
    const expected = Math.ceil(XP.BASE_REQUIREMENT * Math.pow(XP.SCALING_FACTOR, 8));
    expect(xpRequiredForLevel(10)).toBe(expected);
  });

  it('floors fractional level inputs', () => {
    // level 5.7 → 5
    expect(xpRequiredForLevel(5.7)).toBe(xpRequiredForLevel(5));
  });

  it('always returns an integer (UI bars and HUD prefer whole numbers)', () => {
    for (let L = 2; L <= XP.MAX_LEVEL; L++) {
      const v = xpRequiredForLevel(L);
      expect(Number.isInteger(v), `level ${L} XP should be integer, got ${v}`).toBe(true);
    }
  });
});

describe('totalXpToReachLevel', () => {
  it('returns 0 for level <= 1', () => {
    expect(totalXpToReachLevel(1)).toBe(0);
    expect(totalXpToReachLevel(0)).toBe(0);
  });

  it('matches xpRequiredForLevel(2) at target level 2', () => {
    expect(totalXpToReachLevel(2)).toBe(xpRequiredForLevel(2));
  });

  it('sums each rung — target 3 = req(2) + req(3)', () => {
    expect(totalXpToReachLevel(3)).toBe(xpRequiredForLevel(2) + xpRequiredForLevel(3));
  });

  it('reaching MAX_LEVEL is a meaningful but tractable amount', () => {
    const total = totalXpToReachLevel(XP.MAX_LEVEL);
    // Sanity bracket: not trivially small, not absurdly large. Pin a
    // loose order-of-magnitude window so a curve refactor that
    // accidentally halves or 10×s the requirement gets caught.
    expect(total).toBeGreaterThan(500);
    expect(total).toBeLessThan(10000);
  });
});
