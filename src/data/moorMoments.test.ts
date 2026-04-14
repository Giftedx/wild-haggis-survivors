import { describe, expect, it } from 'vitest';
import { createRNG } from '../utils/rng';
import { MOOR_MOMENTS, shuffleMoorMoments } from './moorMoments';

describe('moorMoments', () => {
  it('shuffle is deterministic for the same seed', () => {
    const a = shuffleMoorMoments(createRNG(42));
    const b = shuffleMoorMoments(createRNG(42));
    expect(a.map((m) => m.id)).toEqual(b.map((m) => m.id));
  });

  it('shuffle permutes all moment ids without loss', () => {
    const s = shuffleMoorMoments(createRNG(7));
    expect(s).toHaveLength(MOOR_MOMENTS.length);
    const ids = new Set(s.map((m) => m.id));
    expect(ids.size).toBe(MOOR_MOMENTS.length);
  });
});
