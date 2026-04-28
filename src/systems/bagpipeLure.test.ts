import { describe, expect, it } from 'vitest';
import {
  LURE_ENEMY_KEYS,
  LURE_PULL_PER_S,
  LURE_RADIUS_PX,
  computeBagpipeLureVector,
  type BagpipeLureSource,
} from './bagpipeLure';

const piper = (
  x: number,
  y: number,
  enemyKey: string = 'piper',
  active: boolean = true,
): BagpipeLureSource => ({ x, y, active, enemyKey });

describe('computeBagpipeLureVector', () => {
  it('returns zero when no sources are present', () => {
    expect(computeBagpipeLureVector(0, 0, [])).toEqual({ pullX: 0, pullY: 0 });
  });

  it('pulls toward a single in-range piper', () => {
    const v = computeBagpipeLureVector(0, 0, [piper(100, 0)]);
    expect(v.pullX).toBeCloseTo(LURE_PULL_PER_S, 5);
    expect(v.pullY).toBeCloseTo(0, 5);
  });

  it('ignores out-of-range pipers', () => {
    expect(computeBagpipeLureVector(
      0, 0, [piper(LURE_RADIUS_PX + 1, 0)],
    )).toEqual({ pullX: 0, pullY: 0 });
  });

  it('ignores inactive pipers (Phaser cull)', () => {
    expect(computeBagpipeLureVector(
      0, 0, [piper(50, 0, 'piper', false)],
    )).toEqual({ pullX: 0, pullY: 0 });
  });

  it('only pulls for enemy keys in LURE_ENEMY_KEYS', () => {
    expect(computeBagpipeLureVector(
      0, 0, [piper(50, 0, 'tourist')],
    )).toEqual({ pullX: 0, pullY: 0 });
    expect(computeBagpipeLureVector(
      0, 0, [piper(50, 0, 'midge')],
    )).toEqual({ pullX: 0, pullY: 0 });
  });

  it('pulls for piper / seelie_piper / unseelie_fiddler', () => {
    for (const key of LURE_ENEMY_KEYS) {
      const v = computeBagpipeLureVector(0, 0, [piper(50, 0, key)]);
      expect(v.pullX, `pull for ${key}`).toBeCloseTo(LURE_PULL_PER_S, 5);
    }
  });

  it('sums two pipers in the same direction (additive)', () => {
    const v = computeBagpipeLureVector(0, 0, [piper(100, 0), piper(80, 0)]);
    expect(v.pullX).toBeCloseTo(2 * LURE_PULL_PER_S, 5);
    expect(v.pullY).toBeCloseTo(0, 5);
  });

  it('partially cancels opposing pipers', () => {
    const v = computeBagpipeLureVector(0, 0, [piper(100, 0), piper(-100, 0)]);
    expect(v.pullX).toBeCloseTo(0, 5);
    expect(v.pullY).toBeCloseTo(0, 5);
  });

  it('skips co-located pipers (no NaN from div-by-zero)', () => {
    const v = computeBagpipeLureVector(50, 50, [piper(50, 50)]);
    expect(v.pullX).toBe(0);
    expect(v.pullY).toBe(0);
  });

  it('respects custom radius + pull-strength overrides', () => {
    const tight = computeBagpipeLureVector(0, 0, [piper(50, 0)], 30, 100);
    expect(tight).toEqual({ pullX: 0, pullY: 0 }); // 50 > 30 — out of range
    const loud = computeBagpipeLureVector(0, 0, [piper(20, 0)], 30, 100);
    expect(loud.pullX).toBeCloseTo(100, 5);
  });
});
