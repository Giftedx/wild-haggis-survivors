import { describe, it, expect } from 'vitest';
import { euclidean } from './PercussionLayer';

function toBits(pattern: boolean[]): string {
  return pattern.map(b => (b ? '1' : '0')).join('');
}

describe('euclidean', () => {
  it('E(0,8) → all rests', () => {
    expect(euclidean(0, 8)).toEqual(new Array(8).fill(false));
  });

  it('E(8,8) → all hits', () => {
    expect(euclidean(8, 8)).toEqual(new Array(8).fill(true));
  });

  it('E(1,8) → single hit at start', () => {
    const p = euclidean(1, 8);
    expect(p.length).toBe(8);
    expect(p.filter(Boolean).length).toBe(1);
    expect(p[0]).toBe(true);
  });

  it('E(3,8) → [10101000]', () => {
    expect(toBits(euclidean(3, 8))).toBe('10101000');
  });

  it('E(5,8) → [10101011]', () => {
    expect(toBits(euclidean(5, 8))).toBe('10101011');
  });

  it('E(2,8) → [10100000]', () => {
    expect(toBits(euclidean(2, 8))).toBe('10100000');
  });

  it('E(4,8) → evenly spaced [10101010]', () => {
    expect(toBits(euclidean(4, 8))).toBe('10101010');
  });

  it('always returns correct length', () => {
    for (let h = 0; h <= 8; h++) {
      expect(euclidean(h, 8).length).toBe(8);
    }
  });

  it('hit count matches requested hits', () => {
    for (let h = 0; h <= 8; h++) {
      expect(euclidean(h, 8).filter(Boolean).length).toBe(h);
    }
  });

  it('handles non-8 slot counts', () => {
    const p = euclidean(3, 16);
    expect(p.length).toBe(16);
    expect(p.filter(Boolean).length).toBe(3);
  });
});
